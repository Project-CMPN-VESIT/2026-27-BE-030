# MindQuest - Gamified Anxiety Assessment Game

## 🎮 Overview

MindQuest is a gamified, mobile-first UI for an AI-based anxiety assessment platform. It transforms traditional mental health screening into an engaging, interactive experience with three progressive levels designed to measure stress response and coping mechanisms.

## 🌟 Key Features

### Design Philosophy
- **Clean & Calming**: Soft gradients (blue, teal, purple) with smooth animations
- **Gamified but Professional**: Engaging mechanics without childish aesthetics
- **Mobile-First**: Optimized for smartphone interactions
- **Emotionally Safe**: Supportive feedback and encouraging messaging

### Design Screens

#### 1. Game Start Screen (`/mindquest`)
- Welcoming gradient background with animated floating bubbles
- Brain icon with pulsing glow effect
- Clear explanation of the 3-level journey
- "Start Your Mind Journey" CTA button
- Estimated time and privacy assurance

**Features:**
- Animated background orbs floating with different speeds
- Sparkles animation on logo
- Glass-morphism UI cards
- Smooth entrance animations

#### 2. Level 1: Calm Mode (`/mindquest/level1`)
**Objective:** Measure baseline focus and breathing awareness

**Mechanics:**
- Floating objects (cloud, droplet, leaf, sun, sparkles) to tap
- Central breathing circle with animated inhale/hold/exhale cycle
- Progress tracking (5/5 objects)
- Calming pastel color scheme (teal, blue, green)

**Features:**
- Synchronized breathing animation (4-second cycles)
- Gentle floating animations for objects
- Sparkle effect on tap
- Auto-progression to Level 2 upon completion
- +50 XP reward

#### 3. Level 2: Challenge Mode (`/mindquest/level2`)
**Objective:** Test cognitive processing and memory under mild pressure

**Two Phases:**

**Phase A - Quiz:**
- Timer-based mental health awareness questions (30s each)
- 3 multiple-choice questions
- Immediate visual feedback (green checkmark/red X)
- Score tracking with lightning bolt icon

**Phase B - Memory Game:**
- 8-card matching game (4 pairs of flower emojis)
- Card flip animations with 3D transforms
- Color-coded feedback (green for matched)
- Match counter (4/4 pairs)

**Features:**
- Dynamic progress bars
- Timer countdown with visual urgency
- Smooth card flip transitions
- Auto-progression to Level 3
- +75 XP reward

#### 4. Level 3: Stress Mode (`/mindquest/level3`)
**Objective:** Assess response under pressure and stress management

**Mechanics:**
- 4 rapid-fire scenario-based questions (15s each)
- Countdown timer with red pulse at <5 seconds
- Random distraction pop-ups ("NEW MESSAGE!", "URGENT!", etc.)
- Simulated heart rate indicator (75-130 BPM)
- Screen shake effects when time is low

**Features:**
- Dynamic heart rate visualization
- Stress level meter (Low/Moderate/High)
- Animated distractions appearing randomly
- Red/orange color scheme for intensity
- Increased difficulty through time pressure
- Auto-redirect to Results screen

#### 5. Result Screen (`/mindquest/result`)
**Displays:**
- Anxiety Level Assessment: Low 😊 / Moderate 😐 / High 😟
- Visual slider meter with color gradient (green to red)
- Detailed explanation of results
- Total rewards earned:
  - XP Badge (total points from all levels)
  - Streak Counter (quest completion)
  - Achievement Badge ("Mind Explorer" gold badge)
- Performance statistics (correct answers, levels, time)

**Actions:**
- "Talk to Support Now" (if High anxiety detected)
- "View Progress Dashboard"
- "Retake Quest"

**Features:**
- Confetti animation on load
- Color-coded result cards (green/yellow/red)
- Rewards showcase with animations
- Professional disclaimer text
- Smooth transitions between sections

### Rewards System

#### XP Points
- Level 1 Completion: +50 XP
- Level 2 Completion: +75 XP
- Level 3 Performance: +25 XP per correct answer
- **Total Possible:** 225 XP per playthrough

#### Badges & Achievements
- **Mind Explorer** (Gold): Complete all 3 levels
- Integrates with existing achievement system

#### Calm Streak
- Tracks consecutive quest completions
- Uses existing StreakCounter component

## 🎨 Design System Integration

### Color Palette
```css
/* Primary Gradients */
Teal-Blue: from-teal-400 to-blue-400
Blue-Purple: from-blue-400 to-purple-400
Red-Orange: from-red-400 to-orange-400 (Stress Mode)
Purple-Pink: from-purple-400 to-pink-400 (Memory Phase)

/* Anxiety Level Colors */
Low: Green (#10B981)
Moderate: Yellow (#F59E0B)
High: Red (#EF4444)
```

### Components Used
- **XPBadge**: Display earned experience points
- **StreakCounter**: Show quest completion streaks
- **AchievementBadge**: Award completion badges
- Custom animated cards with glass-morphism

### Animations (Motion/React)
- **Floating Objects**: Smooth Y-axis oscillation
- **Breathing Circle**: Scale + opacity sync
- **Card Flips**: 3D rotateY transforms
- **Confetti**: Particle effects on completion
- **Micro-interactions**: Hover scale, tap feedback
- **Entrance Animations**: Fade + slide transitions

## 📱 Mobile Optimization

### Touch Interactions
- Large tap targets (80x80px minimum)
- Immediate visual feedback on press
- Disabled state prevents double-taps
- Swipe-friendly layouts

### Responsive Design
- Max-width containers (max-w-md)
- Flexible grid layouts
- Safe padding (p-6)
- Scrollable content areas

