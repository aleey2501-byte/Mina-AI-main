import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// ── Clients ────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_KEY = process.env.GROQ_API_KEY!;
const GROQ_FAST_MODEL  = "llama-3.1-8b-instant";        // fast — used for classification
const GROQ_SMART_MODEL = "llama-3.3-70b-versatile";     // smart — used for answers

// ── Types ──────────────────────────────────────────────────────────────
type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

type Intent =
  | "web_search"
  | "image_gen"
  | "code"
  | "rag"
  | "vision"
  | "chat";

interface ToolCall {
  tool: string;
  args: Record<string, string>;
  result: string;
}

// ── Helper: call Groq ──────────────────────────────────────────────────
async function groq(
  messages: ChatMessage[],
  model = GROQ_SMART_MODEL,
  maxTokens = 2048
): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.7 }),
  });
  if (!res.ok) throw new Error(`Groq error: ${await res.text()}`);
  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0].message.content;
}

// ── Helper: call Gemini ────────────────────────────────────────────────
async function gemini(messages: ChatMessage[]): Promise<string> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const chat = model.startChat({ history });
  const result = await chat.sendMessage(messages[messages.length - 1].content);
  return result.response.text();
}

// ── Step 1: Intent Classifier ──────────────────────────────────────────
// Uses the fast 8B model — cheap and near-instant
async function classifyIntent(userMessage: string): Promise<Intent> {
  try {
    const raw = await groq(
      [
        {
          role: "system",
          content: `You are an intent classifier. Given a user message, return ONLY a JSON object like:
{"intent":"chat"}

Intents:
- "web_search"  → user wants current info, news, facts, prices, weather, recent events
- "image_gen"   → user wants to generate, draw, create, or illustrate an image
- "code"        → user wants code written, debugged, explained, or reviewed
- "rag"         → user references "my documents", "the file", "what I uploaded", or asks about stored knowledge
- "vision"      → user uploads an image and asks about it
- "chat"        → everything else: general questions, advice, writing, math, explanations

Return ONLY the JSON. No other text.`,
        },
        { role: "user", content: userMessage },
      ],
      GROQ_FAST_MODEL,
      20
    );

    const cleaned = raw.trim().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as { intent: Intent };
    return parsed.intent ?? "chat";
  } catch {
    return "chat"; // safe fallback
  }
}

// ── Step 2: Web Search via Tavily ──────────────────────────────────────
async function runWebSearch(query: string): Promise<{ result: string; tool: ToolCall }> {
  const { tavily } = await import("@tavily/core");
  const client = tavily({ apiKey: process.env.TAVILY_API_KEY! });

  const response = await client.search(query, {
    maxResults: 5,
    searchDepth: "basic",
  });

  const snippets = response.results
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.content}\nSource: ${r.url}`)
    .join("\n\n");

  return {
    result: snippets,
    tool: { tool: "web_search", args: { query }, result: snippets.slice(0, 300) + "..." },
  };
}

// ── Step 3: RAG — semantic search over Supabase documents ─────────────
async function runRAG(query: string): Promise<{ result: string; tool: ToolCall }> {
  // Embed the query using OpenAI (you already have this set up)
  const embeddingRes = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });
  const embedding = embeddingRes.data[0].embedding;

  // Match against your documents table in Supabase
  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: 5,
  });

  if (error || !data?.length) {
    return {
      result: "No relevant documents found in your knowledge base.",
      tool: { tool: "rag_search", args: { query }, result: "No matches found" },
    };
  }

  const docs = (data as Array<{ content: string; metadata?: Record<string, string> }>)
    .map((d, i) => `[Doc ${i + 1}] ${d.content}`)
    .join("\n\n");

  return {
    result: docs,
    tool: { tool: "rag_search", args: { query }, result: docs.slice(0, 300) + "..." },
  };
}

// ── Step 4: Image Generation ───────────────────────────────────────────
// Delegates to your existing /api/generate-image route
async function runImageGen(
  prompt: string,
  baseUrl: string
): Promise<{ imageData: string; mimeType: string } | null> {
  try {
    const res = await fetch(`${baseUrl}/api/generate-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json() as { success: boolean; image?: string; mimeType?: string };
    if (data.success && data.image) {
      return { imageData: data.image, mimeType: data.mimeType ?? "image/png" };
    }
    return null;
  } catch {
    return null;
  }
}

