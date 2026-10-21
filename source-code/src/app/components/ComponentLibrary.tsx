import { motion } from "motion/react";
import { PrimaryButton } from "./design-system/PrimaryButton";
import { MoodButton } from "./design-system/MoodButton";
import { XPBadge } from "./design-system/XPBadge";
import { StreakCounter } from "./design-system/StreakCounter";
import { RiskCard } from "./design-system/RiskCard";
import { AchievementBadge } from "./design-system/AchievementBadge";
import { GlassCard } from "./design-system/GlassCard";
import { useState } from "react";

export function ComponentLibrary() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFBFC] to-[#E5E7EB] p-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-[#1F2937] mb-2">
            Component Library
          </h1>
          <p className="text-[#6B7280]">
            Reusable components for the PsychTriage design system
          </p>
        </motion.div>

        {/* Buttons */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-[#1F2937] mb-6">
            Buttons
          </h2>
          <div className="bg-white rounded-3xl p-8 shadow-lg space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-[#6B7280] mb-3 uppercase tracking-wide">
                Primary Buttons
              </h3>
              <div className="flex flex-wrap gap-4">
                <PrimaryButton variant="primary" size="sm">
                  Small Primary
                </PrimaryButton>
                <PrimaryButton variant="primary" size="md">
                  Medium Primary
                </PrimaryButton>
                <PrimaryButton variant="primary" size="lg">
                  Large Primary
                </PrimaryButton>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#6B7280] mb-3 uppercase tracking-wide">
                Button Variants
              </h3>
              <div className="flex flex-wrap gap-4">
                <PrimaryButton variant="primary">Primary</PrimaryButton>
                <PrimaryButton variant="secondary">Secondary</PrimaryButton>
                <PrimaryButton variant="accent">Accent</PrimaryButton>
                <PrimaryButton variant="emergency">Emergency</PrimaryButton>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#6B7280] mb-3 uppercase tracking-wide">
                Full Width Button
              </h3>
              <PrimaryButton variant="primary" fullWidth>
                Full Width Button
              </PrimaryButton>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#6B7280] mb-3 uppercase tracking-wide">
                Disabled State
              </h3>
              <PrimaryButton variant="primary" disabled>
                Disabled Button
              </PrimaryButton>
            </div>
          </div>
        </section>

        {/* Mood Buttons */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-[#1F2937] mb-6">
            Mood Buttons
          </h2>
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <div className="grid grid-cols-5 gap-4">
              {[
                { emoji: "😊", label: "Great", value: 5 },
                { emoji: "🙂", label: "Good", value: 4 },
                { emoji: "😐", label: "Okay", value: 3 },
                { emoji: "😔", label: "Low", value: 2 },
                { emoji: "😢", label: "Very Low", value: 1 },
              ].map((mood) => (
                <MoodButton
                  key={mood.value}
                  emoji={mood.emoji}
                  label={mood.label}
                  selected={selectedMood === mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Gamification Elements */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-[#1F2937] mb-6">
            Gamification Elements
          </h2>
          <div className="bg-white rounded-3xl p-8 shadow-lg space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-[#6B7280] mb-3 uppercase tracking-wide">
                XP Badges
              </h3>
              <div className="flex flex-wrap gap-4">
                <XPBadge points={10} />
                <XPBadge points={25} />
                <XPBadge points={50} />
                <XPBadge points={100} animated />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#6B7280] mb-3 uppercase tracking-wide">
                Streak Counter
              </h3>
              <StreakCounter days={7} />
            </div>
          </div>
        </section>

        {/* Risk Cards */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-[#1F2937] mb-6">
            Risk Level Cards
          </h2>
          <div className="space-y-4">
            <RiskCard
              level="low"
              title="You're Doing Great!"
              description="Your responses indicate you're managing well. Keep up the good work with self-care!"
            />
            <RiskCard
              level="moderate"
              title="Let's Support You"
              description="You're experiencing some challenges. We recommend talking to a mental health professional."
            />
            <RiskCard
              level="high"
              title="We're Here to Help"
              description="Your wellbeing is important. We strongly recommend connecting with a professional immediately."
            />
          </div>
        </section>

        {/* Achievement Badges */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-[#1F2937] mb-6">
            Achievement Badges
          </h2>
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <AchievementBadge
                title="First Check-In"
                description="Complete your first mood check"
                icon="🌟"
                type="silver"
                unlocked={true}
              />
              <AchievementBadge
                title="Week Warrior"
                description="7-day check-in streak"
                icon="🔥"
                type="gold"
                unlocked={true}
              />
              <AchievementBadge
                title="Mindful Master"
                description="Complete 30 check-ins"
                icon="🧘‍♀️"
                type="platinum"
                unlocked={false}
              />
              <AchievementBadge
                title="Openness Badge"
                description="Share your feelings"
                icon="💙"
                type="gold"
                unlocked={true}
              />
            </div>
          </div>
        </section>

        {/* Glass Card */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-[#1F2937] mb-6">
            Glass Card
          </h2>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#14B8A6] to-[#3B82F6] rounded-3xl" />
            <div className="relative p-8">
              <GlassCard className="p-8">
                <h3 className="text-xl font-semibold text-[#1F2937] mb-2">
                  Glassmorphism Card
                </h3>
                <p className="text-[#6B7280]">
                  A modern card component with glass effect, perfect for overlays
                  and floating content.
                </p>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* Cards with Gradients */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-[#1F2937] mb-6">
            Gradient Cards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-[#14B8A6] to-[#0F766E] rounded-3xl p-6 shadow-lg">
              <h3 className="text-white font-semibold mb-2">Primary Gradient</h3>
              <p className="text-white/90 text-sm">
                Teal gradient for primary actions and highlights
              </p>
            </div>
            <div className="bg-gradient-to-r from-[#3B82F6] to-[#1E40AF] rounded-3xl p-6 shadow-lg">
              <h3 className="text-white font-semibold mb-2">Secondary Gradient</h3>
              <p className="text-white/90 text-sm">
                Blue gradient for secondary elements
              </p>
            </div>
            <div className="bg-gradient-to-r from-[#A78BFA] to-[#7C3AED] rounded-3xl p-6 shadow-lg">
              <h3 className="text-white font-semibold mb-2">Accent Gradient</h3>
              <p className="text-white/90 text-sm">
                Purple gradient for special features
              </p>
            </div>
            <div className="bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] rounded-3xl p-6 shadow-lg">
              <h3 className="text-white font-semibold mb-2">XP Gradient</h3>
              <p className="text-white/90 text-sm">
                Gold gradient for gamification rewards
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
