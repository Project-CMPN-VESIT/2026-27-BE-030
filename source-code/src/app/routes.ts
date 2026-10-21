import { createBrowserRouter } from "react-router";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { ProgressDashboard } from "./screens/ProgressDashboard";
import { EmergencyMode } from "./screens/EmergencyMode";
import { GameStartScreen } from "./screens/GameStartScreen";
import { Level1CalmMode } from "./screens/Level1CalmMode";
import { Level2PuzzleMode } from "./screens/Level2PuzzleMode";
import { Level3SlicingMode } from "./screens/Level3SlicingMode";
import { Level4RunnerMode } from "./screens/Level4RunnerMode";
import { MindQuestResultScreen } from "./screens/MindQuestResultScreen";
import { ManualAssessmentScreen } from "./screens/ManualAssessmentScreen";
import { ManualAssessmentResultScreen } from "./screens/ManualAssessmentResultScreen";
import { BreathingExerciseScreen } from "./screens/BreathingExerciseScreen";
import { PreGameBreathingScreen } from "./screens/PreGameBreathingScreen";
import { NotFoundScreen } from "./screens/NotFoundScreen";

// Split out of the initial bundle. The dashboard pulls in recharts, and the two
// gallery screens pull in the whole Radix + MUI surface; none of them are on the
// path a first-time visitor takes, so they load on demand instead.
const progressDashboard = async () => ({
  Component: (await import("./screens/ProgressDashboard")).ProgressDashboard,
});
const designSystemShowcase = async () => ({
  Component: (await import("./components/DesignSystemShowcase")).DesignSystemShowcase,
});
const componentLibrary = async () => ({
  Component: (await import("./components/ComponentLibrary")).ComponentLibrary,
});
// The ElevenLabs SDK ships a WebRTC stack that only this one screen needs.
const aiBuddyScreen = async () => ({
  Component: (await import("./screens/AiBuddyScreen")).default,
});

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginScreen, // The dedicated Sign-Up / Login screen is the start page
  },
  {
    path: "/home",
    Component: OnboardingScreen, // Main Home Screen after logging in
  },
  {
    path: "/login",
    Component: LoginScreen,
  },
  {
    path: "/dashboard",
    lazy: progressDashboard,
  },
  {
    path: "/emergency",
    Component: EmergencyMode,
  },
  {
    path: "/design-system",
    lazy: designSystemShowcase,
  },
  {
    path: "/components",
    lazy: componentLibrary,
  },
  {
    path: "/mindquest",
    Component: GameStartScreen,
  },
  {
    path: "/mindquest/breathing",
    Component: PreGameBreathingScreen,
  },
  {
    path: "/mindquest/level1",
    Component: Level1CalmMode,
  },
  // Quest order lives in mindquest/quest.ts; these paths must match it.
  {
    path: "/mindquest/level2",
    Component: Level2PuzzleMode,
  },
  {
    path: "/mindquest/level3",
    Component: Level3SlicingMode,
  },
  {
    path: "/mindquest/level4",
    Component: Level4RunnerMode,
  },
  {
    path: "/mindquest/result",
    Component: MindQuestResultScreen,
  },
  {
    path: "/manual-assessment",
    Component: ManualAssessmentScreen,
  },
  {
    path: "/manual-assessment/result",
    Component: ManualAssessmentResultScreen,
  },
  {
    path: "/breathing",
    Component: BreathingExerciseScreen,
  },
  {
    path: "/ai-buddy",
    lazy: aiBuddyScreen,
  },
  {
    // Catch-all: unknown URLs render the 404 screen instead of a blank page.
    path: "*",
    Component: NotFoundScreen,
  },
]);
