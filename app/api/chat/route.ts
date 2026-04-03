import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

// ── GROQ HANDLER ──────────────────────────────────────────────────────
async function handleGroq(messages: Array<{ role: string; content: string }>, model: string) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error: ${err}`);
  }

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

// ── GEMINI HANDLER (fallback) ─────────────────────────────────────────
async function handleGemini(messages: Array<{ role: string; content: string }>) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const chat = geminiModel.startChat({ history });
  const lastMessage = messages[messages.length - 1].content;
  const result = await chat.sendMessage(lastMessage);

  return {
    message: result.response.text(),
    model: "gemini-2.5-flash",
    usage: null,
  };
}

// ── MAIN ROUTE ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { messages, model = GROQ_MODEL, provider } = await req.json() as {
      messages: Array<{ role: string; content: string }>;
      model?: string;
      provider?: "groq" | "gemini" | "auto";
    };

    const hasGroq = !!process.env.GROQ_API_KEY;
    const hasGemini = !!process.env.GEMINI_API_KEY;

    // Determine which provider to use
    const useProvider = provider === "gemini" ? "gemini"
      : provider === "groq" ? "groq"
      : hasGroq ? "groq"      // auto: prefer Groq
      : hasGemini ? "gemini"  // fallback to Gemini
      : null;

    if (!useProvider) {
      return NextResponse.json(
        { error: "No API key found. Add GROQ_API_KEY or GEMINI_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    let result;

    if (useProvider === "groq") {
      try {
        result = await handleGroq(messages, model);
      } catch (groqErr) {
        // If Groq fails and Gemini is available, fall back
        if (hasGemini) {
          console.warn("Groq failed, falling back to Gemini:", groqErr);
          result = await handleGemini(messages);
          result.model = `gemini-fallback (groq failed)`;
        } else {
          throw groqErr;
        }
      }
    } else {
      result = await handleGemini(messages);
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