// ── Step 5: Code Agent — uses a code-optimised Groq model ─────────────
async function runCodeAgent(
  messages: ChatMessage[]
): Promise<string> {
  const systemPrompt: ChatMessage = {
    role: "system",
    content: `You are an expert software engineer. When writing code:
- Always specify the language in code blocks
- Explain what the code does briefly before showing it
- Point out potential issues or improvements
- If debugging, identify the root cause first`,
  };
  return groq([systemPrompt, ...messages], GROQ_SMART_MODEL, 4096);
}

// ── Master answer builder ──────────────────────────────────────────────
// Takes context gathered by tools and builds the final response
async function buildAnswer(
  messages: ChatMessage[],
  context: string,
  provider: string
): Promise<string> {
  const systemMsg: ChatMessage = {
    role: "system",
    content: `You are MinaAI, a helpful and intelligent assistant.
${context ? `\nUse the following context to answer the user:\n\n${context}` : ""}
Be concise, accurate, and friendly. Format responses with markdown where helpful.`,
  };

  const augmentedMessages: ChatMessage[] = [systemMsg, ...messages];

  if (provider === "gemini" && process.env.GEMINI_API_KEY) {
    return gemini(augmentedMessages);
  }

  // Default: Groq
  return groq(augmentedMessages, GROQ_SMART_MODEL);
}

// ── MAIN ROUTE ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { messages, model, provider = "groq" } = await req.json() as {
      messages: ChatMessage[];
      model?: string;
      provider?: string;
    };

    if (!messages?.length) {
      return NextResponse.json({ success: false, error: "No messages provided" }, { status: 400 });
    }

    const userMessage = messages[messages.length - 1].content;

    // ── 1. Classify intent ──────────────────────────────────────────
    const intent = await classifyIntent(userMessage);
    console.log(`[Agent] Intent: ${intent} | Message: "${userMessage.slice(0, 60)}..."`);

    const toolCalls: ToolCall[] = [];
    let context = "";
    let imageResult: { data: string; mimeType: string } | null = null;

    // ── 2. Run the right tool ───────────────────────────────────────
    if (intent === "image_gen") {
      const baseUrl = req.nextUrl.origin;
      const img = await runImageGen(userMessage, baseUrl);
      if (img) {
        imageResult = { data: img.imageData, mimeType: img.mimeType };
        toolCalls.push({
          tool: "generate_image",
          args: { prompt: userMessage },
          result: "Image generated successfully",
        });
        return NextResponse.json({
          success: true,
          message: `Here's the image I generated for: *${userMessage}*`,
          model: "image-generator",
          provider: "gemini",
          toolCalls,
          image: imageResult,
        });
      }
      // fallback to chat if image gen fails
    }

    if (intent === "web_search" && process.env.TAVILY_API_KEY) {
      try {
        const { result, tool } = await runWebSearch(userMessage);
        context = `Web search results:\n${result}`;
        toolCalls.push(tool);
      } catch (e) {
        console.warn("[Agent] Web search failed:", e);
      }
    }

    if (intent === "rag" && process.env.OPENAI_API_KEY) {
      try {
        const { result, tool } = await runRAG(userMessage);
        context = `Knowledge base results:\n${result}`;
        toolCalls.push(tool);
      } catch (e) {
        console.warn("[Agent] RAG failed:", e);
      }
    }

    // ── 3. Build the final answer ───────────────────────────────────
    let finalMessage: string;

    if (intent === "code") {
      toolCalls.push({
        tool: "code_agent",
        args: { task: userMessage.slice(0, 100) },
        result: "Code analysis complete",
      });
      finalMessage = await runCodeAgent(messages);
    } else {
      finalMessage = await buildAnswer(messages, context, provider);
    }

    return NextResponse.json({
      success: true,
      message: finalMessage,
      model: model ?? GROQ_SMART_MODEL,
      provider,
      toolCalls: toolCalls.length ? toolCalls : undefined,
      image: imageResult,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[Agent] Error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}