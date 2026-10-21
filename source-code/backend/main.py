import os
import logging
import hmac
import hashlib
import json
import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime

from fastapi import FastAPI, HTTPException, Request, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError
import httpx
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# BUG FIX 1: load_dotenv() with no path only reads .env from the process's
# current working directory. If uvicorn is ever launched from the repo root
# instead of `backend/`, GEMINI_API_KEY / MONGODB_URI silently load as empty
# and everything falls back to defaults with NO error printed. Anchoring the
# path to this file's own directory makes env loading independent of cwd.
# ---------------------------------------------------------------------------
ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "Mindquest")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_SUMMARY_MODEL", "gemini-2.5-flash")
ELEVENLABS_WEBHOOK_SECRET = os.getenv("ELEVENLABS_WEBHOOK_SECRET", "")
# Guards /api/users. That route returns every user's conversation summaries, so
# it stays switched OFF unless this is explicitly set — failing closed rather
# than open, because the data it exposes is mental-health session content.
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("psychtriage-backend")

if not ENV_PATH.exists():
    logger.warning(f"No .env file found at {ENV_PATH}. Relying on process environment variables only.")

if not GEMINI_API_KEY or "YOUR_" in GEMINI_API_KEY:
    logger.warning(
        "GEMINI_API_KEY is missing or looks like a placeholder. "
        "The memory summarizer will ALWAYS fall back to build_local_summary() until this is set."
    )

# Note: gemini-2.5-flash is scheduled to be retired by Google in Oct 2026.
# Set GEMINI_SUMMARY_MODEL in .env to move to a newer model without a code change.


class Database:
    client: Optional[AsyncIOMotorClient] = None

db_container = Database()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Connecting to MongoDB at {MONGODB_URI.split('@')[-1] if '@' in MONGODB_URI else MONGODB_URI}")
    db_container.client = AsyncIOMotorClient(MONGODB_URI)
    # BUG FIX 3 (partial): Motor connects lazily, so a bad URI/rotated password
    # previously wouldn't surface until the first request failed with an opaque
    # error. Ping on startup so a broken Mongo connection is loud and immediate.
    try:
        await db_container.client.admin.command("ping")
        logger.info("✅ MongoDB ping succeeded — connection is healthy.")
    except PyMongoError as e:
        logger.error(f"❌ MongoDB ping FAILED at startup: {e}. Check MONGODB_URI / network access list / credentials.")
    yield
    if db_container.client:
        logger.info("Closing MongoDB connection")
        db_container.client.close()

