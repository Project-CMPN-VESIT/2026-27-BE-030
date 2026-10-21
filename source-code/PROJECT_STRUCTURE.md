# PsychTriage - Project Structure

## 📁 File Organization

```
/
├── README.md                           # Main project documentation
├── DESIGN_SYSTEM.md                    # Complete design system guide
├── QUICKSTART.md                       # Quick start guide
├── PROJECT_STRUCTURE.md                # This file
│
├── src/
│   ├── app/
│   │   ├── App.tsx                    # Main app component with router
│   │   ├── routes.ts                  # Route configuration
│   │   │
│   │   ├── screens/                   # All screen components
│   │   │   ├── OnboardingScreen.tsx           # Welcome screen
│   │   │   ├── MoodCheckInScreen.tsx          # Mood & stress check-in
│   │   │   ├── VoiceInputScreen.tsx           # Voice recording
│   │   │   ├── AIChatScreen.tsx               # AI conversation
│   │   │   ├── RiskResultScreen.tsx           # Assessment results
│   │   │   ├── ProgressDashboard.tsx          # Analytics & achievements
│   │   │   └── EmergencyMode.tsx              # Emergency support
│   │   │
│   │   └── components/
│   │       ├── NavigationMenu.tsx             # Dev navigation
│   │       ├── ComponentLibrary.tsx           # Component showcase
│   │       ├── DesignSystemShowcase.tsx       # Design tokens display
│   │       │
│   │       ├── design-system/         # Reusable design components
│   │       │   ├── PrimaryButton.tsx          # Multi-variant buttons
│   │       │   ├── MoodButton.tsx             # Emoji mood selector
│   │       │   ├── XPBadge.tsx                # Experience points badge
│   │       │   ├── StreakCounter.tsx          # Daily streak display
│   │       │   ├── RiskCard.tsx               # Risk level cards
│   │       │   ├── AchievementBadge.tsx       # Achievement system
│   │       │   └── GlassCard.tsx              # Glass morphism container
│   │       │
│   │       ├── ui/                    # Base UI components (Radix + shadcn)
│   │       │   ├── button.tsx
│   │       │   ├── card.tsx
│   │       │   ├── slider.tsx
│   │       │   ├── progress.tsx
│   │       │   └── ... (other UI components)
│   │       │
│   │       └── figma/
│   │           └── ImageWithFallback.tsx      # Image component
│   │
│   └── styles/
│       ├── index.css                  # Main styles
│       ├── tailwind.css               # Tailwind imports
│       ├── theme.css                  # Design tokens & CSS variables
│       └── fonts.css                  # Font imports
│
└── package.json                       # Dependencies
```

## 🎨 Design System Components

### `/src/app/components/design-system/`

#### PrimaryButton
Multi-variant button component with size options:
- Variants: `primary` | `secondary` | `accent` | `emergency`
- Sizes: `sm` | `md` | `lg`
- Props: `fullWidth`, `disabled`

#### MoodButton
Interactive emoji-based mood selector:
- Props: `emoji`, `label`, `selected`, `onClick`
- Animations: Scale on hover/tap

#### XPBadge
Animated experience points display:
- Props: `points`, `animated`
- Gold gradient with star icon

#### StreakCounter
Daily check-in streak indicator:
- Props: `days`
- Fire gradient with flame icon

#### RiskCard
Color-coded risk level cards:
- Levels: `low` | `moderate` | `high`
- Props: `level`, `title`, `description`

#### AchievementBadge
Unlockable achievement system:
- Types: `silver` | `gold` | `platinum`
- Props: `title`, `description`, `icon`, `type`, `unlocked`

#### GlassCard
Glassmorphism container:
- Backdrop blur effect
- White/transparent background
- Soft border

## 📱 Screen Components

### `/src/app/screens/`

#### OnboardingScreen (`/`)
- Animated welcome with floating hearts
- PsychTriage branding
- Tagline and value proposition
- Privacy assurance
- CTA to start check-in

