import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Send, Bot, User, Award } from "lucide-react";
import { Progress } from "../components/ui/progress";

interface Message {
  id: string;
  text: string;
  sender: "bot" | "user";
  timestamp: Date;
}

type MoodTone = "positive" | "low" | "anxious" | "angry" | "neutral";
type TopicKey = "sleep" | "work" | "social" | "body" | "general";

type FollowUpQuestion = {
  id: string;
  text: string;
};

type CompanionSessionMemory = {
  recentQuestionIds: string[];
  recentSnippetKeys: string[];
  lastMood: MoodTone;
  lastTopic: TopicKey;
  pendingActionCheckIn: boolean;
  lastActionLabel: string | null;
  actionCheckIns: number;
};

const COMPANION_MEMORY_KEY = "mindquest-ai-companion-memory-v1";

const defaultCompanionMemory = (): CompanionSessionMemory => ({
  recentQuestionIds: [],
  recentSnippetKeys: [],
  lastMood: "neutral",
  lastTopic: "general",
  pendingActionCheckIn: false,
  lastActionLabel: null,
  actionCheckIns: 0,
});

function loadCompanionMemory(): CompanionSessionMemory {
  if (typeof window === "undefined") {
    return defaultCompanionMemory();
  }

  const raw = window.sessionStorage.getItem(COMPANION_MEMORY_KEY);
  if (!raw) {
    return defaultCompanionMemory();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CompanionSessionMemory>;
    const fallback = defaultCompanionMemory();
    return {
      ...fallback,
      ...parsed,
      recentQuestionIds: parsed.recentQuestionIds ?? fallback.recentQuestionIds,
      recentSnippetKeys: parsed.recentSnippetKeys ?? fallback.recentSnippetKeys,
    };
  } catch {
    return defaultCompanionMemory();
  }
}

function saveCompanionMemory(memory: CompanionSessionMemory) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(COMPANION_MEMORY_KEY, JSON.stringify(memory));
}

const toneKeywords: Record<MoodTone, string[]> = {
  positive: ["happy", "good", "great", "better", "excited", "grateful", "relaxed", "fine"],
  low: ["sad", "down", "lonely", "empty", "tired", "hopeless", "cry", "upset"],
  anxious: ["anxious", "anxiety", "worried", "panic", "overwhelmed", "nervous", "stress", "stressed"],
  angry: ["angry", "mad", "frustrated", "annoyed", "irritated", "furious"],
  neutral: [],
};

function detectMoodTone(text: string): MoodTone {
  const normalized = text.toLowerCase();

  const scoreTone = (tone: Exclude<MoodTone, "neutral">) =>
    toneKeywords[tone].reduce((score, keyword) => {
      return normalized.includes(keyword) ? score + 1 : score;
    }, 0);

  const positive = scoreTone("positive");
  const low = scoreTone("low");
  const anxious = scoreTone("anxious");
  const angry = scoreTone("angry");

  const maxScore = Math.max(positive, low, anxious, angry);
  if (maxScore === 0) return "neutral";
  if (low === maxScore) return "low";
  if (anxious === maxScore) return "anxious";
  if (angry === maxScore) return "angry";
  return "positive";
}

function detectTopic(text: string): { key: TopicKey; question: string | null } {
  const normalized = text.toLowerCase();

  if (/sleep|rest|insomnia|night/.test(normalized)) {
    return {
      key: "sleep",
      question: "How much sleep did you get last night, and what would improve tonight by 10%?",
    };
  }

  if (/work|office|job|boss|deadline|study|exam/.test(normalized)) {
    return {
      key: "work",
      question: "Which single task feels most important in the next hour?",
    };
  }

  if (/family|friend|partner|relationship|people/.test(normalized)) {
    return {
      key: "social",
      question: "What is one conversation that would lower your stress if you handled it calmly?",
    };
  }

  if (/eat|food|meal|hungry|body|exercise|walk/.test(normalized)) {
    return {
      key: "body",
      question: "What body signal are you noticing first right now: breath, tension, or fatigue?",
    };
  }

  return { key: "general", question: null };
}