### Performance
- Lazy state updates
- Conditional animations
- Efficient re-renders
- Cleanup on unmount

## 🧠 Psychology & UX

### Therapeutic Design Principles
1. **Progressive Difficulty**: Gradual stress introduction
2. **Positive Reinforcement**: Rewards for all completions
3. **Clear Feedback**: Immediate response validation
4. **Safe Environment**: No punitive language
5. **User Control**: Can retake anytime
6. **Privacy First**: No data collection messaging

### Anxiety Assessment Logic
```javascript
// Scoring based on correct responses across all levels
const percentage = (score / totalQuestions) * 100;

if (percentage >= 75) return "Low Anxiety"     // Good coping
if (percentage >= 50) return "Moderate Anxiety" // Some challenges
return "High Anxiety"                            // Seek support
```

### Question Design
- **Level 1**: No questions, just breathing + focus
- **Level 2**: Awareness questions (no wrong answers socially)
- **Level 3**: Stress response scenarios (real-world situations)

## 🔗 Integration Points

### Navigation
- Accessible via Navigation Menu → "MindQuest Game"
- Direct link from Onboarding or Dashboard
- Result screen connects to:
  - Emergency Mode (if high anxiety)
  - Progress Dashboard
  - Quest restart

### Data Flow
```
GameStart → Level1 → Level2 → Level3 → Result
                                        ↓
                            state: { score, totalQuestions }
```

### Future Enhancements
- [ ] Save results to backend (Supabase)
- [ ] Historical trend tracking
- [ ] Personalized difficulty adjustment
- [ ] Multi-language support (Hindi, Tamil, etc.)
- [ ] Accessibility features (screen reader, high contrast)
- [ ] Social sharing (anonymized results)

## 🚀 Usage

### Starting the Game
1. Navigate to `/mindquest`
2. Read the introduction
3. Click "Start Your Mind Journey"
4. Progress through levels automatically
5. View results and next steps

### Navigation
- Use browser back button to exit (will lose progress)
- Auto-progression between levels
- Manual restart from result screen

### Testing Different Outcomes
- **Low Anxiety**: Answer all questions correctly
- **Moderate Anxiety**: Mix of correct/incorrect (50-75%)
- **High Anxiety**: Few correct answers (<50%)

## 📊 Components Architecture

```
/src/app/screens/
├── GameStartScreen.tsx       # Landing page
├── Level1CalmMode.tsx        # Breathing + floating objects
├── Level2ChallengeMode.tsx   # Quiz + memory game
├── Level3StressMode.tsx      # Stress response test
└── MindQuestResultScreen.tsx # Results + rewards

/src/app/components/design-system/
├── XPBadge.tsx              # Used for XP display
├── StreakCounter.tsx        # Used for streak tracking
└── AchievementBadge.tsx     # Used for rewards
```

## 🎯 User Journey

```
1. User lands on GameStartScreen
   ↓ Reads about 3 levels
   ↓ Clicks "Start Your Mind Journey"
   
2. Level 1: Calm Mode
   ↓ Taps 5 floating objects while breathing
   ↓ Earns +50 XP
   ↓ Auto-advances
   
3. Level 2: Challenge Mode
   ↓ Phase A: Answers 3 quiz questions (30s each)
   ↓ Phase B: Matches 4 pairs of cards
   ↓ Earns +75 XP
   ↓ Auto-advances
   
4. Level 3: Stress Mode
   ↓ Answers 4 questions under pressure (15s each)
   ↓ Deals with distractions
   ↓ Earns +25 XP per correct answer
   ↓ Auto-redirects with score data
   
5. Result Screen
   ↓ Views anxiety level assessment
   ↓ Sees total rewards (XP, badges, streak)
   ↓ Chooses next action:
      • Talk to Support (if High)
      • View Dashboard
      • Retake Quest
```

## 💡 Best Practices

### Accessibility
- High contrast text on backgrounds
- Large, clear fonts
- Icon + text labels
- Sufficient color differentiation

### Performance
- UseEffect cleanup for timers
- Conditional rendering for animations
- Memoized callbacks where needed
- Efficient state updates

### User Experience
- Clear instructions at each level
- Progress indicators throughout
- No dead ends (always have next action)
- Supportive, non-judgmental language

## 🔧 Customization

### Adjusting Difficulty
```typescript
// In Level3StressMode.tsx
const [timeLeft, setTimeLeft] = useState(15); // Reduce for harder

// In Level2ChallengeMode.tsx
const [timeLeft, setTimeLeft] = useState(30); // Reduce for harder
```

### Changing Scoring Thresholds
```typescript
// In MindQuestResultScreen.tsx
if (percentage >= 75) return { level: "Low", ... };   // Adjust threshold
if (percentage >= 50) return { level: "Moderate", ... }; // Adjust threshold
```

### Adding New Questions
```typescript
// In Level3StressMode.tsx
const stressQuestions = [
  {
    id: 5,
    question: "Your new question here",
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctIndex: 1,
  },
];
```

## 📝 Notes

- **Not a Clinical Diagnosis**: This is a screening tool only
- **Privacy**: No data is stored by default (add backend if needed)
- **Cultural Context**: Designed for Indian youth (18-35)
- **Emotional Safety**: Always provides supportive next steps
- **Gamification Balance**: Engaging but not trivializing mental health

## 🎨 Screenshots Reference

### Color Moods by Level
- **Level 1**: Calm pastels (teal, blue, green)
- **Level 2**: Vibrant learning (blue, indigo, purple)
- **Level 3**: Intensity (red, orange, purple)
- **Results**: Adaptive (green/yellow/red based on outcome)

---

**MindQuest** transforms anxiety assessment into an empowering journey of self-discovery. 🧠✨
