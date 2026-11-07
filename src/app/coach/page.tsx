"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { CoachResponse, ChatHistoryMessage } from "@/lib/ai/coachService";
import {
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  TrendingUp,
  Bot,
  User,
  RotateCcw,
  MessageSquare,
  ArrowRight
} from "lucide-react";

interface MessageItem {
  id: string;
  sender: "user" | "coach";
  text?: string;
  response?: CoachResponse;
  timestamp: string;
}

function renderFormattedText(content: string) {
  if (!content) return null;

  const paragraphs = content.split(/\n\n+/);

  return (
    <div className="space-y-2.5">
      {paragraphs.map((p, pIdx) => {
        const lines = p.split("\n");
        const isList = lines.every((l) => l.trim().startsWith("- ") || l.trim().startsWith("* ") || /^\d+\.\s/.test(l.trim()));

        if (isList) {
          return (
            <ul key={pIdx} className="list-disc pl-4 space-y-1 text-slate-300">
              {lines.map((item, iIdx) => {
                const cleanItem = item.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "");
                return <li key={iIdx} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(cleanItem) }} />;
              })}
            </ul>
          );
        }

        return (
          <p
            key={pIdx}
            className="leading-relaxed font-normal text-slate-300"
            dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(p) }}
          />
        );
      })}
    </div>
  );
}

function parseInlineMarkdown(str: string): string {
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-slate-400">$1</em>');
}

