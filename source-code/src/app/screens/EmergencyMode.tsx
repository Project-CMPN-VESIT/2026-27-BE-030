import { motion } from "motion/react";
import { Phone, MessageCircle, MapPin, Shield, Heart } from "lucide-react";
import { PrimaryButton } from "../components/design-system/PrimaryButton";
import { useNavigate } from "react-router";

export function EmergencyMode() {
  const navigate = useNavigate();
  const emergencyContacts = [
    {
      name: "Tele-MANAS",
      number: "14416",
      description: "National Mental Health Helpline",
      icon: Phone,
    },
    {
      name: "KIRAN Helpline",
      number: "1800-599-0019",
      description: "Mental Health Rehabilitation",
      icon: MessageCircle,
    },
  ];

  const safetyTips = [
    "Stay in a safe environment",
    "Reach out to someone you trust",
    "Remember: this feeling is temporary",
    "You are not alone in this",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E293B] to-[#334155] p-4">
      <div className="max-w-md mx-auto pt-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <Heart className="w-8 h-8 text-[#EF4444]" fill="#EF4444" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">
            You're Not Alone
          </h1>
          <p className="text-white/80">
            We're here to help. Reach out for immediate support.
          </p>
        </motion.div>

        {/* Emergency Message */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-md rounded-3xl p-6 mb-6 border border-white/20"
        >
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-white flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-white font-semibold mb-2">
                Your Safety Matters
              </h3>
              <p className="text-white/90 text-sm leading-relaxed">
                If you're experiencing thoughts of self-harm or suicide, please
                call one of the helplines below immediately. Professional help is
                available 24/7.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Emergency Contacts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 mb-6"
        >
          {emergencyContacts.map((contact, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-white rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#EF4444] to-[#DC2626] rounded-full flex items-center justify-center flex-shrink-0">
                  <contact.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#1F2937] mb-1">
                    {contact.name}
                  </h3>
                  <p className="text-sm text-[#6B7280] mb-2">
                    {contact.description}
                  </p>
                  <a
                    href={`tel:${contact.number}`}
                    className="text-2xl font-bold text-[#EF4444]"
                  >
                    {contact.number}
                  </a>
                </div>
              </div>
              <a href={`tel:${contact.number}`} className="block">
                <PrimaryButton variant="emergency" size="lg" fullWidth>
                  <span className="flex items-center justify-center gap-2">
                    <Phone className="w-5 h-5" />
                    Call Now
                  </span>
                </PrimaryButton>
              </a>
            </motion.div>
          ))}
        </motion.div>

        {/* Safety Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/10 backdrop-blur-md rounded-3xl p-6 mb-6 border border-white/20"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Remember These
          </h3>
          <ul className="space-y-3">
            {safetyTips.map((tip, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex items-start gap-3 text-white/90 text-sm"
              >
                <span className="text-[#FCD34D] text-lg flex-shrink-0">✓</span>
                {tip}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Additional Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-3xl p-6 shadow-lg mb-6"
        >
          <h3 className="font-semibold text-[#1F2937] mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#14B8A6]" />
            Find Nearby Support
          </h3>
          <p className="text-sm text-[#6B7280] mb-4">
            Connect with mental health professionals and support centers near you.
          </p>
          <button className="w-full py-3 bg-[#F3F4F6] text-[#1F2937] rounded-xl font-medium hover:bg-[#E5E7EB] transition-colors">
            View Nearby Centers
          </button>
        </motion.div>

        {/* Privacy Assurance */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center"
        >
          <p className="text-white/80 text-sm">
            🔒 All calls and messages are confidential
          </p>
        </motion.div>

        {/* Breathing Exercise Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-6 text-center"
        >
          <button
            onClick={() => navigate("/breathing")}
            className="text-white/60 text-sm hover:text-white/80 transition-colors underline"
          >
            Try a quick breathing exercise →
          </button>
        </motion.div>
      </div>
    </div>
  );
}
