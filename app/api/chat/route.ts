import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions";
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const GROQ_MODEL   = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

// ── Providers ──────────────────────────────────────────────────────────

async function handleGroq(
  messages: Array<{ role: string; content: string }>,
  model: string
) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: 4096, temperature: 0.7 }),
  });
  if (!res.ok) throw new Error(`Groq error: ${await res.text()}`);
  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>;
    model: string;
    usage: unknown;
  };
  return {
    message: data.choices[0].message.content,
    model: `groq/${data.model}`,
    usage: data.usage,
  };
}

async function handleDeepSeek(
  messages: Array<{ role: string; content: string }>
) {
  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek error: ${await res.text()}`);
  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>;
    model: string;
    usage: unknown;
  };
  return {
    message: data.choices[0].message.content,
    model: "deepseek/deepseek-chat",
    usage: data.usage,
  };
}

async function handleGemini(
  messages: Array<{ role: string; content: string }>
) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const chat = geminiModel.startChat({ history });
  const result = await chat.sendMessage(messages[messages.length - 1].content);
  return {
    message: result.response.text(),
    model: "gemini/gemini-2.5-flash",
    usage: null,
  };
}

// ── Main Route ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { messages, model = GROQ_MODEL, provider } = await req.json() as {
      messages: Array<{ role: string; content: string }>;
      model?: string;
      provider?: "groq" | "deepseek" | "gemini" | "auto";
    };

    const hasGroq     = !!process.env.GROQ_API_KEY;
    const hasDeepSeek = !!process.env.DEEPSEEK_API_KEY;
    const hasGemini   = !!process.env.GEMINI_API_KEY;

    const useProvider =
      provider === "deepseek"      ? "deepseek"
      : provider === "gemini"      ? "gemini"
      : provider === "groq"        ? "groq"
      : model === "deepseek-chat"  ? "deepseek"
      : hasGroq                    ? "groq"
      : hasDeepSeek                ? "deepseek"
      : hasGemini                  ? "gemini"
      : null;

    if (!useProvider) {
      return NextResponse.json(
        { error: "No API key found. Add GROQ_API_KEY, DEEPSEEK_API_KEY, or GEMINI_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    let result;

    if (useProvider === "deepseek") {
      result = await handleDeepSeek(messages);
    } else if (useProvider === "gemini") {
      result = await handleGemini(messages);
    } else {
      // Groq with fallback chain
      try {
        result = await handleGroq(messages, model);
      } catch (groqErr) {
        if (hasDeepSeek) {
          console.warn("Groq failed, falling back to DeepSeek:", groqErr);
          result = await handleDeepSeek(messages);
        } else if (hasGemini) {
          console.warn("Groq failed, falling back to Gemini:", groqErr);
          result = await handleGemini(messages);
        } else {
          throw groqErr;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      model: result.model,
      usage: result.usage,
      provider: useProvider,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Chat route error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}