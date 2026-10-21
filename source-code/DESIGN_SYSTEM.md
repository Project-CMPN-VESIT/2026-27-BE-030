# PsychTriage - Mental Health Triage Platform Design System

## Overview

PsychTriage is a modern, mobile-first UI design system for a gamified AI-based mental health triage platform targeting Indian youth and young adults (18-35). The design emphasizes emotional support, calm aesthetics, and engaging gamification while maintaining professional credibility.

## Design Philosophy

- **Modern & Clean**: Minimalist interfaces with purposeful white space
- **Emotionally Supportive**: Calm colors and soft gradients that promote wellbeing
- **Gamified**: Progress indicators, XP points, streaks, and achievement badges
- **Mobile-First**: Optimized for smartphone experiences
- **Culturally Appropriate**: Designed for Indian healthcare context

## Color Palette

### Primary Colors
- **Teal**: `#14B8A6` - Primary action color, representing calm and trust
- **Blue**: `#3B82F6` - Secondary actions, conveying reliability
- **Purple**: `#A78BFA` - Accent color for special features and achievements
- **Yellow**: `#FCD34D` - Warm accents for gamification elements

### Risk Level Colors
- **Low Risk**: `#10B981` (Green) - Positive, safe
- **Moderate Risk**: `#F59E0B` (Amber) - Cautionary but hopeful
- **High Risk**: `#EF4444` (Red) - Serious but not alarming

### Gamification Colors
- **XP Gold**: `#FBBF24` - Rewards and points
- **Streak Fire**: `#F97316` - Daily streak indicators
- **Badge Silver**: `#E5E7EB` - Base level achievements
- **Badge Gold**: `#FCD34D` - Mid-tier achievements
- **Badge Platinum**: `#C4B5FD` - Premium achievements

## Typography

- **Font Family**: System fonts for optimal performance
- **Heading 1**: 32px / Medium / 1.5 line-height
- **Heading 2**: 24px / Medium / 1.5 line-height
- **Heading 3**: 20px / Medium / 1.5 line-height
- **Body**: 16px / Normal / 1.5 line-height

## Spacing System

Based on 4px base unit (0.25rem):
- 1 = 0.25rem (4px)
- 2 = 0.5rem (8px)
- 3 = 0.75rem (12px)
- 4 = 1rem (16px)
- 6 = 1.5rem (24px)
- 8 = 2rem (32px)

## Border Radius

- **Small**: 0.5rem (8px) - Small elements
- **Medium**: 0.75rem (12px) - Standard components
- **Large**: 1rem (16px) - Cards
- **XL**: 1.5rem (24px) - Large containers

## Components

### Design System Components

1. **MoodButton** - Interactive emoji-based mood selector
2. **XPBadge** - Animated experience points display
3. **StreakCounter** - Daily check-in streak indicator
4. **RiskCard** - Risk level result display
5. **AchievementBadge** - Unlockable achievement display
6. **GlassCard** - Glassmorphism card container
7. **PrimaryButton** - Main CTA button with variants

### Screens

1. **Onboarding Screen**
   - Welcome animation with floating hearts
   - Clear value proposition
   - Friendly illustrations
   - Privacy assurance

2. **Mood Check-In Screen**
   - 5-point emoji mood selector
   - Stress level slider
   - Daily streak counter
   - XP rewards system
   - Progress indicator

3. **Voice Input Screen**
   - Animated waveform visualization
   - Real-time emotion detection
   - Recording toggle
   - Helpful tips

4. **AI Chat Screen**
   - Conversational interface
   - Typing indicators
   - Progress bar
   - Achievement reward on completion

5. **Risk Result Screen**
   - Color-coded risk level cards
   - Personalized suggestions
   - Professional help CTA
   - Emergency support button (if high risk)

6. **Progress Dashboard**
   - Weekly mood graph
   - Stress level tracking
   - Achievement badges
   - Motivational messages
   - XP and streak display

7. **Emergency Mode**
   - Clean, serious UI
   - Direct helpline access (Tele-MANAS 14416)
   - Safety tips
   - Resource locator
   - Confidentiality assurance

## Micro-Interactions

- **Button Hover**: Scale 1.02
- **Button Tap**: Scale 0.98
- **Card Entry**: Fade in + slide up
- **XP Badge**: Rotate + scale animation
- **Streak Counter**: Pulse animation
- **Mood Selection**: Scale + shadow change
- **Waveform**: Continuous sine wave animation

## Accessibility

- High contrast text ratios
- Large tap targets (minimum 44x44px)
- Clear visual feedback
- Screen reader friendly
- Keyboard navigation support

## Cultural Considerations

- Uses Indian helpline numbers (Tele-MANAS 14416, KIRAN 1800-599-0019)
- Non-stigmatizing language
- Appropriate for diverse cultural backgrounds
- Respects privacy and confidentiality

## Usage Guidelines

### Do's
✓ Use soft gradients for depth
✓ Maintain consistent spacing
✓ Keep interactions smooth and responsive
✓ Use encouraging, non-judgmental language
✓ Prioritize user privacy and security

### Don'ts
✗ Avoid harsh, fear-inducing visuals
✗ Don't use childish or patronizing design
✗ Avoid medical jargon without explanation
✗ Don't compromise on accessibility
✗ Avoid overwhelming animations

## Navigation

Access different screens using the navigation menu in the top-right corner (development only).

## Key Routes

- `/` - Onboarding Screen
- `/mood-checkin` - Mood Check-In
- `/voice-input` - Voice Input
- `/ai-chat` - AI Chat Interface
- `/risk-result` - Risk Assessment Results
- `/dashboard` - Progress Dashboard
- `/emergency` - Emergency Support
- `/design-system` - Design System Documentation

## Technical Stack

- React 18.3.1
- React Router 7
- Motion (Framer Motion successor)
- Tailwind CSS v4
- Recharts (for data visualization)
- Lucide React (icons)

## License

This design system is created for educational and healthcare purposes.
