# 🎮 MindQuest - Feature Breakdown

## 🎯 Core Concept

**MindQuest** transforms anxiety assessment into an interactive game with 3 progressive levels that measure stress response, cognitive function, and coping strategies.

---

## 🌟 Screen-by-Screen Features

### 1️⃣ Game Start Screen (`/mindquest`)

#### Visual Design
```
┌─────────────────────────────────┐
│  Gradient Background (Teal→Blue→Purple)
│     
│        🧠 [Brain Icon + Sparkles]
│        
│      MindQuest
│  Discover Your Mental Wellness
│     
│  ┌─────────────────────────────┐
│  │ 💙 A Journey Through 3 Levels│
│  │                             │
│  │ • Level 1: Calm Breathing   │
│  │ • Level 2: Memory & Awareness│
│  │ • Level 3: Response Under   │
│  │            Pressure         │
│  └─────────────────────────────┘
│     
│  [Start Your Mind Journey →]
│     
│  ⏱️ Takes ~5 minutes • 🔒 Private
└─────────────────────────────────┘
```

#### Animations
- ✨ 3 floating orbs (different speeds)
- 💫 Pulsing glow on brain icon
- 🌟 Rotating sparkles
- 📥 Staggered fade-in entrance

---

### 2️⃣ Level 1: Calm Mode (`/mindquest/level1`)

#### Objective
**Measure baseline focus and breathing awareness**

#### Layout
```
┌─────────────────────────────────┐
│ Level 1 - Calm Mode    Progress │
│ ▓▓▓▓░░░░░░░░░░░░░░░░   2/5     │
│                                 │
│   [Tap the floating objects]    │
│                                 │
│          ☁️                      │
│                    🌞            │
│     💧                           │
│              ⭕ Breathe In       │
│                                 │
│                     🌿          │
│   ✨                            │
│                                 │
└─────────────────────────────────┘
```

#### Interactions
- 👆 **Tap** 5 floating objects (cloud, droplet, leaf, sun, sparkles)
- 🌬️ **Follow** breathing circle guidance
  - "Breathe In" (4 seconds)
  - "Hold" (4 seconds)  
  - "Breathe Out" (4 seconds)
- ✨ **Sparkle effect** on each tap
- 📊 **Progress bar** updates

#### Visual Feedback
```javascript
Object Tap → 
  ✨ Sparkle animation
  📉 Object fades out
  ➕ Progress counter +1
  
All Tapped →
  🎉 "Level 1 Complete!"
  ⭐ +50 XP
  ⏭️ Auto-advance to Level 2
```

---

### 3️⃣ Level 2: Challenge Mode (`/mindquest/level2`)

#### Phase A: Quiz (3 Questions)

##### Layout
```
┌─────────────────────────────────┐
│ Level 2 • Quiz Phase    ⏱️ 28s  │
│ ▓▓▓▓▓▓░░░░░░░░░░░░░░░░         │
│                                 │
│ 🧠 Question 1 of 3               │
│ When you feel overwhelmed,      │
│ which is most helpful?          │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ○ Take deep breaths         │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ ○ Ignore the feeling        │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ ○ Get angry                 │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ ○ Rush through tasks        │ │
│ └─────────────────────────────┘ │
│                                 │
│ ⚡ Current Score: 1/3            │
└─────────────────────────────────┘
```

##### Mechanics
- ⏰ **30-second timer** per question
- ✅ **Immediate feedback**: Green checkmark for correct
- ❌ **Visual cue**: Red X for incorrect
- 📊 **Score tracking**: Running total displayed
- ⏭️ **Auto-advance**: Next question after 1.5s

#### Phase B: Memory Game (4 Pairs)

##### Layout
```
┌─────────────────────────────────┐
│ Level 2 • Memory Phase   2/4    │
│                                 │
│     Match the Pairs             │
│                                 │
│    ┌──┐ ┌──┐ ┌──┐ ┌──┐         │
│    │🧠│ │🌸│ │🧠│ │🌺│         │
│    └──┘ └──┘ └──┘ └──┘         │
│                                 │
│    ┌──┐ ┌──┐ ┌──┐ ┌──┐         │
│    │🌻│ │🌺│ │🌻│ │🌸│         │
│    └──┘ └──┘ └──┘ └──┘         │
│                                 │
└─────────────────────────────────┘
```

