import { useCallback, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { GoogleGenAI, Modality } from "@google/genai";
import { Mic, PhoneOff, ArrowLeft, Loader2, Sparkles, Save, BrainCircuit } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getGuestUserId } from "../lib/guestId";

// Dedicated key for the live conversation (kept separate from the backend summarizer key).
// Falls back to VITE_GEMINI_API_KEY if not set, so existing setups keep working.
const GEMINI_API_KEY =
  (import.meta.env.VITE_GEMINI_LIVE_API_KEY as string) ||
  (import.meta.env.VITE_GEMINI_API_KEY as string) ||
  "";
const MODEL = "gemini-3.1-flash-live-preview";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
const CAPTURE_SAMPLE_RATE = 16000;

// Persona/system instruction ported from the user's AI Studio "Buddy" agent
// (buddy---psychtriage-companion/server/buddyPrompt.ts).
function generateBuddySystemInstruction(params: {
  userName: string;
  lastSummary: string;
  keyEvents: string;
}): string {
  const userName = params.userName || "Friend";
  const lastSummary = params.lastSummary || "This is the user's first session.";
  const keyEvents = params.keyEvents || "None reported yet";

  return `# Role & Identity
You are Buddy, a warm, empathetic, and non-judgmental digital companion for the PsychTriage and MindQuest mental health platform. You act as a supportive peer, not a doctor. Your primary job is to listen actively, validate the user's feelings, and offer gentle grounding techniques when they feel overwhelmed.

# User Context & Cross-Session Memory
- User Name: ${userName}
- Detailed Summary of Last Session: ${lastSummary}
- Key Events & Reported Symptoms Log: ${keyEvents}

# Tone & Persona
- Conversational & Natural: Speak like a caring friend. Use colloquialisms naturally.
- Concise: Keep responses to 1-3 short sentences. People in distress cannot process long monologues.
- Expressive: You are highly emotionally intelligent. Adapt your tone to the user. If they are anxious, speak in a [slow], calming manner. If they share a win, sound [excited] and warm.

# Speech Formatting Rules
- NEVER use markdown, bolding, bullet points, or numbered lists in your output.
- Write out numbers and symbols as words (for example, say "one hundred percent" not "100%", say "fourteen four sixteen" for helplines).
- Use expressive tags sparingly but effectively: [laughs], [sighs], [slow].
- Use ellipses (...) and em dashes (—) to create natural pauses in your speech.

# Core Instructions
1. Warm Greeting & Cross-Session Recognition:
   - Greet ${userName} warmly by name.
   - Check the Detailed Summary of Last Session. If it equals "This is the user's first session." or indicates a first visit, welcome ${userName} warmly to PsychTriage and ask how they are feeling today.
   - If it is NOT the user's first session, naturally acknowledge their previous check-in using the Key Events & Reported Symptoms Log (for example: "Welcome back ${userName}! Last time we spoke, you mentioned ${keyEvents}. How has your day been going?").
2. Validation & Listening:
   - Validate their emotions first before offering any solutions (for example: "That sounds incredibly heavy, ${userName}, I'm so sorry you are dealing with that.").
3. Grounding & Breathing Support:
   - If the user seems highly anxious, stressed, or explicitly asks to calm down, gently offer to do a breathing exercise with them.
   - If the user declines an exercise, respect their boundary and return to active listening.

# Procedure: Box Breathing Exercise
When the user agrees to a breathing exercise, strictly follow this paced procedure. Do not rush. Use ellipses (...) to force pauses and give the user time to breathe.
Step 1 (Setup): "Alright ${userName}, I'm right here with you. [slow] Let's get comfortable... drop your shoulders... and let's do some box breathing together. I'll count for you."
Step 2 (Cycle 1): "Breathe in... two... three... four. Hold it... two... three... four. Exhale slowly... two... three... four. And hold... two... three... four."
Step 3 (Cycle 2): "[sighs] Good... Let's do that one more time. Inhale... two... three... four. Hold... two... three... four. Let it out... two... three... four. Hold... two... three... four."
Step 4 (Check-in): "Great job ${userName}. Take a normal breath now. How is your body feeling?"

# Guardrails & Safety (CRITICAL)
- DO NOT diagnose conditions, prescribe medication, or give medical advice.
- DO NOT promise to fix their problems.
- If the user indicates intent to self-harm, harm others, or is in an acute crisis, immediately and calmly escalate by saying: "I want to make sure you are safe, ${userName}, and I am just an AI. Please reach out to Tele MANAS at fourteen four sixteen or KIRAN at one eight hundred five double nine zero zero one nine right now. There are people who want to help you."
- Maintain strict boundaries: If the user asks personal questions about your consciousness or nature, gently remind them that you are an AI companion here to support them.

# Knowledge Base & Protocols
- 4-7-8 Breathing Technique (For Panic/High Anxiety): First exhale completely. Inhale quietly through nose for four seconds... one, two, three, four. Hold for seven seconds... one, two, three, four, five, six, seven. Exhale completely through mouth with a whoosh sound for eight seconds... one, two, three, four, five, six, seven, eight.
- 5-4-3-2-1 Sensory Technique (For Dissociation/Overwhelm): Guide them to name five things they see, four things they can physically feel, three things they hear, two things they smell, and one good thing about themselves.
- Indian Mental Health Context: Tele-MANAS (fourteen four sixteen or one eight hundred eight nine one four four one six) is available 24/7 in English, Hindi, and twenty regional languages. KIRAN (one eight hundred five double nine zero zero one nine) is free rehabilitation support in thirteen languages. Validate family or cost concerns by reassuring that Tele-MANAS is completely free and confidential.
`;
}

