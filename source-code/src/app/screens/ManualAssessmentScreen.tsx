import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, ClipboardList } from "lucide-react";

type Question = {
  id: string;
  scale: "PHQ-9" | "GAD-7";
  text: string;
};

const responseOptions = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half the days" },
  { value: 3, label: "Nearly every day" },
];

const questions: Question[] = [
  { id: "phq1", scale: "PHQ-9", text: "Little interest or pleasure in doing things" },
  { id: "phq2", scale: "PHQ-9", text: "Feeling down, depressed, or hopeless" },
  { id: "phq3", scale: "PHQ-9", text: "Trouble falling or staying asleep, or sleeping too much" },
  { id: "phq4", scale: "PHQ-9", text: "Feeling tired or having little energy" },
  { id: "phq5", scale: "PHQ-9", text: "Poor appetite or overeating" },
  { id: "phq6", scale: "PHQ-9", text: "Feeling bad about yourself, or that you are a failure" },
  { id: "phq7", scale: "PHQ-9", text: "Trouble concentrating on things, like reading or watching TV" },
  { id: "phq8", scale: "PHQ-9", text: "Moving or speaking slowly, or being fidgety/restless" },
  { id: "phq9", scale: "PHQ-9", text: "Thoughts that you would be better off dead, or of hurting yourself" },
  { id: "gad1", scale: "GAD-7", text: "Feeling nervous, anxious, or on edge" },
  { id: "gad2", scale: "GAD-7", text: "Not being able to stop or control worrying" },
  { id: "gad3", scale: "GAD-7", text: "Worrying too much about different things" },
  { id: "gad4", scale: "GAD-7", text: "Trouble relaxing" },
  { id: "gad5", scale: "GAD-7", text: "Being so restless that it is hard to sit still" },
  { id: "gad6", scale: "GAD-7", text: "Becoming easily annoyed or irritable" },
  { id: "gad7", scale: "GAD-7", text: "Feeling afraid as if something awful might happen" },
];

export function ManualAssessmentScreen() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const current = questions[index];
  const answeredCount = useMemo(
    () => questions.filter((q) => typeof answers[q.id] === "number").length,
    [answers]
  );

  const progress = Math.round((answeredCount / questions.length) * 100);

  const setAnswer = (value: number) => {
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
  };

  const goNext = () => {
    if (index < questions.length - 1) {
      setIndex((prev) => prev + 1);
    }
  };

  const goPrev = () => {
    if (index > 0) {
      setIndex((prev) => prev - 1);
    }
  };

  const firstUnanswered = useMemo(
    () => questions.findIndex((q) => typeof answers[q.id] !== "number"),
    [answers]
  );

  const submit = () => {
    if (answeredCount !== questions.length) return;

    const phqScore = questions
      .filter((q) => q.scale === "PHQ-9")
      .reduce((sum, q) => sum + (answers[q.id] ?? 0), 0);

    const gadScore = questions
      .filter((q) => q.scale === "GAD-7")
      .reduce((sum, q) => sum + (answers[q.id] ?? 0), 0);

    navigate("/manual-assessment/result", {
      state: {
        phqScore,
        gadScore,
        // PHQ-9 item 9 is the self-harm / suicidal-ideation item. It is carried
        // separately because clinical scoring escalates on ANY non-zero answer
        // here, independent of the total score.
        phq9Item: answers.phq9 ?? 0,
        completedAt: Date.now(),
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-4">
        <button
          onClick={() => navigate("/")}
          className="mb-4 text-neutral-600 hover:text-neutral-800 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
            <p className="text-sm text-neutral-500">Manual Measure</p>
          </div>
          <h1 className="text-3xl font-semibold text-neutral-900">PHQ-9 + GAD-7 Assessment</h1>
          <p className="text-neutral-600 mt-2">
            Answer based on the last 2 weeks. This is a screening tool, not a diagnosis.
          </p>
        </motion.div>

        <div className="mt-5 h-2 bg-white rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="mt-2 text-sm text-neutral-600">
          Question {index + 1} of {questions.length} • {answeredCount}/{questions.length} answered
        </div>

        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-white rounded-3xl p-6 shadow-lg"
        >
          <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 mb-4">
            {current.scale}
          </div>
          <h2 className="text-xl font-medium text-neutral-800 leading-relaxed">{current.text}</h2>

          <div className="mt-6 space-y-3">
            {responseOptions.map((option) => {
              const selected = answers[current.id] === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setAnswer(option.value)}
                  className={`w-full text-left rounded-2xl border p-4 transition ${
                    selected
                      ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-indigo-300"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={goPrev}
            disabled={index === 0}
            className="flex-1 rounded-full border border-neutral-300 py-3 font-medium text-neutral-700 disabled:opacity-40"
          >
            Previous
          </button>

          {index < questions.length - 1 ? (
            <button
              onClick={goNext}
              className="flex-1 rounded-full bg-indigo-600 text-white py-3 font-semibold flex items-center justify-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={answeredCount !== questions.length}
              className="flex-1 rounded-full bg-emerald-600 text-white py-3 font-semibold disabled:opacity-40"
            >
              Measure & View Report
            </button>
          )}
        </div>

        {/* Without this, reaching the last question with gaps leaves the submit
            button greyed out and no way to tell which answers are missing. */}
        {firstUnanswered !== -1 && index === questions.length - 1 && (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 flex items-center justify-between gap-3">
            <span>
              {questions.length - answeredCount} question
              {questions.length - answeredCount === 1 ? "" : "s"} still unanswered.
            </span>
            <button
              onClick={() => setIndex(firstUnanswered)}
              className="shrink-0 rounded-full bg-amber-600 px-4 py-1.5 font-semibold text-white"
            >
              Go to Q{firstUnanswered + 1}
            </button>
          </div>
        )}

        <p className="mt-6 pb-8 text-xs text-neutral-500">
          PHQ-9 and GAD-7 are validated screening questionnaires. This tool does not
          provide a diagnosis. If you are in immediate danger, call Tele-MANAS on 14416.
        </p>
      </div>
    </div>
  );
}
