import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) return NextResponse.json({ error: "GROQ_API_KEY missing" }, { status: 500 });

    const { goal, messages } = await req.json() as {
      goal?: string;
      messages?: Array<{ role: string; content: string }>;
    };

    const userContent = goal || messages?.[messages.length - 1]?.content || "";

    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 4096,
        temperature: 0.5,
        messages: [
          { role: "system", content: "You are a strategic planning expert. Break down goals into numbered steps with time estimates, resources needed, potential blockers, and success metrics. Be practical and specific." },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!res.ok) throw new Error(`Groq error: ${res.status}`);
    const data = await res.json() as { choices: Array<{ message: { content: string } }>; model: string };
    return NextResponse.json({ success: true, message: data.choices[0].message.content, model: `groq/${data.model}` });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}