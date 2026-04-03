import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const { text, metadata } = await req.json();

  // Split text into chunks
  const chunks = text.match(/.{1,500}/g) || [];

  for (const chunk of chunks) {
    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunk,
    });

    const embedding = embeddingRes.data[0].embedding;

    await supabase.from("documents").insert({
      content: chunk,
      metadata,
      embedding,
    });
  }

  return NextResponse.json({ success: true, chunks: chunks.length });
}