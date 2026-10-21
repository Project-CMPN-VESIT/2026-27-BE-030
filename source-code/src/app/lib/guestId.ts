const GUEST_ID_KEY = "psychtriage_guest_id";

/**
 * A stable, per-browser id for signed-out visitors.
 *
 * Every guest used to be sent to the backend as the literal string
 * "user_guest", which meant they all shared a single MongoDB document: one
 * guest's conversation summary was read back as another guest's "last session",
 * and Buddy would greet a stranger with someone else's disclosures. Since the
 * login screen offers "Skip for now & preview as Guest", that was the default
 * path for anyone trying the app.
 *
 * The id lives only in this browser's localStorage. It is not an account and
 * carries no authentication weight — it exists so two different guests do not
 * collide in the same record.
 */
export function getGuestUserId(): string {
  if (typeof window === "undefined") return "guest_ssr";

  try {
    const existing = window.localStorage.getItem(GUEST_ID_KEY);
    // Guard against an empty or truncated value from a previous session.
    if (existing && /^guest_[0-9a-z]{8,}$/.test(existing)) return existing;

    const fresh = `guest_${randomToken()}`;
    window.localStorage.setItem(GUEST_ID_KEY, fresh);
    return fresh;
  } catch {
    // Private mode or blocked storage: fall back to a per-tab id. Memory will
    // not persist across reloads, which is the correct failure here — better
    // than sharing one record between unrelated people.
    return `guest_${randomToken()}`;
  }
}

/** Clears the guest id, so "start fresh" really does start fresh. */
export function resetGuestUserId(): void {
  try {
    window.localStorage.removeItem(GUEST_ID_KEY);
  } catch {
    /* noop */
  }
}

function randomToken(): string {
  const bytes = new Uint8Array(12);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  // Base36 keeps the id URL-safe: it is interpolated into /api/voice/init/{id}.
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("");
}