app = FastAPI(title="PsychTriage Voice API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    # allow_credentials=True combined with allow_origins=["*"] is a known
    # browser/CORS spec mismatch (browsers ignore the wildcard for credentialed
    # requests). The frontend fetch calls here don't send cookies/credentials,
    # so this is switched off to avoid confusing, silent CORS failures if that
    # ever changes.
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_database():
    if db_container.client is None:
        raise HTTPException(status_code=500, detail="Database client not initialized")
    return db_container.client[DB_NAME]

# Pydantic Schemas
class InitResponse(BaseModel):
    user_id: str
    user_name: str
    last_conversation_summary: str
    important_events: List[str] = []

class WebhookResponse(BaseModel):
    status: str
    user_id: str
    summary: str
    important_events: List[str] = []

class GoogleAuthRequest(BaseModel):
    user_id: str
    user_name: str
    email: str
    picture: Optional[str] = None


# ==========================================
# ROUTE 0: Debug — verify config without exposing secrets
# ==========================================
@app.get("/api/debug/config")
async def debug_config():
    """
    Dev-only helper to check which parts of the memory pipeline are actually
    configured, without leaking secret values. Hit this first when the memory
    workflow seems broken — it tells you which link in the chain is missing.
    """
    mongo_ok = False
    mongo_error = None
    try:
        if db_container.client is not None:
            await db_container.client.admin.command("ping")
            mongo_ok = True
    except PyMongoError as e:
        mongo_error = str(e)

    return {
        "env_file_found": ENV_PATH.exists(),
        "env_file_path": str(ENV_PATH),
        "gemini_api_key_set": bool(GEMINI_API_KEY) and "YOUR_" not in GEMINI_API_KEY,
        "gemini_model": GEMINI_MODEL,
        "elevenlabs_webhook_secret_set": bool(ELEVENLABS_WEBHOOK_SECRET),
        "mongo_uri_host": MONGODB_URI.split("@")[-1] if "@" in MONGODB_URI else MONGODB_URI,
        "mongo_db_name": DB_NAME,
        "mongo_connection_ok": mongo_ok,
        "mongo_connection_error": mongo_error,
    }


# ==========================================
# ROUTE 1: User Registration / Login
# ==========================================
@app.post("/api/auth/google")
async def google_auth(body: GoogleAuthRequest):
    """
    Registers or updates a user in MongoDB.
    """
    db = get_database()
    now = datetime.utcnow()

    try:
        existing = await db["users"].find_one({"user_id": body.user_id})

        if not existing:
            user_doc = {
                "user_id": body.user_id,
                "user_name": body.user_name,
                "email": body.email,
                "picture": body.picture,
                "last_conversation_summary": "This is the user's first session.",
                "last_important_events": [],
                "session_history": [],
                "all_important_events": [],
                "created_at": now,
                "last_login": now
            }
            await db["users"].insert_one(user_doc)
            logger.info(f"✅ Registered NEW user in MongoDB: {body.user_name} ({body.user_id})")
        else:
            update_fields = {
                "user_name": body.user_name,
                "email": body.email,
                "picture": body.picture,
                "last_login": now
            }
            if "last_important_events" not in existing:
                update_fields["last_important_events"] = []
            if "session_history" not in existing:
                update_fields["session_history"] = []
            if "all_important_events" not in existing:
                update_fields["all_important_events"] = []

            await db["users"].update_one(
                {"user_id": body.user_id},
                {"$set": update_fields}
            )
            logger.info(f"✅ Updated existing user in MongoDB: {body.user_name} ({body.user_id})")
    except PyMongoError as e:
        logger.error(f"MongoDB error in google_auth for {body.user_id}: {e}")
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")

    return {"status": "success", "user_id": body.user_id}


# ==========================================
# ROUTE 2: Voice Session Initialization
# ==========================================
@app.get("/api/voice/init/{user_id}", response_model=InitResponse)
async def init_voice_session(user_id: str):
    """
    Queries MongoDB for a user and returns user_name, 5-6 line summary, and key events log.
    """
    db = get_database()
    DEFAULT_SUMMARY = "This is the user's first session."

    try:
        user = await db["users"].find_one({"user_id": user_id})
    except PyMongoError as e:
        logger.error(f"MongoDB error in init_voice_session for {user_id}: {e}")
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")

    if not user:
        logger.info(f"User {user_id} not found in MongoDB. Returning default initialization data.")
        return InitResponse(
            user_id=user_id,
            user_name="User",
            last_conversation_summary=DEFAULT_SUMMARY,
            important_events=[]
        )

    summary = user.get("last_conversation_summary") or DEFAULT_SUMMARY
    user_name = user.get("user_name", "User")
    events = user.get("last_important_events") or []

    return InitResponse(
        user_id=user_id,
        user_name=user_name,
        last_conversation_summary=summary,
        important_events=events
    )


# ==========================================
# ROUTE 3: Admin / Debug List All Users
# ==========================================
@app.get("/api/users")
async def list_all_users(x_admin_key: Optional[str] = Header(None, alias="x-admin-key")):
    """
    Admin-only roster of registered users.

    This route used to be fully open. Combined with `allow_origins=["*"]`, that
    meant anyone — including any third-party web page — could read every user's
    name, email and conversation summaries off a public URL. Those summaries are
    mental-health session content, so the route now requires ADMIN_API_KEY and
    returns only non-sensitive identity fields.
    """
    if not ADMIN_API_KEY:
        # No key configured: stay disabled instead of silently serving the data.
        raise HTTPException(status_code=404, detail="Not found")

    if not x_admin_key or not hmac.compare_digest(x_admin_key, ADMIN_API_KEY):
        logger.warning("Rejected /api/users request with missing or invalid admin key.")
        raise HTTPException(status_code=401, detail="Invalid or missing admin key")

    db = get_database()
    try:
        # Projection is an allow-list, not a deny-list: conversation summaries,
        # session_history and all_important_events are never returned here.
        cursor = db["users"].find(
            {},
            {"_id": 0, "user_id": 1, "user_name": 1, "created_at": 1, "last_login": 1},
        )
        users_list = await cursor.to_list(length=100)
    except PyMongoError as e:
        logger.error(f"MongoDB error in list_all_users: {e}")
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")
    return {"total_users": len(users_list), "users": users_list}


# ==========================================
# Helper: Summarize & Extract Events via Gemini (JSON Mode + Retry)
# ==========================================
def build_local_summary(transcript_text: str) -> Dict[str, Any]:
    """
    Fallback used when Gemini is unavailable. Derives a readable, transcript-based
    summary so the user's conversation is never silently discarded.
    """
    lines = [ln.strip() for ln in transcript_text.split("\n") if ln.strip()]
    preview = "\n".join(lines[:6]).strip()
    if not preview:
        preview = "Voice check-in call completed."
    return {
        "summary": f"Summary (auto-generated, Gemini unavailable):\n{preview}",
        "important_events": ["Voice check-in call completed."],
    }


async def generate_summary_with_gemini(transcript_text: str) -> Dict[str, Any]:
    """
    Passes transcript to Gemini using structured JSON mode with automatic retries.
    Generates:
    1. A detailed 5 to 6 line summary paragraph.
    2. A structured array of key important events (triggers, symptoms, life incidents, breakthroughs).
    """
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not provided in backend/.env. Using transcript-based fallback summary.")
        return build_local_summary(transcript_text)

    prompt = (
        "You are an expert clinical AI assistant for PsychTriage, a mental health triage platform.\n"
        "Analyze the following conversation transcript between a user and a voice AI counselor.\n\n"
        "Output your response strictly as a JSON object with the following exact keys:\n"
        "{\n"
        '  "summary": "Write a comprehensive 5 to 6 line paragraph summarizing the user\'s emotional state, main mental health concerns, reported symptoms, and coping strategies discussed.",\n'
        '  "important_events": [\n'
        '    "Detailed bullet point of key event 1 (e.g. panic attack trigger, work deadline, insomnia, family argument, or breakthrough)",\n'
        '    "Detailed bullet point of key event 2",\n'
        '    "Detailed bullet point of key event 3"\n'
        '  ]\n'
        "}\n\n"
        f"TRANSCRIPT:\n{transcript_text}"
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "response_mime_type": "application/json",
            "maxOutputTokens": 1200,
            "temperature": 0.2
        }
    }

    async with httpx.AsyncClient(timeout=25.0) as client:
        last_error = None
        for attempt in range(3):
            try:
                response = await client.post(url, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()

                    if raw_text.startswith("```"):
                        raw_text = raw_text.replace("```json", "").replace("```", "").strip()

                    parsed = json.loads(raw_text)

                    summary_val = parsed.get("summary", "")
                    events_val = parsed.get("important_events", [])

                    if isinstance(events_val, str):
                        events_val = [events_val]

                    if not events_val:
                        events_val = ["Voice check-in call completed."]

                    return {
                        "summary": summary_val if summary_val else "User discussed mental health check-in symptoms during voice call.",
                        "important_events": events_val
                    }
                else:
                    # BUG FIX 2: previously only the status code was logged, so a
                    # bad API key (400/403), wrong model name (404), or quota
                    # exhaustion (429) all looked identical in the logs and were
                    # indistinguishable from a transient network blip. Logging
                    # the response body makes the actual cause visible.
                    logger.warning(
                        f"Gemini API attempt {attempt + 1} returned status {response.status_code}: "
                        f"{response.text[:500]}. Retrying..."
                    )
                    await asyncio.sleep(1.5)
            except Exception as e:
                last_error = e
                logger.warning(f"Gemini API attempt {attempt + 1} failed: {e}. Retrying...")
                await asyncio.sleep(1.5)

        logger.error(f"All Gemini API attempts failed: {last_error}. Falling back to transcript-based summary.")
        return build_local_summary(transcript_text)


# ==========================================
# ROUTE 4: Post-Call Webhook (ElevenLabs OR direct frontend call)
# ==========================================
@app.post("/api/voice/webhook", response_model=WebhookResponse)
async def voice_webhook(
    request: Request,
    user_id_param: Optional[str] = Query(None, alias="user_id"),
    elevenlabs_signature: Optional[str] = Header(None, alias="elevenlabs-signature")
):
    """
    Receives a post-call transcript payload — either from ElevenLabs' webhook
    (HMAC-signed) or directly from the frontend's Gemini Live flow (no
    signature header, since it's a same-origin browser call, not a
    third-party webhook). Generates a 5-6 line summary & key events via
    Gemini, and updates MongoDB.
    """
    raw_body = await request.body()

    if ELEVENLABS_WEBHOOK_SECRET and elevenlabs_signature:
        try:
            parts = dict(pair.split("=", 1) for pair in elevenlabs_signature.split(","))
            timestamp = parts.get("t", "")
            signature = parts.get("v1", "")

            signed_payload = f"{timestamp}.{raw_body.decode('utf-8')}"
            expected_sig = hmac.new(
                ELEVENLABS_WEBHOOK_SECRET.encode("utf-8"),
                signed_payload.encode("utf-8"),
                hashlib.sha256
            ).hexdigest()

            if not hmac.compare_digest(signature, expected_sig):
                logger.warning("Invalid ElevenLabs Webhook Signature")
                raise HTTPException(status_code=401, detail="Invalid webhook signature")
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            logger.error(f"Error checking webhook signature: {e}")

    try:
        body = json.loads(raw_body.decode("utf-8")) if raw_body else {}
    except Exception:
        body = {}

    logger.info(f"Received webhook payload: {body}")

    user_id = (
        user_id_param
        or body.get("user_id")
        or body.get("custom_data", {}).get("user_id")
        or body.get("dynamic_variables", {}).get("user_id")
        or body.get("telemetry", {}).get("user_id")
        or body.get("conversation", {}).get("user_id")
        or "default_user"
    )

    raw_transcript = (
        body.get("transcript")
        or body.get("conversation", {}).get("transcript")
        or (body.get("conversation", {}).get("conversation", {}) or {}).get("transcript")
        or []
    )

    def _extract_message_text(msg: Dict[str, Any]) -> str:
        # Accept ElevenLabs (content), generic (message/text), and formatted variants
        val = (
            msg.get("message")
            or msg.get("text")
            or msg.get("content")
            or msg.get("transcript")
            or ""
        )
        if isinstance(val, dict):
            val = (
                val.get("text")
                or val.get("message")
                or val.get("content")
                or str(val)
            )
        elif isinstance(val, list):
            parts = []
            for p in val:
                if isinstance(p, str):
                    parts.append(p)
                elif isinstance(p, dict):
                    parts.append(
                        p.get("text") or p.get("message") or p.get("content") or ""
                    )
            val = " ".join([p for p in parts if p])
        return str(val).strip()

    transcript_text = ""
    if isinstance(raw_transcript, list):
        lines = []
        for msg in raw_transcript:
            if isinstance(msg, dict):
                role = (msg.get("role") or msg.get("source") or "speaker").capitalize()
                val_str = _extract_message_text(msg)
                if val_str:
                    lines.append(f"{role}: {val_str}")
            elif isinstance(msg, str) and msg.strip():
                lines.append(msg.strip())
        transcript_text = "\n".join(lines)
    elif isinstance(raw_transcript, str):
        transcript_text = raw_transcript

    logger.info(f"Parsed transcript text ({len(transcript_text)} chars): {transcript_text[:200]}...")

    if not transcript_text or transcript_text == "[]":
        logger.warning("Empty transcript provided in webhook payload.")
        return WebhookResponse(
            status="skipped",
            user_id=user_id,
            summary="No speech recorded in session.",
            important_events=[]
        )

    # 1. Generate 5-6 line summary + important events log using Gemini
    result = await generate_summary_with_gemini(transcript_text)
    summary_text = result["summary"]
    events_list = result["important_events"]

    db = get_database()
    now = datetime.utcnow()

    session_entry = {
        "session_id": str(now.timestamp()),
        "timestamp": now,
        "summary": summary_text,
        "important_events": events_list
    }

    # 2. Store in MongoDB with accumulated history & key events
    try:
        await db["users"].update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "user_id": user_id,
                    "last_conversation_summary": summary_text,
                    "last_important_events": events_list,
                    "updated_at": now
                },
                "$push": {
                    "session_history": session_entry,
                    "all_important_events": {"$each": events_list}
                }
            },
            upsert=True
        )
    except PyMongoError as e:
        logger.error(f"MongoDB error saving session for {user_id}: {e}")
        raise HTTPException(status_code=503, detail=f"Failed to save session memory: {e}")

    used_fallback = summary_text.startswith("Summary (auto-generated, Gemini unavailable)")
    logger.info(
        f"{'⚠️ (fallback summary)' if used_fallback else '✅'} Saved summary & "
        f"{len(events_list)} key events for user {user_id} in MongoDB"
    )

    return WebhookResponse(
        status="success",
        user_id=user_id,
        summary=summary_text,
        important_events=events_list
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)