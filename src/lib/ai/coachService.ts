import OpenAI from "openai";
import { CoachFinancialContext, constructCoachSystemPrompt } from "./contextBuilder";
import { formatINR } from "@/lib/utils";

export interface ChatHistoryMessage {
  role: "user" | "model";
  content: string;
}

export interface CoachResponse {
  answer: string;
  affordability?: "yes" | "yes_with_caution" | "no" | null;
  impactOnFlexibleBudget?: string | null;
  recommendation: string;
  suggestedFollowUps?: string[];
}

export async function askAiCoach(
  question: string,
  context: CoachFinancialContext,
  history: ChatHistoryMessage[] = []
): Promise<CoachResponse> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  // 1. Try Google Gemini API if GEMINI_API_KEY is configured
  if (geminiKey && geminiKey.length > 20 && !geminiKey.includes("demo")) {
    try {
      const response = await callGeminiCoach(question, context, geminiKey, history);
      if (response) {
        return response;
      }
    } catch (err) {
      console.warn("Gemini API call failed, attempting fallback:", err);
    }
  }

  // 2. Try OpenAI API if real OpenAI key is available
  if (openAiKey && openAiKey.startsWith("sk-") && openAiKey.length > 20 && !openAiKey.includes("demo")) {
    try {
      const openai = new OpenAI({ apiKey: openAiKey });
      const systemPrompt = constructCoachSystemPrompt(context);

      const openAiMessages = [
        { role: "system" as const, content: systemPrompt },
        ...history.slice(-6).map((h) => ({
          role: h.role === "user" ? ("user" as const) : ("assistant" as const),
          content: h.content,
        })),
        { role: "user" as const, content: question },
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: openAiMessages,
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (responseText) {
        const parsed = JSON.parse(responseText) as CoachResponse;
        if (parsed.answer) {
          return {
            answer: parsed.answer,
            affordability: parsed.affordability || null,
            impactOnFlexibleBudget: parsed.impactOnFlexibleBudget || null,
            recommendation: parsed.recommendation || "Review your transaction log to keep daily spend within your target.",
            suggestedFollowUps: parsed.suggestedFollowUps || [],
          };
        }
      }
    } catch (err) {
      console.warn("OpenAI API call failed, falling back to deterministic coach:", err);
    }
  }

  // 3. Fallback Coach
  return generateDeterministicCoachResponse(question, context);
}

/**
 * Direct native fetch call to Google Gemini REST API.
 * Uses high-performance flash models with multi-turn conversation history.
 */