##### Mechanics
- 🎴 **8 cards** (4 pairs): 🌸 🌺 🌻 🌼
- 🔄 **3D flip animation** on click
- 💚 **Matched pairs**: Turn green, stay flipped
- ❌ **No match**: Flip back after 1 second
- 🎯 **Win condition**: All 4 pairs matched
- ⭐ **Reward**: +75 XP
- ⏭️ **Auto-advance** to Level 3

---

### 4️⃣ Level 3: Stress Mode (`/mindquest/level3`)

#### Objective
**Assess response under pressure and stress management**

#### Layout
```
┌─────────────────────────────────┐
│ Level 3 • High Intensity        │
│ Stress Mode ⚠️        💓 95 BPM │⏰ 12s
│ ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░           │
│                                 │
│    ⚡ URGENT! ⚡    (distraction)│
│                                 │
│ 🎯 Question 2 of 4               │
│ Someone criticizes your work    │
│ unfairly. Your response?        │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ○ Get defensive immediately │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ ● Take a breath and respond │ │ ← Selected
│ │   calmly                    │ │
│ └─────────────────────────────┘ │
│ ... (2 more options)            │
│                                 │
│ Stress Level: ▓▓▓▓▓░░░  High   │
└─────────────────────────────────┘
```

#### Stress Elements
1. **⏰ Countdown Timer**: 15 seconds per question
   - Turns RED at 5 seconds
   - Pulsing animation when low
   - Screen SHAKE effect

2. **❗ Random Distractions**: 
   - "NEW MESSAGE!"
   - "URGENT!"
   - "BREAKING NEWS"
   - "ALERT!"
   - Pop up every 3 seconds
   - Animated with rotation/scale
   - Disappear after 2 seconds

3. **💓 Heart Rate Monitor**:
   - Starts at 75 BPM
   - Increases with distractions (+5)
   - Increases with wrong answers (+10)
   - Decreases with correct answers (-10)
   - Range: 60-130 BPM
   - Pulsing heart icon

4. **📊 Stress Level Meter**:
   - Green: <80 BPM (Low)
   - Yellow: 80-99 BPM (Moderate)
   - Red: 100+ BPM (High)
   - Visual bar with color gradient

#### Scoring
- 4 questions total
- +25 XP per correct answer
- Auto-timeout if no response
- Total possible: +100 XP

---

### 5️⃣ Result Screen (`/mindquest/result`)

#### Anxiety Level Display

##### Low Anxiety (😊 Green)
```
┌─────────────────────────────────┐
│      🏆 Quest Complete!          │
│                                 │
│   Your Anxiety Level            │
│          😊                     │
│         LOW                     │
│                                 │
│  ▓▓▓▓▓▓▓░░░░░░░░░░ ← You are here
│  High         Low               │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 💚 What this means:          │ │
│ │ You demonstrated great stress│ │
│ │ management skills and coping │ │
│ │ strategies. Keep it up!      │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

##### Moderate Anxiety (😐 Yellow)
- Score: 50-74% correct
- Message: "You're managing okay but could benefit from additional support"
- Color scheme: Yellow/Orange

##### High Anxiety (😟 Red)
- Score: <50% correct
- Message: "You may be experiencing significant stress. Consider professional support."
- Color scheme: Red/Orange
- **Extra button**: "Talk to Support Now" → `/emergency`

#### Rewards Section
```
┌─────────────────────────────────┐
│  ✨ Rewards Earned               │
│                                 │
│   ⭐ +175 XP    🔥 1 Streak      │
│   Total XP      Quest Streak    │
│                                 │
│       🏅 Mind Explorer           │
│         (Gold Badge)            │
│                                 │
│  ┌─────────────────────────────┐│
│  │ 🎯 3/4  │ 🧠 3  │ ⚡ 5 min  ││
│  │ Correct │Levels │Time Taken ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

