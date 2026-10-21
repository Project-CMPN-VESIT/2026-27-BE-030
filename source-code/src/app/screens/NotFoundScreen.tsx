import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { Compass, Home } from "lucide-react";

/** Catch-all for unknown URLs, so a mistyped or stale link is not a blank page. */
export function NotFoundScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5EEAD4] via-[#3B82F6] to-[#A78BFA] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl bg-white/95 p-8 text-center shadow-2xl backdrop-blur-sm"
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
          <Compass className="h-8 w-8 text-blue-600" />
        </div>

        <h1 className="text-3xl font-bold text-neutral-900">Page not found</h1>
        <p className="mt-3 text-neutral-600">
          That link does not lead anywhere in MindQuest. Head back and start a
          quest instead.
        </p>

        <button
          onClick={() => navigate("/")}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-blue-500 py-4 font-semibold text-white shadow-lg"
        >
          <Home className="h-5 w-5" />
          Back to home
        </button>

        <button
          onClick={() => navigate("/emergency")}
          className="mt-3 w-full rounded-full border-2 border-neutral-200 py-3 font-medium text-neutral-700"
        >
          I need support now
        </button>
      </motion.div>
    </div>
  );
}
