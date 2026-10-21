import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Phone, MessageCircle, Calendar, Home, Shield } from "lucide-react";
import { RiskCard } from "../components/design-system/RiskCard";
import { PrimaryButton } from "../components/design-system/PrimaryButton";
import { XPBadge } from "../components/design-system/XPBadge";

export function RiskResultScreen() {
  const navigate = useNavigate();
  const [riskLevel] = useState<"low" | "moderate" | "high">("moderate");

  const riskContent = {
    low: {
      title: "You're Doing Great!",
      description:
        "Your responses indicate you're managing well. Keep up the good work with self-care!",
    },
    moderate: {
      title: "Let's Support You",
      description:
        "You're experiencing some challenges. We recommend talking to a mental health professional who can provide personalized guidance.",
    },
    high: {
      title: "We're Here to Help",
      description:
        "Your wellbeing is important. We strongly recommend connecting with a mental health professional immediately.",
    },
  };

  const suggestions = [
    {
      icon: "🧘‍♀️",
      title: "Practice Mindfulness",
      description: "Try 10 minutes of meditation daily",
    },
    {
      icon: "💪",
      title: "Stay Active",
      description: "Physical activity can boost mood",
    },
    {
      icon: "😴",
      title: "Sleep Well",
      description: "Aim for 7-8 hours of quality sleep",
    },
    {
      icon: "🤝",
      title: "Connect with Others",
      description: "Talk to friends or family regularly",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFBFC] to-[#E5E7EB] p-4 pb-20">
      <div className="max-w-md mx-auto pt-6">
        {/* Header with XP */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <h1 className="text-2xl font-semibold text-[#1F2937]">
            Your Results
          </h1>
          <XPBadge points={25} animated />
        </motion.div>

        {/* Risk Level Card */}
        <div className="mb-6">
          <RiskCard
            level={riskLevel}
            title={riskContent[riskLevel].title}
            description={riskContent[riskLevel].description}
          />
        </div>

        {/* Understanding Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-lg mb-6"
        >
          <div className="flex items-start gap-3 mb-4">
            <Shield className="w-6 h-6 text-[#14B8A6] flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-[#1F2937] mb-2">
                Understanding Your Results
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                This assessment is not a diagnosis. It's a supportive tool to help
                you understand your current mental state and guide you toward
                appropriate resources.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Personalized Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-[#1F2937] mb-4">
            Personalized Suggestions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.03 }}
                className="bg-white rounded-2xl p-4 shadow-md"
              >
                <div className="text-3xl mb-2">{suggestion.icon}</div>
                <h4 className="font-semibold text-[#1F2937] text-sm mb-1">
                  {suggestion.title}
                </h4>
                <p className="text-xs text-[#6B7280]">{suggestion.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Professional Help CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-[#3B82F6] to-[#1E40AF] rounded-3xl p-6 shadow-lg mb-6"
        >
          <div className="flex items-start gap-3 mb-4">
            <MessageCircle className="w-6 h-6 text-white flex-shrink-0" />
            <div>
              <h3 className="text-white font-semibold mb-1">
                Talk to a Professional
              </h3>
              <p className="text-white/90 text-sm">
                Connect with certified mental health experts who can provide
                personalized support.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 bg-white text-[#3B82F6] px-4 py-2 rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-shadow">
              <Phone className="w-4 h-4" />
              Call Now
            </button>
            <button className="flex-1 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-medium text-sm flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" />
              Book Session
            </button>
          </div>
        </motion.div>

        {/* Emergency Support */}
        {riskLevel === "high" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-6"
          >
            <PrimaryButton
              onClick={() => navigate("/emergency")}
              variant="emergency"
              size="lg"
              fullWidth
            >
              <span className="flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" />
                Get Immediate Support
              </span>
            </PrimaryButton>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-3"
        >
          <PrimaryButton
            onClick={() => navigate("/dashboard")}
            variant="primary"
            size="lg"
            fullWidth
          >
            <span className="flex items-center justify-center gap-2">
              <Home className="w-5 h-5" />
              View Dashboard
            </span>
          </PrimaryButton>
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 text-[#6B7280] font-medium"
          >
            Back to Home
          </button>
        </motion.div>

        {/* Privacy Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-sm text-[#6B7280] mt-6"
        >
          🔒 Your data is private and secure. Results are never shared without
          your consent.
        </motion.p>
      </div>
    </div>
  );
}
