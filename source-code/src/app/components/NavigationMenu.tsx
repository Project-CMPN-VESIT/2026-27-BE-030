import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router";
import {
  Home,
  TrendingUp,
  AlertCircle,
  Palette,
  Boxes,
  Menu,
  X,
  Brain,
  Wind,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";

const navigationLinks = [
  { path: "/", label: "Onboarding", icon: Home, color: "from-[#14B8A6] to-[#0F766E]" },
  { path: "/mindquest", label: "MindQuest Start", icon: Brain, color: "from-[#8B5CF6] to-[#6366F1]" },
  { path: "/ai-buddy", label: "AI Buddy", icon: MessageSquare, color: "from-[#7C3AED] to-[#EC4899]" },
  { path: "/mindquest/level1", label: "L1 Flash Recall", icon: Brain, color: "from-[#0EA5E9] to-[#0284C7]" },
  { path: "/mindquest/level2", label: "L2 Sliding Puzzle", icon: Brain, color: "from-[#6366F1] to-[#4F46E5]" },
  { path: "/mindquest/level3", label: "L3 Object Slicing", icon: Brain, color: "from-[#14B8A6] to-[#0F766E]" },
  { path: "/mindquest/level4", label: "L4 Infinite Runner", icon: Brain, color: "from-[#EC4899] to-[#DB2777]" },
  { path: "/mindquest/result", label: "MindQuest Result", icon: TrendingUp, color: "from-[#10B981] to-[#059669]" },
  { path: "/breathing", label: "Breathing", icon: Wind, color: "from-[#0EA5E9] to-[#6366F1]" },
  { path: "/dashboard", label: "Progress", icon: TrendingUp, color: "from-[#10B981] to-[#059669]" },
  { path: "/emergency", label: "Emergency", icon: AlertCircle, color: "from-[#EF4444] to-[#DC2626]" },
  { path: "/components", label: "Components", icon: Boxes, color: "from-[#3B82F6] to-[#1E40AF]" },
  { path: "/design-system", label: "Design System", icon: Palette, color: "from-[#A78BFA] to-[#7C3AED]" },
];

export function NavigationMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mb-2 ml-auto block bg-white rounded-xl shadow-lg p-3"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-[#1F2937]" />
        ) : (
          <Menu className="w-5 h-5 text-[#1F2937]" />
        )}
      </motion.button>

      {/* Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl p-4 max-w-xs"
          >
            <h3 className="text-sm font-semibold text-[#1F2937] mb-3 px-2">
              📱 Screen Navigation
            </h3>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {navigationLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="block"
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl bg-gradient-to-r ${link.color} shadow-md hover:shadow-lg transition-shadow`}
                  >
                    <link.icon className="w-4 h-4 text-white" />
                    <span className="text-sm font-medium text-white">
                      {link.label}
                    </span>
                  </motion.div>
                </Link>
              ))}
            </div>
            <p className="text-xs text-[#9CA3AF] mt-3 px-2">
              Dev navigation - remove in production
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}