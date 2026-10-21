import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  TrendingUp,
  Award,
  Calendar,
  Target,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { AchievementBadge } from "../components/design-system/AchievementBadge";
import { StreakCounter } from "../components/design-system/StreakCounter";
import { PrimaryButton } from "../components/design-system/PrimaryButton";

const moodData = [
  { day: "Mon", mood: 3, stress: 60 },
  { day: "Tue", mood: 4, stress: 45 },
  { day: "Wed", mood: 3, stress: 55 },
  { day: "Thu", mood: 4, stress: 40 },
  { day: "Fri", mood: 5, stress: 30 },
  { day: "Sat", mood: 4, stress: 35 },
  { day: "Sun", mood: 4, stress: 38 },
];

const achievements = [
  {
    title: "First Quest",
    description: "Complete your first game run",
    icon: "🌟",
    type: "silver" as const,
    unlocked: true,
  },
  {
    title: "Week Warrior",
    description: "7-day game streak",
    icon: "🔥",
    type: "gold" as const,
    unlocked: true,
  },
  {
    title: "Mindful Master",
    description: "Complete 30 game sessions",
    icon: "🧘‍♀️",
    type: "platinum" as const,
    unlocked: false,
  },
  {
    title: "Focus Badge",
    description: "Finish 5 memory variants",
    icon: "💙",
    type: "gold" as const,
    unlocked: true,
  },
];

export function ProgressDashboard() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<"overview" | "achievements">(
    "overview"
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFBFC] to-[#E5E7EB]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#14B8A6] to-[#3B82F6] p-6 pb-8"
      >
        <div className="max-w-md mx-auto">
          <button
            onClick={() => navigate("/")}
            className="mb-4 text-white/80 hover:text-white flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">
                Your Progress
              </h1>
              <p className="text-white/80">Keep up the great work! ✨</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">247</div>
              <div className="text-white/80 text-sm">Total XP</div>
            </div>
          </div>
          <StreakCounter days={7} />
        </div>
      </motion.div>

      <div className="max-w-md mx-auto px-4 -mt-4">
        {/* Tab Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-1 shadow-lg mb-6 flex gap-1"
        >
          <button
            onClick={() => setSelectedTab("overview")}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              selectedTab === "overview"
                ? "bg-gradient-to-r from-[#14B8A6] to-[#0F766E] text-white shadow-md"
                : "text-[#6B7280]"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedTab("achievements")}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              selectedTab === "achievements"
                ? "bg-gradient-to-r from-[#14B8A6] to-[#0F766E] text-white shadow-md"
                : "text-[#6B7280]"
            }`}
          >
            Achievements
          </button>
        </motion.div>

        {selectedTab === "overview" ? (
          <>
            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-3 mb-6"
            >
              <div className="bg-white rounded-2xl p-4 shadow-md text-center">
                <Calendar className="w-6 h-6 text-[#14B8A6] mx-auto mb-2" />
                <div className="text-2xl font-semibold text-[#1F2937]">21</div>
                <div className="text-xs text-[#6B7280]">Game Runs</div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-md text-center">
                <TrendingUp className="w-6 h-6 text-[#3B82F6] mx-auto mb-2" />
                <div className="text-2xl font-semibold text-[#1F2937]">+15%</div>
                <div className="text-xs text-[#6B7280]">Improvement</div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-md text-center">
                <Award className="w-6 h-6 text-[#F59E0B] mx-auto mb-2" />
                <div className="text-2xl font-semibold text-[#1F2937]">4</div>
                <div className="text-xs text-[#6B7280]">Badges</div>
              </div>
            </motion.div>

            {/* Mood Trend Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-6 shadow-lg mb-6"
            >
              <h2 className="text-lg font-semibold text-[#1F2937] mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#14B8A6]" />
                Weekly Mood Trend
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={moodData}>
                  <defs>
                    <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" stroke="#6B7280" style={{ fontSize: "12px" }} />
                  <YAxis
                    stroke="#6B7280"
                    style={{ fontSize: "12px" }}
                    domain={[0, 5]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="mood"
                    stroke="#14B8A6"
                    strokeWidth={3}
                    fill="url(#moodGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Stress Level Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-3xl p-6 shadow-lg mb-6"
            >
              <h2 className="text-lg font-semibold text-[#1F2937] mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#3B82F6]" />
                Stress Level Tracking
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={moodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" stroke="#6B7280" style={{ fontSize: "12px" }} />
                  <YAxis
                    stroke="#6B7280"
                    style={{ fontSize: "12px" }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="stress"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: "#3B82F6", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Motivational Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-[#A78BFA] to-[#7C3AED] rounded-3xl p-6 shadow-lg mb-6"
            >
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-white flex-shrink-0" />
                <div>
                  <h3 className="text-white font-semibold mb-2">
                    You're Making Progress!
                  </h3>
                  <p className="text-white/90 text-sm leading-relaxed">
                    Your stress levels are down 12% this week. Keep practicing
                    mindfulness and self-care. You're doing great! 🌟
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        ) : (
          <>
            {/* Achievements Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <h2 className="text-lg font-semibold text-[#1F2937] mb-4">
                Your Achievements
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <AchievementBadge {...achievement} />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Next Achievement */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-3xl p-6 shadow-lg mb-6"
            >
              <h3 className="font-semibold text-[#1F2937] mb-3">
                Next Achievement
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#6B7280] text-sm mb-1">Mindful Master</p>
                  <p className="text-xs text-[#9CA3AF]">21 / 30 game sessions</p>
                </div>
                <div className="text-3xl">🧘‍♀️</div>
              </div>
              <div className="mt-3 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#14B8A6] to-[#3B82F6]"
                  style={{ width: "70%" }}
                />
              </div>
            </motion.div>
          </>
        )}

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="pb-6"
        >
          <PrimaryButton
            onClick={() => navigate("/mindquest")}
            size="lg"
            fullWidth
          >
            Start New Game Run ✨
          </PrimaryButton>
        </motion.div>
      </div>
    </div>
  );
}
