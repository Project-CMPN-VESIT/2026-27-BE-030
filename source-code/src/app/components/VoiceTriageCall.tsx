import React, { useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { Mic, MicOff, Loader2, Volume2, AlertCircle, Sparkles, User, Calendar } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getGuestUserId } from "../lib/guestId";

interface VoiceTriageCallProps {
  userId?: string;
  agentId?: string;
  backendUrl?: string;
}

interface InitData {
  user_id: string;
  user_name: string;
  last_conversation_summary: string;
  important_events?: string[];
}

export const VoiceTriageCall: React.FC<VoiceTriageCallProps> = ({
  userId: propUserId,
  agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID || "YOUR_ELEVENLABS_AGENT_ID",
  backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000",
}) => {
  const { user } = useAuth();

  // Per-browser guest id rather than a shared "user_guest" record — see
  // src/app/lib/guestId.ts.
  const activeUserId = user?.user_id || propUserId || getGuestUserId();
  const activeUserName = user?.user_name || "User";

  const [loading, setLoading] = useState<boolean>(false);
  const [initData, setInitData] = useState<InitData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => console.log("Connected to ElevenLabs Conversational AI"),
    onDisconnect: () => console.log("Disconnected from ElevenLabs"),
    onMessage: (msg) => console.log("Received message:", msg),
    onError: (err) => {
      console.error("ElevenLabs SDK Error:", err);
      setErrorMessage("Voice connection error occurred.");
    },
  });

  const isConnected = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

  const handleStartCall = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      // Fetch 5-6 line summary & key events log from FastAPI + MongoDB
      const res = await fetch(`${backendUrl}/api/voice/init/${activeUserId}`);
      if (!res.ok) {
        throw new Error(`Initialization failed with status ${res.status}`);
      }
      const data: InitData = await res.json();
      
      if (user?.user_name) {
        data.user_name = user.user_name;
      }
      setInitData(data);

      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Pass detailed summary & key events list to ElevenLabs dynamic variables
      await conversation.startSession({
        agentId: agentId,
        dynamicVariables: {
          user_id: data.user_id,
          user_name: data.user_name || activeUserName,
          last_summary: data.last_conversation_summary,
          key_events: data.important_events && data.important_events.length > 0
            ? data.important_events.join("; ")
            : "No previous key events logged.",
        },
      });
    } catch (err: any) {
      console.error("Failed to start voice triage call:", err);
      setErrorMessage(err.message || "Failed to initialize voice session");
    } finally {
      setLoading(false);
    }
  };

  const handleStopCall = async () => {
    try {
      await conversation.endSession();
    } catch (err) {
      console.error("Error stopping conversation:", err);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-3xl shadow-xl border border-gray-100 font-sans">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
          <span>PsychTriage AI</span>
          <Sparkles className="w-5 h-5 text-teal-500" />
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Voice Check-In with Detailed 5-6 Line Memory Log
        </p>

        {user ? (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium rounded-full">
            {user.picture ? (
              <img src={user.picture} alt={user.user_name} className="w-4 h-4 rounded-full" />
            ) : (
              <User className="w-3.5 h-3.5 text-teal-600" />
            )}
            <span>Logged in as <strong>{user.user_name}</strong></span>
          </div>
        ) : (
          <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
            <span>Guest Session</span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Memory context card */}
      {initData && (
        <div className="mb-6 p-4 bg-teal-50 border border-teal-100 rounded-2xl text-left space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-teal-800 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>Detailed Session Summary</span>
            </span>
            <span className="text-teal-600">{initData.user_name}</span>
          </div>

          <p className="text-xs text-teal-900 leading-relaxed font-sans whitespace-pre-line bg-white/60 p-3 rounded-xl border border-teal-100">
            {initData.last_conversation_summary}
          </p>

          {initData.important_events && initData.important_events.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-teal-900 uppercase tracking-wider mb-1">
                📌 Key Important Events Logged:
              </h4>
              <ul className="space-y-1">
                {initData.important_events.map((event, idx) => (
                  <li key={idx} className="text-xs text-teal-800 flex items-start gap-1.5">
                    <span className="text-teal-500">•</span>
                    <span>{event}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Main Call Action */}
      <div className="flex flex-col items-center justify-center py-4">
        {isConnected ? (
          <div className="relative flex flex-col items-center">
            <div
              className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                isSpeaking
                  ? "bg-teal-500 shadow-lg shadow-teal-200 animate-pulse scale-105"
                  : "bg-teal-600"
              }`}
            >
              {isSpeaking ? (
                <Volume2 className="w-12 h-12 text-white animate-bounce" />
              ) : (
                <Mic className="w-12 h-12 text-white" />
              )}
            </div>
            <p className="mt-4 text-sm font-medium text-gray-600">
              {isSpeaking ? "AI Counselor is speaking..." : "Listening..."}
            </p>
            <button
              onClick={handleStopCall}
              className="mt-6 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full shadow-lg flex items-center gap-2 transition-all"
            >
              <MicOff className="w-4 h-4" />
              <span>End Call</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <button
              onClick={handleStartCall}
              disabled={loading}
              className="w-24 h-24 bg-gradient-to-br from-teal-500 to-teal-700 hover:from-teal-600 hover:to-teal-800 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
            <p className="mt-4 text-sm text-gray-500">
              {loading ? "Fetching detailed session memory..." : "Tap to start conversation"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceTriageCall;
