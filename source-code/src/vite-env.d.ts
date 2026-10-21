/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** ElevenLabs Conversational AI agent id used by the AI Buddy screen. */
  readonly VITE_ELEVENLABS_AGENT_ID?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_APP_ENV?: string;
  readonly VITE_GOOGLE_ANALYTICS_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
