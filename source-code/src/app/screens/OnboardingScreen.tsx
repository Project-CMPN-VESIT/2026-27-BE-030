import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { Heart, Sparkles, Brain, LogOut, User, LogIn } from "lucide-react";
import { PrimaryButton } from "../components/design-system/PrimaryButton";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export function OnboardingScreen() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [floatingHearts, setFloatingHearts] = useState<number[]>([]);

  useEffect(() => {
    // The nested removal timers used to outlive the component; collect them so
    // unmounting mid-cycle cannot fire setState on an unmounted screen.
    const removalTimers = new Set<number>();

    const interval = window.setInterval(() => {
      setFloatingHearts((prev) => [...prev, Date.now()]);

      const timer = window.setTimeout(() => {
        removalTimers.delete(timer);
        setFloatingHearts((prev) => prev.slice(1));
      }, 3000);
      removalTimers.add(timer);
    }, 2000);

    return () => {
      window.clearInterval(interval);
      removalTimers.forEach((timer) => window.clearTimeout(timer));
      removalTimers.clear();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5EEAD4] via-[#3B82F6] to-[#A78BFA] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Floating Hearts Animation */}
      {floatingHearts.map((id, index) => (
        <motion.div
          key={id}
          initial={{ opacity: 0, y: 100, x: Math.random() * 100 - 50 }}
          animate={{ opacity: [0, 1, 0], y: -100 }}
          transition={{ duration: 3, ease: "easeOut" }}
          className="absolute bottom-0"
          style={{ left: `${20 + index * 20}%` }}
        >
          <Heart className="w-6 h-6 text-white/40" fill="white" />
        </motion.div>
      ))}

      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Logo Area */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="mb-4 flex justify-center"
          >
            <div className="w-20 h-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center">
              <Heart className="w-10 h-10 text-[#14B8A6]" fill="#14B8A6" />
            </div>
          </motion.div>

          {/* User Name Greeting Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3"
          >
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {user ? `Welcome back, ${user.user_name}! 👋` : "Welcome to PsychTriage 👋"}
            </h1>
            <p className="text-white/90 text-sm mt-1">
              {user
                ? "Your cross-session memory is active for voice triage."
                : "Game-Based Wellness & AI Voice Triage Companion"}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <Sparkles className="w-4 h-4 text-[#FCD34D]" />
            <span className="text-white/80 text-xs">Cross-Session Memory • Private & Secure</span>
          </motion.div>

          {/* Logged In User Profile Bar */}
          <div className="mb-6 flex flex-col items-center justify-center">
            {user ? (
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 w-full shadow-xl border border-white/50 flex items-center justify-between">
                <div className="flex items-center gap-3 text-left">
                  {user.picture ? (
                    <img src={user.picture} alt={user.user_name} className="w-10 h-10 rounded-full border-2 border-teal-500 shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">{user.user_name}</h3>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition flex items-center gap-1 text-xs font-semibold"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 w-full shadow-xl border border-white/50 flex items-center justify-between">
                <div className="text-left">
                  <h3 className="font-bold text-gray-800 text-sm">Not Signed In</h3>
                  <p className="text-xs text-gray-500">Sign in to save your session memory in MongoDB</p>
                </div>
                <button
                  onClick={() => navigate("/login")}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-semibold text-xs rounded-xl shadow transition flex items-center gap-1.5 shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <PrimaryButton
              onClick={() => navigate("/ai-buddy")}
              size="lg"
              fullWidth
            >
              💬 Talk to AI BUDDY
            </PrimaryButton>

            <motion.button
              onClick={() => navigate("/mindquest")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white/20 backdrop-blur-sm border-2 border-white/40 text-white rounded-full py-3 px-6 font-semibold shadow-lg hover:bg-white/30 transition-all flex items-center justify-center gap-2"
            >
              🎮 Start Game Quest
            </motion.button>

            <motion.button
              onClick={() => navigate("/manual-assessment")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-full bg-white/10 text-white font-medium text-sm border border-white/20 hover:bg-white/20 transition"
            >
              <Brain className="w-4 h-4 inline mr-2" />
              Measure Manually
            </motion.button>
          </motion.div>

          {/* Privacy Note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-white/70 text-xs mt-6"
          >
            Your privacy is protected. Session memory is securely stored per user account in MongoDB.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}