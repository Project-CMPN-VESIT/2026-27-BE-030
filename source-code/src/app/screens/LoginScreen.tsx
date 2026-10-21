import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { Heart, Sparkles, Shield, Brain, ArrowRight, User, Mail, LogIn } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";

/**
 * Deterministic id for a manually-registered account: the same email always
 * yields the same id, on any device. FNV-1a is used only to keep the id short
 * and URL-safe (it is interpolated into /api/voice/init/{user_id}) — it is not
 * a security measure, and this path is not authenticated either way.
 */
function stableUserId(email: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < email.length; i++) {
    hash ^= email.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `manual_${hash.toString(36)}${email.length.toString(36)}`;
}

export function LoginScreen() {
  const navigate = useNavigate();
  const { user, loginWithGoogleToken, isLoading } = useAuth();

  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [isManualSignUp, setIsManualSignUp] = useState(false);

  // If already logged in, automatically redirect to home screen (/home)
  useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);

  const handleManualSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    // Derived from the identity, not the clock. `user_${Date.now()}` produced a
    // brand-new id on every sign-up, so the same person on a second device — or
    // after clearing storage — became a different MongoDB user and silently lost
    // all cross-session memory, which is the feature this screen advertises.
    const email =
      emailInput.trim().toLowerCase() ||
      `${nameInput.trim().toLowerCase().replace(/\s+/g, "")}@psychtriage.app`;
    const userProfile = {
      user_id: stableUserId(email),
      user_name: nameInput.trim(),
      email,
    };

    // Register with FastAPI & MongoDB backend
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
      await fetch(`${backendUrl}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userProfile),
      });
    } catch (err) {
      console.warn("Backend sync notice:", err);
    }

    // Save in localStorage
    localStorage.setItem("psychtriage_user", JSON.stringify(userProfile));
    window.location.href = "/home";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#14B8A6] via-[#3B82F6] to-[#7C3AED] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#14B8A6] via-[#3B82F6] to-[#7C3AED] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

      <div className="max-w-md w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/40 text-center"
        >
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-tr from-[#14B8A6] to-[#3B82F6] rounded-3xl shadow-lg flex items-center justify-center transform -rotate-6">
              <Heart className="w-10 h-10 text-white" fill="white" />
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">
            PsychTriage
          </h1>
          <p className="text-gray-600 text-xs mb-6">
            Sign up / Log in to activate Cross-Session Voice AI Memory
          </p>

          {/* Feature Badges */}
          <div className="space-y-2.5 mb-6 text-left bg-teal-50/80 border border-teal-100 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-teal-900">AI Voice Triage Memory</h4>
                <p className="text-[11px] text-teal-700">Remembers your last conversation summary across sessions.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-teal-900">Private MongoDB Storage</h4>
                <p className="text-[11px] text-teal-700">Your health data is isolated per account in MongoDB.</p>
              </div>
            </div>
          </div>

          {/* Google Sign-In / Sign-Up Button */}
          <div className="mb-4">
            <div className="w-full flex justify-center py-1">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  if (credentialResponse.credential) {
                    loginWithGoogleToken(credentialResponse.credential).then(() => {
                      navigate("/home");
                    });
                  }
                }}
                onError={() => {
                  console.error("Google Login Failed");
                }}
                useOneTap
                theme="filled_blue"
                shape="pill"
                size="large"
                text="continue_with"
              />
            </div>
          </div>

          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-gray-200" />
            <span className="flex-shrink mx-3 text-xs text-gray-400 uppercase font-semibold">OR</span>
            <div className="flex-grow border-t border-gray-200" />
          </div>

          {/* Manual Name / Email Sign-Up Form */}
          {isManualSignUp ? (
            <form onSubmit={handleManualSignUp} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Your Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address (Optional)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    placeholder="alex@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Create Account & Continue</span>
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsManualSignUp(true)}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4 text-gray-500" />
              <span>Sign Up with Name & Email</span>
            </button>
          )}

          {/* Guest Access Option */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <button
              onClick={() => navigate("/home")}
              className="text-xs font-semibold text-gray-400 hover:text-teal-600 flex items-center justify-center gap-1 mx-auto transition"
            >
              <span>Skip for now & preview as Guest</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default LoginScreen;
