import { motion } from "motion/react";

export function DesignSystemShowcase() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFBFC] to-[#E5E7EB] p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-[#1F2937] mb-2">
            PsychTriage Design System
          </h1>
          <p className="text-[#6B7280]">
            A modern, emotionally supportive design system for mental health support
          </p>
        </motion.div>

        {/* Color Palette */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-[#1F2937] mb-6">
            Color Palette
          </h2>

          {/* Primary Colors */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-[#4B5563] mb-4">
              Primary Colors
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="h-24 bg-[#14B8A6] rounded-2xl shadow-lg mb-2" />
                <p className="text-sm font-medium text-[#1F2937]">Teal</p>
                <p className="text-xs text-[#6B7280]">#14B8A6</p>
              </div>
              <div>
                <div className="h-24 bg-[#3B82F6] rounded-2xl shadow-lg mb-2" />
                <p className="text-sm font-medium text-[#1F2937]">Blue</p>
                <p className="text-xs text-[#6B7280]">#3B82F6</p>
              </div>
              <div>
                <div className="h-24 bg-[#A78BFA] rounded-2xl shadow-lg mb-2" />
                <p className="text-sm font-medium text-[#1F2937]">Purple</p>
                <p className="text-xs text-[#6B7280]">#A78BFA</p>
              </div>
            </div>
          </div>

          {/* Risk Level Colors */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-[#4B5563] mb-4">
              Risk Level Colors
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="h-24 bg-[#10B981] rounded-2xl shadow-lg mb-2" />
                <p className="text-sm font-medium text-[#1F2937]">Low Risk</p>
                <p className="text-xs text-[#6B7280]">#10B981</p>
              </div>
              <div>
                <div className="h-24 bg-[#F59E0B] rounded-2xl shadow-lg mb-2" />
                <p className="text-sm font-medium text-[#1F2937]">Moderate</p>
                <p className="text-xs text-[#6B7280]">#F59E0B</p>
              </div>
              <div>
                <div className="h-24 bg-[#EF4444] rounded-2xl shadow-lg mb-2" />
                <p className="text-sm font-medium text-[#1F2937]">High Risk</p>
                <p className="text-xs text-[#6B7280]">#EF4444</p>
              </div>
            </div>
          </div>

          {/* Gamification Colors */}
          <div>
            <h3 className="text-lg font-medium text-[#4B5563] mb-4">
              Gamification Colors
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="h-20 bg-[#FBBF24] rounded-2xl shadow-lg mb-2" />
                <p className="text-sm font-medium text-[#1F2937]">XP Gold</p>
                <p className="text-xs text-[#6B7280]">#FBBF24</p>
              </div>
              <div>
                <div className="h-20 bg-[#F97316] rounded-2xl shadow-lg mb-2" />
                <p className="text-sm font-medium text-[#1F2937]">Streak Fire</p>
                <p className="text-xs text-[#6B7280]">#F97316</p>
              </div>
              <div>
                <div className="h-20 bg-[#E5E7EB] rounded-2xl shadow-lg mb-2" />
                <p className="text-sm font-medium text-[#1F2937]">Silver Badge</p>
                <p className="text-xs text-[#6B7280]">#E5E7EB</p>
              </div>
              <div>
                <div className="h-20 bg-[#C4B5FD] rounded-2xl shadow-lg mb-2" />
                <p className="text-sm font-medium text-[#1F2937]">Platinum</p>
                <p className="text-xs text-[#6B7280]">#C4B5FD</p>
              </div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-[#1F2937] mb-6">
            Typography
          </h2>
          <div className="bg-white rounded-3xl p-8 shadow-lg space-y-4">
            <div>
              <h1>Heading 1 - Display</h1>
              <p className="text-sm text-[#6B7280]">32px / Medium / 1.5 line-height</p>
            </div>
            <div>
              <h2>Heading 2 - Title</h2>
              <p className="text-sm text-[#6B7280]">24px / Medium / 1.5 line-height</p>
            </div>
            <div>
              <h3>Heading 3 - Subtitle</h3>
              <p className="text-sm text-[#6B7280]">20px / Medium / 1.5 line-height</p>
            </div>
            <div>
              <p>Body text - Regular paragraph content for readable information</p>
              <p className="text-sm text-[#6B7280]">16px / Normal / 1.5 line-height</p>
            </div>
          </div>
        </section>

        {/* Border Radius */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-[#1F2937] mb-6">
            Border Radius
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="h-24 bg-[#14B8A6] rounded-lg shadow-lg mb-2" />
              <p className="text-sm font-medium text-[#1F2937]">Small</p>
              <p className="text-xs text-[#6B7280]">0.5rem</p>
            </div>
            <div className="text-center">
              <div className="h-24 bg-[#3B82F6] rounded-xl shadow-lg mb-2" />
              <p className="text-sm font-medium text-[#1F2937]">Medium</p>
              <p className="text-xs text-[#6B7280]">0.75rem</p>
            </div>
            <div className="text-center">
              <div className="h-24 bg-[#A78BFA] rounded-2xl shadow-lg mb-2" />
              <p className="text-sm font-medium text-[#1F2937]">Large</p>
              <p className="text-xs text-[#6B7280]">1rem</p>
            </div>
            <div className="text-center">
              <div className="h-24 bg-[#FCD34D] rounded-3xl shadow-lg mb-2" />
              <p className="text-sm font-medium text-[#1F2937]">XL</p>
              <p className="text-xs text-[#6B7280]">1.5rem</p>
            </div>
          </div>
        </section>

        {/* Shadows */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-[#1F2937] mb-6">
            Elevation & Shadows
          </h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="h-24 bg-white rounded-2xl shadow-sm flex items-center justify-center">
              <p className="text-sm font-medium text-[#6B7280]">Small Shadow</p>
            </div>
            <div className="h-24 bg-white rounded-2xl shadow-md flex items-center justify-center">
              <p className="text-sm font-medium text-[#6B7280]">Medium Shadow</p>
            </div>
            <div className="h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center">
              <p className="text-sm font-medium text-[#6B7280]">Large Shadow</p>
            </div>
          </div>
        </section>

        {/* Spacing */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-[#1F2937] mb-6">
            Spacing System
          </h2>
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <div className="space-y-4">
              {[1, 2, 3, 4, 6, 8].map((size) => (
                <div key={size} className="flex items-center gap-4">
                  <div
                    className="bg-[#14B8A6] h-8"
                    style={{ width: `${size * 0.25}rem` }}
                  />
                  <span className="text-sm text-[#6B7280]">{size} = {size * 0.25}rem</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Icons */}
        <section>
          <h2 className="text-2xl font-semibold text-[#1F2937] mb-6">
            Icon System
          </h2>
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <p className="text-[#6B7280] mb-4">
              Using Lucide React icons with consistent sizing (16px, 20px, 24px)
            </p>
            <div className="flex gap-6 flex-wrap">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#14B8A6] rounded-full flex items-center justify-center mb-2">
                  <span className="text-white text-xl">✓</span>
                </div>
                <p className="text-xs text-[#6B7280]">Success</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#F59E0B] rounded-full flex items-center justify-center mb-2">
                  <span className="text-white text-xl">⚠</span>
                </div>
                <p className="text-xs text-[#6B7280]">Warning</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#EF4444] rounded-full flex items-center justify-center mb-2">
                  <span className="text-white text-xl">!</span>
                </div>
                <p className="text-xs text-[#6B7280]">Error</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