async function callGeminiCoach(
  question: string,
  context: CoachFinancialContext,
  apiKey: string,
  history: ChatHistoryMessage[] = []
): Promise<CoachResponse | null> {
  const systemPrompt = constructCoachSystemPrompt(context);
  const modelsToTry = [
    "gemini-flash-lite-latest",
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-flash-latest"
  ];

  // Map history to Gemini content structure (limit to last 8 turns for latency)
  const conversationContents = [
    ...history.slice(-8).map((h) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.content }],
    })),
    {
      role: "user",
      parts: [{ text: question }],
    },
  ];

  for (const model of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: conversationContents,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(6000),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        continue;
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText) as CoachResponse;
        if (parsed.answer) {
          return {
            answer: parsed.answer,
            affordability: parsed.affordability || null,
            impactOnFlexibleBudget: parsed.impactOnFlexibleBudget || null,
            recommendation: parsed.recommendation || "Track today's expenses to maintain your daily pace.",
            suggestedFollowUps: parsed.suggestedFollowUps || [
              "Can I afford a ₹1,500 purchase?",
              "How much can I spend this weekend?",
              "What spending leaks do I have?",
            ],
          };
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

function generateDeterministicCoachResponse(
  question: string,
  ctx: CoachFinancialContext
): CoachResponse {
  const q = question.toLowerCase().trim();

  // Pattern 0: Greetings & Normal Conversational Openers
  if (
    q === "hi" ||
    q === "hello" ||
    q === "hey" ||
    q === "who are you" ||
    q.includes("how are you") ||
    q.includes("what can you do")
  ) {
    return {
      answer: `Hello! I'm your SpendWise AI Coach. Right now, your salary cycle has **${ctx.daysUntilPayday} days left** until payday. You have **${formatINR(ctx.flexibleMoney)} in flexible money**, giving you a safe daily allowance of **${formatINR(ctx.safeDailySpend)}/day** while keeping your **${formatINR(ctx.savingsGoal)} savings goal** fully protected. How can I help you today?`,
      affordability: null,
      impactOnFlexibleBudget: null,
      recommendation: "Ask me whether you can afford an upcoming purchase or where your money has gone so far.",
      suggestedFollowUps: [
        "Can I afford a ₹2,000 dinner tonight?",
        "Where did most of my salary go?",
        "How much can I spend this week?",
      ],
    };
  }

  // Pattern 1: Affordability question (e.g. "Can I afford a ₹2,000 purchase?")
  const amountMatch = q.match(/(?:rs\.?|₹|\b)(\d[\d,]*)(?:\b|\s*purchase|\s*dinner|\s*shoes)?/i);
  const matchedAmount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, ""), 10) : null;

  if (matchedAmount && (q.includes("afford") || q.includes("buy") || q.includes("purchase") || q.includes("spend"))) {
    const amount = matchedAmount;
    const remainingAfter = ctx.flexibleMoney - amount;
    const days = Math.max(1, ctx.daysUntilPayday);
    const newDailySpend = remainingAfter > 0 ? Math.floor(remainingAfter / days) : 0;
    const percentOfFlexible = ctx.flexibleMoney > 0 ? Math.round((amount / ctx.flexibleMoney) * 100) : 100;

    if (amount > ctx.flexibleMoney) {
      return {
        affordability: "no",
        answer: `No, this purchase of **${formatINR(amount)}** exceeds your remaining flexible buffer of **${formatINR(ctx.flexibleMoney)}**. Making this purchase would trigger a budget deficit and cut into your ${formatINR(ctx.savingsGoal)} monthly savings goal.`,
        impactOnFlexibleBudget: `Would cause a ${formatINR(Math.abs(remainingAfter))} deficit and drop safe daily spend to ₹0/day for the remaining ${days} days.`,
        recommendation: "Postpone this purchase until your next salary arrives or reduce discretionary spending in other areas.",
        suggestedFollowUps: [
          `What if I spend ${formatINR(Math.round(ctx.flexibleMoney * 0.2))} instead?`,
          "How can I cut expenses to afford this?",
          "Where did most of my money go?",
        ],
      };
    } else if (percentOfFlexible > 20) {
      return {
        affordability: "yes_with_caution",
        answer: `You can afford this, but with caution. A **${formatINR(amount)}** purchase uses **${percentOfFlexible}%** of your remaining **${formatINR(ctx.flexibleMoney)}** flexible pool.`,
        impactOnFlexibleBudget: `With ${days} days until payday, your safe daily spend drops from ${formatINR(ctx.safeDailySpend)} to ${formatINR(newDailySpend)}/day.`,
        recommendation: `Keep non-essential spending below ${formatINR(newDailySpend * 3)} over the next 3 days to balance your burn rate.`,
        suggestedFollowUps: [
          `What if it's ${formatINR(Math.round(amount * 0.7))} instead?`,
          "How much can I safely spend this weekend?",
          "Show my active spending leaks",
        ],
      };
    } else {
      return {
        affordability: "yes",
        answer: `Yes! You can comfortably afford this **${formatINR(amount)}** purchase. It represents only **${percentOfFlexible}%** of your remaining **${formatINR(ctx.flexibleMoney)}** flexible buffer.`,
        impactOnFlexibleBudget: `Leaves ${formatINR(remainingAfter)} flexible money, keeping your safe daily allowance at a healthy ${formatINR(newDailySpend)}/day.`,
        recommendation: "Log this expense right after purchasing to keep your daily tracker accurate.",
        suggestedFollowUps: [
          "How much can I spend this week?",
          "Am I on track to meet my savings goal?",
          "Where did most of my salary go?",
        ],
      };
    }
  }

  // Pattern 2: Where did most of my salary go?
  if (q.includes("where") && (q.includes("salary") || q.includes("spent") || q.includes("money"))) {
    const topCatList = ctx.topCategories.slice(0, 3).map((c) => `**${c.category}** (${formatINR(c.amount)})`).join(", ");
    return {
      answer: `Out of **${formatINR(ctx.totalSpentThisCycle)}** spent so far this cycle, your largest spending drivers were: ${topCatList}. Fixed rent and frequent dining/delivery accounted for the majority of outflows.`,
      affordability: null,
      impactOnFlexibleBudget: null,
      recommendation: "Focus on curbing food delivery orders to preserve your remaining flexible buffer until payday.",
      suggestedFollowUps: [
        "How can I fix the food delivery leak?",
        "Can I afford a ₹1,500 dinner tonight?",
        "How much can I spend this week?",
      ],
    };
  }

  // Pattern 3: How much can I spend this week?
  if (q.includes("week") || q.includes("weekend")) {
    const weeklySafe = ctx.safeDailySpend * Math.min(7, ctx.daysUntilPayday);
    return {
      answer: `Based on your daily limit of **${formatINR(ctx.safeDailySpend)}/day**, your safe spending limit for the next 7 days is **${formatINR(weeklySafe)}**.`,
      affordability: null,
      impactOnFlexibleBudget: `Consumes ${formatINR(weeklySafe)} of your ${formatINR(ctx.flexibleMoney)} remaining flexible buffer.`,
      recommendation: `Plan your weekend dining and outings to stay within this ₹${weeklySafe} ceiling.`,
      suggestedFollowUps: [
        "Can I afford a ₹2,000 purchase?",
        "What expenses should I reduce?",
        "How am I doing overall?",
      ],
    };
  }

  // Pattern 4: What expenses should I reduce / How to save?
  if (q.includes("reduce") || q.includes("cut") || q.includes("save") || q.includes("leak")) {
    return {
      answer: `Based on your spending patterns, you have two key optimization areas: **Food Delivery** (${formatINR(ctx.topCategories.find((c) => c.category === "Food")?.amount || 6051)} spent) and **Digital Subscriptions** (${formatINR(2398)}).`,
      affordability: null,
      impactOnFlexibleBudget: "Cutting food delivery orders in half would restore over ₹1,800 to your flexible reserve.",
      recommendation: "Pause at least one streaming service and prepare home-cooked dinners for 3 nights this week.",
      suggestedFollowUps: [
        "How much does that increase my daily safe spend?",
        "Can I afford a ₹2,500 purchase after that?",
        "Where did the rest of my money go?",
      ],
    };
  }

  // Default response
  return {
    answer: `With **${ctx.daysUntilPayday} days** until payday, your remaining flexible money is **${formatINR(ctx.flexibleMoney)}**, allowing a safe spending pace of **${formatINR(ctx.safeDailySpend)}/day**. Your **${formatINR(ctx.savingsGoal)}** savings goal is currently fully protected.`,
    affordability: null,
    impactOnFlexibleBudget: null,
    recommendation: `Stick to ${formatINR(ctx.safeDailySpend)} today to maintain a healthy budget pace.`,
    suggestedFollowUps: [
      "Can I afford a ₹1,500 purchase?",
      "Where did most of my salary go?",
      "How much can I spend this week?",
    ],
  };
}
