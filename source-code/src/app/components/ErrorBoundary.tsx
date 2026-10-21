import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, Phone, RotateCcw } from "lucide-react";

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Catches render-time crashes anywhere in the screen tree. Without it a thrown
 * error unmounts the whole app and leaves a blank white page — which, in a
 * wellness app someone may have opened while distressed, also silently removes
 * the helpline numbers. So the fallback keeps them on screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("MindQuest crashed:", error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
    window.location.assign("/");
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-7 w-7 text-amber-600" />
          </div>

          <h1 className="text-2xl font-semibold text-neutral-900">
            Something went wrong
          </h1>
          <p className="mt-2 text-neutral-600">
            The app hit an unexpected error. Your gameplay data is stored on this
            device and has not been lost.
          </p>

          <button
            onClick={this.handleReset}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 py-3 font-semibold text-white"
          >
            <RotateCcw className="h-4 w-4" />
            Back to start
          </button>

          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-900">
              Need to talk to someone right now?
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <a
                href="tel:14416"
                className="flex items-center justify-center gap-2 rounded-full bg-red-600 px-3 py-2 text-sm font-semibold text-white"
              >
                <Phone className="h-4 w-4" />
                Tele-MANAS
              </a>
              <a
                href="tel:18005990019"
                className="flex items-center justify-center gap-2 rounded-full border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-800"
              >
                <Phone className="h-4 w-4" />
                KIRAN
              </a>
            </div>
          </div>

          {import.meta.env.DEV && (
            <pre className="mt-6 max-h-40 overflow-auto rounded-xl bg-neutral-900 p-3 text-xs text-neutral-100">
              {error.stack ?? error.message}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