#### Action Buttons
```
If High Anxiety:
  [📞 Talk to Support Now] (Red gradient)
  
Always:
  [📈 View Progress Dashboard] (Teal gradient)
  [🔄 Retake Quest] (White outline)
```

---

## 🎨 Design Tokens

### Color Progression by Level

#### Level 1: Calm
```css
Background: from-teal-50 via-blue-50 to-purple-50
Objects: 
  Cloud: #93C5FD (blue-300)
  Droplet: #5EEAD4 (teal-300)
  Leaf: #86EFAC (green-300)
  Sun: #FCD34D (yellow-300)
  Sparkles: #C4B5FD (purple-300)
```

#### Level 2: Challenge
```css
Phase A (Quiz):
  Background: from-blue-50 via-indigo-50 to-purple-50
  Progress: from-blue-400 to-purple-400
  Correct: green-400
  Incorrect: red-400

Phase B (Memory):
  Background: from-indigo-50 via-purple-50 to-pink-50
  Cards Back: from-purple-400 to-pink-400
  Cards Matched: from-green-200 to-teal-200
```

#### Level 3: Stress
```css
Background: from-red-50 via-orange-50 to-purple-50
Progress: from-red-500 via-orange-500 to-purple-500
Timer (Low): red-500 with pulse
Distractions:
  Red: #EF4444
  Orange: #F97316
  Purple: #A855F7
  Yellow: #CA8A04
```

#### Results: Adaptive
```css
Low Anxiety:
  Primary: from-green-400 to-teal-400
  Background: green-50
  Border: green-200

Moderate:
  Primary: from-yellow-400 to-orange-400
  Background: yellow-50
  Border: yellow-200

High:
  Primary: from-red-400 to-orange-400
  Background: red-50
  Border: red-200
```

---

## ⚡ Animation Specifications

### Entrance Animations
```typescript
Initial State → Animated State (Duration)

Fade In:
  opacity: 0 → 1 (0.8s)
  
Slide Up:
  y: 20 → 0 (0.8s)
  
Scale In:
  scale: 0 → 1 (0.6s, spring)
  
Staggered:
  delay: 0.2s increments
```

### Floating Objects
```typescript
Y-axis oscillation:
  y: [0, -20, 0]
  duration: 3-4.5s (varies per object)
  repeat: Infinity
  ease: easeInOut
```

### Breathing Circle
```typescript
Inhale (4s):
  scale: 1 → 1.3
  opacity: 0.6 → 1

Hold (4s):
  scale: 1.3
  opacity: 1

Exhale (4s):
  scale: 1.3 → 1
  opacity: 1 → 0.6
```

### Card Flip (3D)
```typescript
transform: rotateY(0deg) → rotateY(180deg)
duration: 0.3s
perspective: preserve-3d
backface-visibility: hidden
```

### Distraction Pop-ups
```typescript
Initial:
  opacity: 0
  scale: 0
  x: random(0-300)
  y: random(0-400)

Animate:
  opacity: [0, 1, 1, 0]
  scale: [0, 1.2, 1, 0.8]
  rotate: [0, 10, -10, 0]
  
Duration: 2s
```

### Confetti (Results)
```typescript
20 particles:
  colors: [teal, blue, purple, yellow]
  
Animation:
  y: 0 → window.innerHeight
  x: 0 → random(-50 to 50)
  rotate: 0 → 360
  opacity: 1 → 0
  
Duration: 2-4s (randomized)
Repeat: Infinity
```

---

## 🧪 Testing Scenarios

### Test Case 1: Perfect Score
```
Actions:
- Complete Level 1 (all objects tapped)
- Answer all 3 quiz questions correctly
- Match all 4 pairs quickly
- Answer all 4 stress questions correctly

Expected Result:
- Score: 4/4 (100%)
- Anxiety Level: LOW 😊
- Total XP: 50 + 75 + 100 = 225 XP
- Badge: Mind Explorer (Gold)
```

