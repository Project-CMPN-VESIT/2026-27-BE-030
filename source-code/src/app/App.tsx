import { RouterProvider } from "react-router";
import { router } from "./routes";
import { NavigationMenu } from "./components/NavigationMenu";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { EmotionSensorProvider } from "./emotion/EmotionSensorProvider";

export default function App() {
  return (
    <ErrorBoundary>
      <EmotionSensorProvider>
        <RouterProvider router={router} />
      </EmotionSensorProvider>
      <NavigationMenu />
    </ErrorBoundary>
  );
}
