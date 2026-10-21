import { RouterProvider } from "react-router";
import { router } from "./routes";
import { NavigationMenu } from "./components/NavigationMenu";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <NavigationMenu />
    </ErrorBoundary>
  );
}