### Test Case 2: Moderate Performance
```
Actions:
- Complete Level 1
- Answer 2/3 quiz correctly
- Match all pairs (slower)
- Answer 2/4 stress correctly

Expected Result:
- Score: 2/4 (50%)
- Anxiety Level: MODERATE 😐
- Total XP: 50 + 75 + 50 = 175 XP
- Suggestion: View resources
```

### Test Case 3: High Anxiety Detection
```
Actions:
- Complete Level 1
- Answer 1/3 quiz correctly
- Match pairs (takes time)
- Answer 0/4 stress correctly (timeout)

Expected Result:
- Score: 0/4 (0%)
- Anxiety Level: HIGH 😟
- Total XP: 50 + 75 + 0 = 125 XP
- Action: "Talk to Support Now" button
- Redirects to Emergency Mode
```

---

## 📊 XP Breakdown

```
Level 1: +50 XP (fixed)
  ✓ Complete breathing exercise
  ✓ Tap all 5 objects

Level 2: +75 XP (fixed)
  ✓ Attempt all 3 quiz questions
  ✓ Complete memory game

Level 3: +25 XP per correct (0-100 total)
  ✓ Each correct answer: +25 XP
  ✓ Maximum: 4 × 25 = +100 XP

Total Range: 125-225 XP per playthrough
```

---

## 🎯 Success Metrics

### User Engagement
- ✅ Completion rate per level
- ✅ Average time spent (target: 5 minutes)
- ✅ Retry rate
- ✅ Support access rate (High anxiety)

### Therapeutic Effectiveness
- ✅ Self-awareness increase
- ✅ Stress recognition improvement
- ✅ Coping strategy knowledge
- ✅ Help-seeking behavior

### Technical Performance
- ✅ 60 FPS animations
- ✅ <3s screen transitions
- ✅ No memory leaks (timer cleanup)
- ✅ Mobile responsiveness

---

## 🔮 Future Enhancements

### Backend Integration
```typescript
// Save results to Supabase
interface MindQuestResult {
  userId: string;
  timestamp: Date;
  score: number;
  anxietyLevel: 'low' | 'moderate' | 'high';
  xpEarned: number;
  level1Time: number;
  level2Time: number;
  level3Time: number;
  heartRatePeak: number;
}
```

### Personalization
- Adaptive difficulty based on history
- Custom question sets
- Preferred interaction styles
- Language selection (Hindi, Tamil, etc.)

### Social Features
- Anonymous result sharing
- Community challenges
- Leaderboards (XP-based)
- Friend support system

### Accessibility
- Screen reader support
- High contrast mode
- Voice-over guidance
- Adjustable timing

---

## 📱 Mobile Optimization

### Touch Targets
- Minimum: 80×80px (Level 1 objects)
- Recommended: 48×48px (cards, buttons)
- Spacing: 8px minimum between targets

### Viewport Considerations
- Max width: 448px (max-w-md)
- Safe padding: 24px (p-6)
- Scrollable overflow: max-h-[70vh]

### Performance
- Conditional animations on low-end devices
- requestAnimationFrame for timers
- CSS transforms (GPU-accelerated)
- Lazy loading for images

---

## 🎓 Therapeutic Justification

### Level 1: Baseline + Mindfulness
**Purpose**: Establish calm baseline before assessment
- Teaches diaphragmatic breathing
- Reduces initial anxiety
- Improves focus for subsequent tasks

### Level 2: Cognitive Function
**Purpose**: Assess problem-solving under mild pressure
- Mental health awareness (quiz)
- Working memory (memory game)
- Decision-making speed

### Level 3: Stress Response
**Purpose**: Observe reactions to pressure and distraction
- Fight-or-flight activation
- Emotional regulation
- Stress tolerance threshold

### Results: Self-Awareness
**Purpose**: Educate and provide actionable next steps
- Non-judgmental feedback
- Clear explanation
- Professional support pathways

---

**MindQuest** successfully gamifies anxiety assessment while maintaining clinical validity and therapeutic safety. 🧠✨