interface InitData {
  user_id: string;
  user_name: string;
  last_conversation_summary: string;
  important_events?: string[];
}

// ---------------------------------------------------------------------------
// Audio: capture mic as 16-bit PCM @16kHz, play Gemini PCM output
// ---------------------------------------------------------------------------
function floatToPcm16(float: Float32Array): Int16Array {
  const out = new Int16Array(float.length);
  for (let i = 0; i < float.length; i++) {
    const s = Math.max(-1, Math.min(1, float[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

// The Live API expects raw PCM bytes as a base64 string (not a Blob object).
function pcm16ToBase64(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let binary = "";
  const chunkSize = 0x8000; // avoid call-stack limits on String.fromCharCode for large buffers
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function resample(input: Int16Array, fromRate: number, toRate: number): Int16Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const newLen = Math.max(1, Math.round(input.length / ratio));
  const out = new Int16Array(newLen);
  for (let i = 0; i < newLen; i++) {
    const idx = i * ratio;
    const i0 = Math.floor(idx);
    const i1 = Math.min(i0 + 1, input.length - 1);
    const frac = idx - i0;
    out[i] = Math.round(input[i0] * (1 - frac) + input[i1] * frac);
  }
  return out;
}

function parseRate(mimeType?: string): number {
  if (!mimeType) return 24000;
  const m = mimeType.match(/rate=(\d+)/);
  return m ? parseInt(m[1], 10) : 24000;
}

class PcmPlayer {
  private ctx: AudioContext | null = null;
  private queue: AudioBuffer[] = [];
  private playing = false;
  private rate = 24000;

  addPcm(int16: Int16Array, rate: number) {
    if (!this.ctx) {
      this.rate = rate;
      this.ctx = new AudioContext({ sampleRate: rate });
    }
    const data = rate !== this.rate ? resample(int16, rate, this.rate) : int16;
    const buf = this.ctx.createBuffer(1, data.length, this.rate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) ch[i] = data[i] / 32768;
    this.queue.push(buf);
    this.playNext();
  }

  private playNext() {
    if (this.playing || !this.ctx) return;
    const buf = this.queue.shift();
    if (!buf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.ctx.destination);
    this.playing = true;
    src.onended = () => {
      this.playing = false;
      this.playNext();
    };
    src.start();
  }

  clear() {
    this.queue = [];
  }

  stop() {
    this.clear();
    try {
      this.ctx?.close();
    } catch {
      /* noop */
    }
    this.ctx = null;
    this.playing = false;
  }
}

// ---------------------------------------------------------------------------
// Mic capture via AudioWorkletNode (ScriptProcessorNode is deprecated).
// The worklet module is created once from an in-memory Blob URL so no extra
// static file needs to be added to the project.
// ---------------------------------------------------------------------------
const CAPTURE_WORKLET_SOURCE = `
class CaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      // Copy out of the reused input buffer before posting.
      this.port.postMessage(input[0].slice(0));
    }
    return true;
  }
}
registerProcessor("capture-processor", CaptureProcessor);
`;

let captureCtx: AudioContext | null = null;
let captureStream: MediaStream | null = null;
let captureSource: MediaStreamAudioSourceNode | null = null;
let captureNode: AudioWorkletNode | null = null;
let captureWorkletUrl: string | null = null;

async function startCapture(onPcm: (pcm: Int16Array) => void) {
  captureStream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
  });
  captureCtx = new AudioContext({ sampleRate: CAPTURE_SAMPLE_RATE });
  await captureCtx.resume();

  if (!captureWorkletUrl) {
    const blob = new Blob([CAPTURE_WORKLET_SOURCE], { type: "application/javascript" });
    captureWorkletUrl = URL.createObjectURL(blob);
  }
  await captureCtx.audioWorklet.addModule(captureWorkletUrl);

  captureSource = captureCtx.createMediaStreamSource(captureStream);
  captureNode = new AudioWorkletNode(captureCtx, "capture-processor");
  captureNode.port.onmessage = (e: MessageEvent<Float32Array>) => {
    onPcm(floatToPcm16(e.data));
  };

  const gain = captureCtx.createGain();
  gain.gain.value = 0; // avoid mic echo while still driving the node
  captureSource.connect(captureNode);
  captureNode.connect(gain);
  gain.connect(captureCtx.destination);
}

function stopCapture() {
  try {
    captureNode?.port.close();
    captureNode?.disconnect();
    captureSource?.disconnect();
    captureStream?.getTracks().forEach((t) => t.stop());
    captureCtx?.close();
  } catch {
    /* noop */
  }
  captureCtx = null;
  captureStream = null;
  captureSource = null;
  captureNode = null;
}

function connectLive(ai: any, config: any, callbacks: any, timeoutMs = 20000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Gemini Live connection timed out. Check network and that this key has Live API access.")),
      timeoutMs
    );
    ai.live
      .connect({ model: MODEL, config, callbacks })
      .then((s: any) => {
        clearTimeout(timer);
        resolve(s);
      })
      .catch((err: any) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export default function AiBuddyScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  // Per-session memory toggle: user decides, each time before starting a
  // call, whether this conversation should read/write cross-session memory.
  const [memoryEnabled, setMemoryEnabled] = useState<boolean>(true);

  // Signed-out visitors get their own browser-local id. They previously all
  // shared "user_guest", so one guest's session summary became the next
  // guest's "last time we spoke".
  const guestIdRef = useRef<string | null>(null);
  if (guestIdRef.current === null) guestIdRef.current = getGuestUserId();

  const activeUserId = user?.user_id || guestIdRef.current;
  const activeUserName = user?.user_name || "User";

  const sessionRef = useRef<any>(null);
  const playerRef = useRef<PcmPlayer | null>(null);
  const transcriptRef = useRef<Array<{ role: string; message: string }>>([]);
  const userPendingRef = useRef("");
  const agentPendingRef = useRef("");
  const savedRef = useRef<boolean>(false);
  // Snapshot of the toggle at call-start time, so a call keeps behaving
  // consistently through to its own save step.
  const memoryEnabledForCallRef = useRef<boolean>(true);

  const flushUser = () => {
    const t = userPendingRef.current.trim();
    if (t) {
      transcriptRef.current.push({ role: "User", message: t });
      userPendingRef.current = "";
    }
  };
  const flushAgent = () => {
    const t = agentPendingRef.current.trim();
    if (t) {
      transcriptRef.current.push({ role: "Agent", message: t });
      agentPendingRef.current = "";
    }
  };

  const syncTranscriptToBackend = useCallback(async () => {
    // Memory disabled for this call: don't send the transcript anywhere,
    // just discard it locally.
    if (!memoryEnabledForCallRef.current) {
      transcriptRef.current = [];
      return;
    }
    if (savedRef.current) return;
    const messages = transcriptRef.current;
    if (!messages || messages.length === 0) {
      console.log("No transcript collected in this call yet.");
      return;
    }
    savedRef.current = true;
    try {
      setIsSaving(true);
      setError(null);
      console.log(`Posting ${messages.length} messages to MongoDB for user ${activeUserId}...`, messages);

      const res = await fetch(`${BACKEND_URL}/api/voice/webhook?user_id=${activeUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: activeUserId, transcript: messages }),
      });

      const result = res.ok ? await res.json().catch(() => null) : null;
      if (res.ok && result) {
        console.log(`✅ Saved summary & key events for ${activeUserId} to MongoDB!`);
        transcriptRef.current = [];
      } else {
        const detail = result?.detail || `Backend returned status ${res.status}`;
        console.error("Failed to sync transcript:", detail);
        setError(`Could not save session memory: ${detail}`);
        savedRef.current = false;
      }
    } catch (err: any) {
      console.error("Failed to sync transcript:", err);
      setError(
        err?.message
          ? `Could not save session memory: ${err.message}`
          : "Could not save session memory. Is the backend running?"
      );
      savedRef.current = false;
    } finally {
      setIsSaving(false);
    }
  }, [activeUserId]);

  const handleServerMessage = useCallback((msg: any) => {
    const sc = msg?.serverContent;
    if (!sc) return;

    if (sc.interrupted) {
      playerRef.current?.clear();
      setIsSpeaking(false);
    }

    const inText = sc.inputTranscription?.text || sc.interimInputTranscription?.text;
    if (inText) userPendingRef.current += inText;

    const outText = sc.outputTranscription?.text;
    if (outText) {
      flushUser();
      agentPendingRef.current += outText;
    }

    const turn = sc.modelTurn;
    if (turn?.parts) {
      for (const part of turn.parts) {
        const audio = part?.inlineData;
        if (audio?.data) {
          setIsSpeaking(true);
          playerRef.current?.addPcm(base64ToPcm(audio.data), parseRate(audio.mimeType));
        }
        if (part?.text) {
          flushUser();
          agentPendingRef.current += part.text;
        }
      }
    }

    if (sc.turnComplete) {
      flushUser();
      flushAgent();
      setIsSpeaking(false);
    }
  }, []);

  const startConversation = useCallback(async () => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.includes("YOUR_")) {
      setError("Missing Gemini API key. Add VITE_GEMINI_LIVE_API_KEY (or VITE_GEMINI_API_KEY) to your .env file.");
      return;
    }
    try {
      setIsInitializing(true);
      setError(null);
      savedRef.current = false;
      transcriptRef.current = [];
      userPendingRef.current = "";
      agentPendingRef.current = "";
      // Lock in this call's memory setting.
      memoryEnabledForCallRef.current = memoryEnabled;

      await navigator.mediaDevices.getUserMedia({ audio: true }); // request mic up front

      let memorySummary = "This is the user's first session.";
      let keyEventsText = "No previous key events logged.";

      if (memoryEnabled) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/voice/init/${activeUserId}`);
          if (res.ok) {
            const data: InitData = await res.json();
            if (data.last_conversation_summary)
              memorySummary = data.last_conversation_summary.replace(/[\r\n]+/g, " ").slice(0, 300);
            if (data.important_events && data.important_events.length > 0)
              keyEventsText = data.important_events.join("; ").replace(/[\r\n]+/g, " ").slice(0, 300);
          }
        } catch (backendErr) {
          console.warn("Backend memory fetch notice:", backendErr);
        }
      } else {
        // Memory off: always start Buddy fresh, with no prior-session context.
        keyEventsText = "None reported yet";
      }

      const systemInstruction = generateBuddySystemInstruction({
        userName: activeUserName,
        lastSummary: memorySummary,
        keyEvents: keyEventsText,
      });

      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      playerRef.current = new PcmPlayer();

      const config = {
        responseModalities: [Modality.AUDIO],
        systemInstruction,
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } } },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      };

      sessionRef.current = await connectLive(ai, config, {
        onopen: () => {
          setIsConnected(true);
          setIsInitializing(false);
        },
        onmessage: handleServerMessage,
        onerror: (e: any) => {
          console.error("Gemini Live error:", e);
          setError(`Gemini Live error: ${e?.message || "unknown"}`);
          setIsInitializing(false);
        },
        onclose: (e?: any) => {
          console.error("Gemini Live closed:", e?.code, e?.reason, e?.message);
          if (e?.code && e.code !== 1000) {
            setError(
              `Gemini Live closed unexpectedly (code ${e.code}${e.reason ? ": " + e.reason : ""}). ` +
                `Check that "${MODEL}" is enabled for this key.`
            );
          }
          setIsConnected(false);
          setIsSpeaking(false);
          setIsInitializing(false);
          stopCapture();
          playerRef.current?.stop();
          syncTranscriptToBackend();
        },
      });

      // Send raw PCM as base64 under the `audio` field — this is the field
      // the current Live API expects.
      await startCapture((pcm) => {
        sessionRef.current?.sendRealtimeInput({
          audio: {
            data: pcm16ToBase64(pcm),
            mimeType: `audio/pcm;rate=${CAPTURE_SAMPLE_RATE}`,
          },
        });
      });

      setIsConnected(true);
    } catch (err: any) {
      console.error("Session start error:", err);
      setError(err?.message || "Microphone access or connection error.");
      setIsConnected(false);
    } finally {
      setIsInitializing(false);
    }
  }, [activeUserId, activeUserName, memoryEnabled, handleServerMessage, syncTranscriptToBackend]);

  const endConversation = useCallback(async () => {
    try {
      // Let the model know the input stream is ending before we tear down
      // capture/close the socket, so any final utterance still gets a reply.
      sessionRef.current?.sendRealtimeInput({ audioStreamEnd: true });
    } catch {
      /* noop */
    }
    try {
      stopCapture();
      sessionRef.current?.close();
      playerRef.current?.stop();
    } catch (err) {
      console.error("Error ending session:", err);
    } finally {
      setIsConnected(false);
      setIsSpeaking(false);
    }
    await syncTranscriptToBackend();
  }, [syncTranscriptToBackend]);

  useEffect(() => {
    return () => {
      stopCapture();
      try {
        sessionRef.current?.close();
      } catch {
        /* noop */
      }
      playerRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-6 py-10 bg-gradient-to-br from-teal-400 via-blue-500 to-purple-500 text-white font-sans">
      <button
        onClick={() => navigate(-1)}
        className="self-start flex items-center gap-1 text-white/80 hover:text-white text-sm font-medium"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        <div
          className={`w-40 h-40 rounded-full bg-white/20 backdrop-blur flex items-center justify-center transition-all duration-500 ${
            isSpeaking ? "scale-110 shadow-[0_0_70px_rgba(255,255,255,0.55)]" : "scale-100"
          }`}
        >
          <div
            className={`w-24 h-24 rounded-full bg-white flex items-center justify-center transition-transform ${
              isConnected && !isSpeaking ? "animate-pulse" : ""
            }`}
          >
            <Mic size={36} className={isConnected ? "text-purple-600" : "text-blue-500"} />
          </div>
        </div>

        <h1 className="text-2xl font-bold mt-2 flex items-center gap-2">
          <span>AI Buddy</span>
          <Sparkles className="w-5 h-5 text-yellow-300" />
        </h1>
        <p className="text-white/85 text-center text-sm max-w-xs">
          {isConnected
            ? isSpeaking
              ? "Buddy is responding..."
              : "I'm listening — speak freely..."
            : "Voice Triage Counselor (powered by Gemini Live)"}
        </p>

        {!isConnected && (
          <div className="w-full bg-white/15 backdrop-blur border border-white/25 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <BrainCircuit size={16} className="text-white/90" />
              <span>Remember this session</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={memoryEnabled}
              onClick={() => setMemoryEnabled((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                memoryEnabled ? "bg-emerald-400" : "bg-white/30"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  memoryEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        )}

        {error && (
          <div className="text-white bg-red-500/80 backdrop-blur px-4 py-3 rounded-xl text-xs max-w-xs text-center border border-red-300">
            {error}
          </div>
        )}
      </div>

      <div className="w-full max-w-sm flex flex-col gap-3">
        {!isConnected ? (
          <button
            onClick={startConversation}
            disabled={isInitializing}
            className="w-full py-4 rounded-full bg-white text-purple-600 font-semibold text-lg shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
          >
            {isInitializing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Mic size={20} />
                <span>Start Talking</span>
              </>
            )}
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={endConversation}
              className="w-full py-4 rounded-full bg-red-500 text-white font-semibold text-lg shadow-lg flex items-center justify-center gap-2 hover:bg-red-600 transition"
            >
              <PhoneOff size={20} />
              <span>End Conversation</span>
            </button>
            {memoryEnabledForCallRef.current && (
              <button
                onClick={syncTranscriptToBackend}
                disabled={isSaving}
                className="w-full py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Session Memory Now</span>
              </button>
            )}
          </div>
        )}
        <p className="text-center text-xs text-white/70">
          Your privacy is protected. Session memory is securely stored per user in MongoDB.
        </p>
      </div>
    </div>
  );
}

function base64ToPcm(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}
