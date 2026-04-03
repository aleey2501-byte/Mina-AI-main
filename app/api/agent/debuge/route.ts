import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) return NextResponse.json({ error: "GROQ_API_KEY missing" }, { status: 500 });

    const { code, error, messages } = await req.json() as {
      code?: string; error?: string;
      messages?: Array<{ role: string; content: string }>;
    };

    const userContent = code
      ? `Debug this code:\n\`\`\`\n${code}\n\`\`\`\n${error ? `Error: ${error}` : "Find and fix all issues."}`
      : messages?.[messages.length - 1]?.content || "";

    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 4096,
        temperature: 0.2,
        messages: [
          { role: "system", content: "You are an expert debugger. Identify the exact bug and line number, explain WHY it fails, provide the corrected code, and explain what you changed." },
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