import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { PrimaryButton } from "../components/design-system/PrimaryButton";

export function VoiceInputScreen() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [emotionLevel, setEmotionLevel] = useState(0);
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setEmotionLevel(Math.random() * 100);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setTranscript("I've been feeling anxious about work lately...");
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFBFC] to-[#E5E7EB] p-4">
      <div className="max-w-md mx-auto pt-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-semibold text-[#1F2937] mb-2">
            Voice Check-In
          </h1>
          <p className="text-[#6B7280]">
            Speak freely about how you're feeling
          </p>
        </motion.div>

        {/* Waveform Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 shadow-lg mb-6"
        >
          <div className="flex items-center justify-center h-48 gap-2">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  height: isRecording
                    ? `${Math.sin(Date.now() / 100 + i) * 30 + 40}%`
                    : "20%",
                }}
                transition={{ duration: 0.1 }}
                className="w-2 bg-gradient-to-t from-[#14B8A6] to-[#5EEAD4] rounded-full"
                style={{ minHeight: "8px" }}
              />
            ))}
          </div>

          {/* Emotion Indicator */}
          {isRecording && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#6B7280]">Detecting emotion...</span>
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#14B8A6]" />
                  <span className="text-sm font-medium text-[#1F2937]">
                    {emotionLevel.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${emotionLevel}%` }}
                  className="h-full bg-gradient-to-r from-[#14B8A6] to-[#3B82F6]"
                />
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Recording Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center mb-6"
        >
          <motion.button
            onClick={toggleRecording}
            whileTap={{ scale: 0.95 }}
            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all ${
              isRecording
                ? "bg-gradient-to-br from-[#EF4444] to-[#DC2626] animate-pulse"
                : "bg-gradient-to-br from-[#14B8A6] to-[#0F766E]"
            }`}
          >
            {isRecording ? (
              <MicOff className="w-10 h-10 text-white" />
            ) : (
              <Mic className="w-10 h-10 text-white" />
            )}
          </motion.button>

          <motion.p
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="mt-4 text-[#6B7280] text-center"
          >
            {isRecording ? "Tap to stop recording" : "Tap to start speaking"}
          </motion.p>
        </motion.div>

        {/* Transcript */}
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-lg mb-6"
          >
            <h3 className="text-sm font-semibold text-[#6B7280] mb-2 uppercase tracking-wide">
              Transcript
            </h3>
            <p className="text-[#1F2937] leading-relaxed">{transcript}</p>
          </motion.div>
        )}

        {/* Helpful Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-[#A78BFA] to-[#7C3AED] rounded-3xl p-6 shadow-lg mb-6"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="text-white font-semibold mb-2">Tips for sharing</h3>
              <ul className="text-white/90 text-sm space-y-1">
                <li>• Speak naturally and take your time</li>
                <li>• Share what feels comfortable</li>
                <li>• There are no wrong answers</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <PrimaryButton
            onClick={() => navigate("/ai-chat")}
            fullWidth
            disabled={!transcript}
          >
            Continue to Chat
          </PrimaryButton>
          <button
            onClick={() => navigate("/mood-checkin")}
            className="w-full py-3 text-[#6B7280] font-medium"
          >
            Skip Voice Input
          </button>
        </div>
      </div>
    </div>
  );
}