#### MoodCheckInScreen (`/mood-checkin`)
- 5-point emoji mood selector
- Stress level slider (0-100%)
- Daily streak counter
- XP gamification card
- Progress indicator (Step 1 of 3)
- Animated XP badge on completion

#### VoiceInputScreen (`/voice-input`)
- Animated waveform visualization
- Record/stop toggle button
- Real-time emotion detection
- Transcript display
- Skip option

#### AIChatScreen (`/ai-chat`)
- Conversational UI with bot avatar
- Message bubbles (user/bot)
- Typing indicator animation
- Progress bar (33% → 99%)
- Achievement badge on completion
- Mock conversation flow

#### RiskResultScreen (`/risk-result`)
- Color-coded risk card
- Understanding your results section
- 4 personalized suggestions
- Professional help CTA
- Emergency button (if high risk)
- XP reward (+25 XP)

#### ProgressDashboard (`/dashboard`)
- Two tabs: Overview & Achievements
- Weekly mood area chart
- Stress level line chart
- Stats cards (check-ins, improvement, badges)
- Achievement badge grid
- Motivational messages
- Total XP and streak display

#### EmergencyMode (`/emergency`)
- Dark, serious UI theme
- Tele-MANAS (14416) call button
- KIRAN (1800-599-0019) contact
- Safety tips checklist
- Nearby support locator
- Confidentiality assurance
- Breathing exercise link

## 🎯 Routes Configuration

### `/src/app/routes.ts`

```typescript
/ → OnboardingScreen
/mood-checkin → MoodCheckInScreen
/voice-input → VoiceInputScreen
/ai-chat → AIChatScreen
/risk-result → RiskResultScreen
/dashboard → ProgressDashboard
/emergency → EmergencyMode
/components → ComponentLibrary
/design-system → DesignSystemShowcase
```

## 🎨 Theme Configuration

### `/src/styles/theme.css`

CSS Variables defined:
- Primary colors (teal, blue, purple, yellow)
- Risk level colors (green, amber, red)
- Gamification colors (XP gold, streak fire, badges)
- Neutral grays (50-900)
- UI tokens (card, popover, muted, accent)
- Radius values (sm, md, lg, xl)

## 📦 Dependencies

### Core
- React 18.3.1
- React Router 7.13.0
- Motion 12.23.24

### UI & Styling
- Tailwind CSS 4.1.12
- Radix UI components
- Lucide React (icons)

### Data Visualization
- Recharts 2.15.2

### Utilities
- Class Variance Authority
- Tailwind Merge
- CLSX

## 🚀 Development Workflow

1. **Start**: Navigate to `/` (Onboarding)
2. **Test Flow**: Use navigation menu to visit each screen
3. **View Components**: Visit `/components` for component library
4. **Check Design**: Visit `/design-system` for design tokens
5. **Build**: Run `pnpm build` for production

## 📝 Best Practices

### Component Creation
1. Place reusable components in `/components/design-system/`
2. Use Motion for animations
3. Follow color palette from theme.css
4. Maintain 4px spacing grid
5. Ensure mobile-first responsive design

### Styling Guidelines
1. Use Tailwind utility classes
2. Reference CSS variables for colors
3. Apply consistent border radius
4. Use shadow utilities for depth
5. Maintain accessibility standards

### File Naming
- Screens: `[Name]Screen.tsx`
- Components: `[Name].tsx` (PascalCase)
- Utilities: `[name].ts` (camelCase)

## 🔧 Customization

### Colors
Edit `/src/styles/theme.css` to modify color palette

### Components
Add new components to `/src/app/components/design-system/`

### Screens
Create new screens in `/src/app/screens/`
Add route in `/src/app/routes.ts`

### Navigation
Update `/src/app/components/NavigationMenu.tsx` to add menu items

---

**Need Help?** Check [README.md](./README.md) | [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | [QUICKSTART.md](./QUICKSTART.md)