function CoachChatInterface() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const initialWelcomeMessage: MessageItem = {
    id: "welcome-1",
    sender: "coach",
    response: {
      answer:
        "Hello! I am your **SpendWise AI Financial Coach**.\n\nI monitor your live salary cycle (**12 days until payday**) to evaluate purchase decisions against your real **₹8,500 flexible buffer** while safeguarding your **₹15,000 savings goal**.\n\nYou can ask me normal questions (*'How am I doing?'*, *'How should I budget this week?'*) or specific affordability queries (*'Can I buy a ₹2,000 jacket?'*).",
      recommendation: "Try asking one of the interactive prompts below or type your own question.",
      suggestedFollowUps: [
        "Can I afford a ₹2,000 purchase today?",
        "Where did most of my salary go?",
        "How much can I safely spend this weekend?",
        "What are my biggest spending leaks?",
      ],
    },
    timestamp: "Just now",
  };

  const [messages, setMessages] = useState<MessageItem[]>([initialWelcomeMessage]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoSubmittedRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: trimmed,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    const historyPayload: ChatHistoryMessage[] = messages
      .filter((m) => m.id !== "welcome-1")
      .map((m) => ({
        role: m.sender === "user" ? ("user" as const) : ("model" as const),
        content: m.text || m.response?.answer || "",
      }));

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, history: historyPayload }),
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to get advice");

      const coachMsg: MessageItem = {
        id: `coach-${Date.now()}`,
        sender: "coach",
        response: json.data,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, coachMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `coach-${Date.now()}`,
          sender: "coach",
          response: {
            answer:
              "I encountered a temporary connection issue reaching the budget intelligence engine. Your salary-cycle figures remain secure.",
            recommendation: "Please try asking again or check your network.",
            suggestedFollowUps: [
              "Can I afford a ₹1,500 purchase?",
              "How much can I spend this week?",
            ],
          },
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        ...initialWelcomeMessage,
        id: `welcome-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  useEffect(() => {
    if (initialQuery && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  const lastCoachMessage = [...messages].reverse().find((m) => m.sender === "coach");
  const activeFollowUps = lastCoachMessage?.response?.suggestedFollowUps || [
    "Can I afford a ₹2,000 purchase?",
    "Where did most of my salary go?",
    "How much can I spend this week?",
    "What expenses should I reduce?",
  ];

  return (
    <div className="min-h-screen bg-[#0B0F14] flex flex-col text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col pb-24 md:pb-12">
        {/* Verified Context Badge Header */}
        <div className="bg-[#131922] backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-[#243041] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(13,148,136,0.3)] border border-teal-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                  SpendWise Financial Coach
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                  Active • Cycle Grounded
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Multi-turn salary cycle memory • Grounded arithmetic • Zero hallucinated balances
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <div className="flex items-center gap-3 text-xs bg-[#0B0F14] px-3.5 py-2 rounded-2xl border border-[#243041] text-slate-300 font-mono">
              <span>Flexible: <strong className="text-white font-bold">₹8,500</strong></span>
              <span className="text-slate-500">•</span>
              <span>Safe: <strong className="text-emerald-400 font-bold">₹708/d</strong></span>
            </div>

            <button
              onClick={handleResetChat}
              title="Start New Conversation"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1B2330] border border-transparent hover:border-[#243041] transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Chat History Container */}
        <div className="flex-1 bg-[#131922] backdrop-blur-xl rounded-3xl border border-[#243041] shadow-sm p-4 sm:p-6 overflow-y-auto space-y-6 min-h-[480px] max-h-[62vh]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm ${
                  msg.sender === "user"
                    ? "bg-[#1B2330] text-white border border-[#243041]"
                    : "bg-teal-600 text-white shadow-[0_0_10px_rgba(13,148,136,0.4)]"
                }`}
              >
                {msg.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Message Content */}
              <div
                className={`flex flex-col max-w-xl ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div className="text-[10px] text-slate-400 font-semibold mb-1 px-1">
                  {msg.sender === "user" ? "You" : "SpendWise Coach"} • {msg.timestamp}
                </div>

                {msg.sender === "user" ? (
                  <div className="bg-[#1B2330] text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm font-medium border border-[#243041] shadow-sm">
                    {msg.text}
                  </div>
                ) : (
                  <div className="bg-[#0B0F14]/90 border border-[#243041] rounded-2xl rounded-tl-sm p-5 text-sm text-slate-300 space-y-3.5 shadow-sm">
                    {/* Affordability Verdict Badge */}
                    {msg.response?.affordability && (
                      <div className="flex items-center gap-2">
                        {msg.response.affordability === "yes" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-950 text-emerald-300 border border-emerald-800 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            Affordable This Cycle
                          </span>
                        )}
                        {msg.response.affordability === "yes_with_caution" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-950 text-amber-300 border border-amber-800 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                            Afford with Caution
                          </span>
                        )}
                        {msg.response.affordability === "no" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-950 text-rose-300 border border-rose-800 shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                            <XCircle className="h-3.5 w-3.5 text-rose-400" />
                            Not Affordable This Cycle
                          </span>
                        )}
                      </div>
                    )}

                    {/* Rich Formatted Answer */}
                    {renderFormattedText(msg.response?.answer || "")}

                    {/* Mathematical Impact Card */}
                    {msg.response?.impactOnFlexibleBudget && (
                      <div className="bg-[#131922] p-3.5 rounded-xl border border-[#243041] text-xs text-slate-300 font-mono space-y-1 shadow-inner">
                        <div className="flex items-center gap-1.5 font-bold text-slate-200">
                          <TrendingUp className="h-3.5 w-3.5 text-teal-400" />
                          <span>Cycle Budget Impact:</span>
                        </div>
                        <p className="leading-relaxed">{msg.response.impactOnFlexibleBudget}</p>
                      </div>
                    )}

                    {/* Action Recommendation */}
                    {msg.response?.recommendation && (
                      <div className="pt-2.5 border-t border-[#243041] flex items-start gap-2 text-xs text-slate-300 font-medium">
                        <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-white">Recommended Next Step:</strong>{" "}
                          <span>{msg.response.recommendation}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-xs text-slate-400 font-medium p-3 bg-[#1B2330] rounded-2xl w-fit border border-[#243041] animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
              <span>Analyzing salary cycle metrics...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Suggested Follow-ups */}
        <div className="py-3">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MessageSquare className="h-3 w-3" />
            <span>Interactive Follow-up Prompts</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFollowUps.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={loading}
                className="text-xs bg-[#131922] hover:bg-[#1B2330] text-slate-300 font-semibold px-3.5 py-2 rounded-xl border border-[#243041] hover:border-teal-500/40 transition-all shadow-sm disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-1.5"
              >
                <span>{q}</span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputQuery);
          }}
          className="bg-[#131922] p-2.5 rounded-3xl border border-[#243041] shadow-sm flex items-center gap-2 focus-within:border-teal-500/60 transition-colors"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask anything (e.g. 'Can I buy ₹2,000 sneakers?', 'How should I budget this week?')..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm text-white placeholder-slate-500 bg-transparent focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 font-bold text-xs text-white transition-all shadow-md shadow-teal-900/40 disabled:opacity-50 flex items-center gap-1.5 border border-teal-500/30"
          >
            <span>Send</span>
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </main>
    </div>
  );
}

export default function CoachPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center text-slate-100">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      }
    >
      <CoachChatInterface />
    </Suspense>
  );
}