function hashSeed(seed: string): number {
  return [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function pickNoRepeatVariant(
  list: string[],
  prefix: string,
  recentKeys: string[],
  seed: string
): { text: string; key: string } {
  const options = list.map((text, index) => ({ text, key: `${prefix}-${index}` }));
  const filtered = options.filter((option) => !recentKeys.includes(option.key));
  const pool = filtered.length > 0 ? filtered : options;
  const selected = pool[hashSeed(seed) % pool.length];
  return selected;
}

function parseOutcomeScore(text: string): number | null {
  const normalized = text.toLowerCase();

  const slashMatch = normalized.match(/\b(10|[0-9])\s*\/\s*10\b/);
  if (slashMatch) {
    return Number(slashMatch[1]);
  }

  const numericMatch = normalized.match(/\b10\b|\b[0-9]\b/);
  if (!numericMatch) return null;

  const value = Number(numericMatch[0]);
  if (Number.isNaN(value)) return null;
  if (value < 0 || value > 10) return null;
  return value;
}

function buildOutcomeBranchReply(
  score: number,
  mood: MoodTone,
  lastActionLabel: string | null
): { text: string; pendingActionCheckIn: boolean } {
  const actionText = lastActionLabel ? `for trying ${lastActionLabel}` : "for trying that";

  if (score <= 3) {
    const lowScoreByMood: Record<MoodTone, string> = {
      positive: `Thanks ${actionText}. Since it only helped ${score}/10, try a body reset: 30 seconds of slow exhale and shoulder release. After that, what changed?`,
      low: `Thanks ${actionText}. ${score}/10 means we should simplify. Let's do one tiny win: drink water, stand up, and take 3 slower exhales.`,
      anxious: `Thanks ${actionText}. If it was ${score}/10, switch to a shorter reset: inhale 3, exhale 6 for 4 rounds. Tell me if your chest tension shifts.`,
      angry: `Thanks ${actionText}. ${score}/10 is still useful data. Try stepping away for 90 seconds and relaxing your jaw and hands first.`,
      neutral: `Thanks ${actionText}. ${score}/10 tells us to adjust. Let's pick a 1-minute action that feels easiest right now.`,
    };
    return { text: lowScoreByMood[mood], pendingActionCheckIn: true };
  }

  if (score <= 7) {
    return {
      text: `Nice work ${actionText}. A ${score}/10 response means it helped somewhat. Repeat it once more and add one practical step for today.`,
      pendingActionCheckIn: true,
    };
  }

  return {
    text: `Great signal. ${score}/10 means this strategy is effective for you. Save it as a go-to tool and use it early next time stress starts rising.`,
    pendingActionCheckIn: false,
  };
}

function pushRecentKey(existing: string[], next: string, max = 8) {
  const merged = [...existing.filter((key) => key !== next), next];
  return merged.slice(Math.max(0, merged.length - max));
}

function buildBotReply(
  userText: string,
  turnIndex: number,
  memory: CompanionSessionMemory
): { text: string; nextMemory: CompanionSessionMemory } {
  const mood = detectMoodTone(userText);
  const topic = detectTopic(userText);

  const outcomeScore = memory.pendingActionCheckIn ? parseOutcomeScore(userText) : null;
  if (outcomeScore !== null) {
    const outcome = buildOutcomeBranchReply(outcomeScore, mood, memory.lastActionLabel);
    return {
      text: outcome.text,
      nextMemory: {
        ...memory,
        lastMood: mood,
        lastTopic: topic.key,
        pendingActionCheckIn: outcome.pendingActionCheckIn,
        actionCheckIns: memory.actionCheckIns + 1,
      },
    };
  }

  const openers: Record<MoodTone, string[]> = {
    positive: [
      "I can feel that positive shift in what you wrote.",
      "That sounds like a meaningful bright spot.",
      "Love that update. You're noticing what helps.",
    ],
    low: [
      "Thank you for sharing that, especially when it feels heavy.",
      "That sounds difficult, and I'm glad you're not carrying it silently.",
      "I hear how draining this has been for you.",
    ],
    anxious: [
      "That sounds intense, and your reaction makes sense.",
      "I hear urgency in your words, and we can slow this down together.",
      "Thanks for naming it clearly. That already helps reduce chaos.",
    ],
    angry: [
      "That frustration sounds valid.",
      "I can hear the intensity in this moment.",
      "You are making sense. Let's channel this carefully.",
    ],
    neutral: [
      "Thanks for sharing this clearly.",
      "I hear you.",
      "That gives us a good place to work from.",
    ],
  };

  const actionByMood: Record<MoodTone, Array<{ label: string; text: string }>> = {
    positive: [
      {
        label: "a quick gratitude note",
        text: "Keep momentum with a 20-second gratitude note about what went right.",
      },
      {
        label: "a repeatable routine",
        text: "Pick one action from today to repeat at the same time tomorrow.",
      },
      {
        label: "a short walk",
        text: "Anchor this feeling with a 2-minute mindful walk or stretch.",
      },
    ],
    low: [
      {
        label: "four slow breaths",
        text: "Try four slow breaths with one hand on your chest.",
      },
      {
        label: "one tiny task",
        text: "Choose one tiny task under 2 minutes and complete only that.",
      },
      {
        label: "body grounding",
        text: "Press both feet into the floor for 30 seconds and relax your shoulders.",
      },
    ],
    anxious: [
      {
        label: "4-4-6 breathing",
        text: "Try inhale 4, hold 4, exhale 6 for 3 rounds.",
      },
      {
        label: "control mapping",
        text: "Write two columns: what I control now, what I release for now.",
      },
      {
        label: "muscle release",
        text: "Drop your shoulders, unclench jaw, and lengthen your exhale.",
      },
    ],
    angry: [
      {
        label: "a 90-second pause",
        text: "Pause for 90 seconds before responding to anyone.",
      },
      {
        label: "cooling breath",
        text: "Take one longer exhale than inhale for 6 rounds.",
      },
      {
        label: "response scripting",
        text: "Draft a one-sentence calm response before sending anything.",
      },
    ],
    neutral: [
      {
        label: "energy check",
        text: "Rate your energy from 1-10 and pick one action to raise it by 1 point.",
      },
      {
        label: "micro-break",
        text: "Take a 60-second micro-break and notice any shift in your body.",
      },
      {
        label: "task clarity",
        text: "Choose one clear next action for the next 15 minutes.",
      },
    ],
  };

  const followUps: Record<MoodTone, FollowUpQuestion[]> = {
    positive: [
      { id: "pos_repeat", text: "What made this better moment possible today?" },
      { id: "pos_scale", text: "How can you protect this mood later today?" },
      { id: "pos_share", text: "Who can reinforce this progress with you?" },
    ],
    low: [
      { id: "low_body", text: "Where do you feel this emotion most strongly in your body?" },
      { id: "low_support", text: "Who feels safest to contact if this gets heavier?" },
      { id: "low_step", text: "What is the smallest next step you can do now?" },
    ],
    anxious: [
      { id: "anx_control", text: "What is one thing you can control in the next hour?" },
      { id: "anx_peak", text: "When does this usually peak during the day?" },
      { id: "anx_anchor", text: "Which coping move has helped even a little before?" },
    ],
    angry: [
      { id: "ang_need", text: "What need is being ignored right now: respect, space, or clarity?" },
      { id: "ang_boundary", text: "What boundary would protect your energy today?" },
      { id: "ang_repair", text: "What calm outcome do you want from this situation?" },
    ],
    neutral: [
      { id: "neu_goal", text: "What outcome would make today feel 10% better?" },
      { id: "neu_block", text: "What is your main blocker right now?" },
      { id: "neu_next", text: "What can you finish in the next 15 minutes?" },
    ],
  };

  const openerPick = pickNoRepeatVariant(
    openers[mood],
    `${mood}-opener`,
    memory.recentSnippetKeys,
    `${userText}-${turnIndex}-opener`
  );

  const actionOptions = actionByMood[mood].map((entry) => entry.text);
  const actionPick = pickNoRepeatVariant(
    actionOptions,
    `${mood}-action`,
    memory.recentSnippetKeys,
    `${userText}-${turnIndex}-action`
  );
  const selectedAction = actionByMood[mood][Number(actionPick.key.split("-").at(-1))];

  const toneQuestions = followUps[mood];
  const unusedQuestions = toneQuestions.filter((question) => !memory.recentQuestionIds.includes(question.id));
  const questionPool = unusedQuestions.length > 0 ? unusedQuestions : toneQuestions;
  const question = questionPool[hashSeed(`${userText}-${turnIndex}-question`) % questionPool.length];
  const finalQuestion = topic.question ?? question.text;

  const text =
    turnIndex >= 5
      ? `${openerPick.text} ${actionPick.text}`
      : `${openerPick.text} ${actionPick.text} ${finalQuestion} If you try this, rate how much it helped from 0-10.`;

  const recentSnippetKeys = pushRecentKey(
    pushRecentKey(memory.recentSnippetKeys, openerPick.key),
    actionPick.key
  );

  const recentQuestionIds = topic.question
    ? memory.recentQuestionIds
    : pushRecentKey(memory.recentQuestionIds, question.id, 6);

  return {
    text,
    nextMemory: {
      ...memory,
      recentSnippetKeys,
      recentQuestionIds,
      lastMood: mood,
      lastTopic: topic.key,
      pendingActionCheckIn: turnIndex < 5,
      lastActionLabel: selectedAction?.label ?? null,
    },
  };
}

export function AIChatScreen() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm here to support you. Can you tell me what's been on your mind lately?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [progress, setProgress] = useState(33);
  const [showBadge, setShowBadge] = useState(false);
  const [companionMemory, setCompanionMemory] = useState<CompanionSessionMemory>(loadCompanionMemory);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveCompanionMemory(companionMemory);
  }, [companionMemory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    const currentMessageCount = messages.filter((m) => m.sender === "user").length;
    const newProgress = Math.min(33 + (currentMessageCount + 1) * 11, 99);
    setProgress(newProgress);

    setTimeout(() => {
      const reply = buildBotReply(userMessage.text, currentMessageCount, companionMemory);
      setCompanionMemory(reply.nextMemory);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: reply.text,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);

      const canCompleteFromTurns = currentMessageCount >= 6;
      const canCompleteFromCheckIns = reply.nextMemory.actionCheckIns >= 2 && currentMessageCount >= 4;

      if (canCompleteFromTurns || canCompleteFromCheckIns) {
        setTimeout(() => {
          setShowBadge(true);
          setTimeout(() => {
            navigate("/risk-result");
          }, 2000);
        }, 1000);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFBFC] to-[#E5E7EB] flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-md p-4"
      >
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#14B8A6] to-[#0F766E] rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-[#1F2937]">AI Companion</h2>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
                <span className="text-sm text-[#6B7280]">
                  {isTyping ? "Typing..." : "Online"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6B7280]">Assessment Progress</span>
              <span className="text-sm font-medium text-[#14B8A6]">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-md mx-auto space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex items-start gap-2 max-w-[80%] ${
                    message.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === "bot"
                        ? "bg-gradient-to-br from-[#14B8A6] to-[#0F766E]"
                        : "bg-gradient-to-br from-[#3B82F6] to-[#1E40AF]"
                    }`}
                  >
                    {message.sender === "bot" ? (
                      <Bot className="w-5 h-5 text-white" />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-md ${
                      message.sender === "bot"
                        ? "bg-white text-[#1F2937]"
                        : "bg-gradient-to-r from-[#3B82F6] to-[#1E40AF] text-white"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.text}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#14B8A6] to-[#0F766E] flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white shadow-md">
                <div className="flex gap-1">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    className="w-2 h-2 bg-[#14B8A6] rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-[#14B8A6] rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-[#14B8A6] rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <AnimatePresence>
        {showBadge && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="bg-white rounded-3xl p-8 text-center mx-4"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-[#FCD34D] to-[#F59E0B] rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
                <Award className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#1F2937] mb-2">
                Assessment Complete! 🎉
              </h3>
              <p className="text-[#6B7280]">
                You've earned the <span className="font-semibold text-[#F59E0B]">Openness Badge</span>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white border-t border-[#E5E7EB] p-4">
        <div className="max-w-md mx-auto flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 bg-[#F9FAFB] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] text-[#1F2937]"
            disabled={showBadge}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || showBadge}
            className="w-12 h-12 bg-gradient-to-r from-[#14B8A6] to-[#0F766E] rounded-2xl flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
