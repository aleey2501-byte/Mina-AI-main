"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface ToolCall {
  tool: string;
  args: Record<string, string>;
  result: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
  time: string;
  type?: "text" | "image";
  toolCalls?: ToolCall[];
  image?: { data: string; mimeType: string } | null;
  provider?: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

// ── Groq models (free) ────────────────────────────────────────────────
const MODELS = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B",  desc: "🧠 Best & smartest",  provider: "groq" },
  { id: "llama-3.1-8b-instant",    label: "Llama 3.1 8B",   desc: "⚡ Fastest",           provider: "groq" },
  { id: "mixtral-8x7b-32768",      label: "Mixtral 8x7B",   desc: "📚 Long context",      provider: "groq" },
  { id: "gemma2-9b-it",            label: "Gemma 2 9B",     desc: "🔬 Great reasoning",   provider: "groq" },
  { id: "gemini-2.5-flash",        label: "Gemini 2.5 Flash",desc: "✨ Google AI",         provider: "gemini" },
];

const TOOL_ICONS: Record<string, string> = {
  web_search:           "🔍",
  generate_image:       "🖼️",
  deep_reasoning:       "🧠",
  code_agent:           "💻",
  debug_agent:          "🐛",
  planner_agent:        "📋",
  reviewer_agent:       "📝",
  summarize_and_analyze:"📊",
  chat:                 "💬",
};

const CHIPS = [
  "Search: latest AI news today",
  "Write a Python web scraper",
  "Debug: find issues in my code",
  "Plan: how to build a startup",
  "Draw a futuristic city at night",
  "Analyze pros and cons of React vs Vue",
];

const uid = () => Math.random().toString(36).slice(2, 9);
const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// ── Components ────────────────────────────────────────────────────────

function Dots() {
  return (
    <div style={{ display: "flex", gap: 5, padding: "12px 16px", alignItems: "center" }}>
      {["#6366f1", "#8b5cf6", "#a78bfa"].map((c, i) => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: "50%", background: c, display: "inline-block",
          animation: `bounce 1.1s ${i * 0.18}s infinite`,
        }} />
      ))}
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2000); }}
      style={{ background: "none", border: "1px solid #2a2a3a", borderRadius: 6, color: "#6b7280", padding: "2px 10px", fontSize: 11, cursor: "pointer" }}
    >{done ? "✓ Copied" : "Copy"}</button>
  );
}

function ToolBadges({ toolCalls }: { toolCalls: ToolCall[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  if (!toolCalls?.length) return null;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 5 }}>Agents used:</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {toolCalls.map((tc, i) => (
          <div key={i}>
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer", background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.3)", color: "#818cf8" }}
            >
              {TOOL_ICONS[tc.tool] ?? "🔧"} {tc.tool.replace(/_/g, " ")}
            </button>
            {expanded === i && (
              <div style={{ marginTop: 4, padding: "8px 12px", background: "#0f0f1a", border: "1px solid #2a2a3a", borderRadius: 8, fontSize: 11, color: "#6b7280", maxWidth: 380 }}>
                {tc.result.slice(0, 280)}{tc.result.length > 280 ? "…" : ""}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MsgText({ text }: { text: string }) {
  const lines = text.split("\n");
  const html: React.ReactNode[] = [];
  let codeLines: string[] = [];
  let inCode = false;

  lines.forEach((line, i) => {
    if (line.startsWith("```")) {
      if (!inCode) { inCode = true; codeLines = []; }
      else {
        inCode = false;
        html.push(
          <pre key={i} style={{ background: "#0f0f1a", border: "1px solid #2a2a3a", borderRadius: 10, padding: "14px 16px", overflowX: "auto", margin: "10px 0" }}>
            <code style={{ fontFamily: "monospace", fontSize: 13, color: "#a5b4fc", lineHeight: 1.7 }}>{codeLines.join("\n")}</code>
          </pre>
        );
        codeLines = [];
      }
    } else if (inCode) {
      codeLines.push(line);
    } else if (line.startsWith("### ")) {
      html.push(<h3 key={i} style={{ fontSize: 15, fontWeight: 700, color: "#f9fafb", margin: "12px 0 4px" }}>{line.slice(4)}</h3>);
    } else if (line.startsWith("## ")) {
      html.push(<h2 key={i} style={{ fontSize: 17, fontWeight: 700, color: "#f9fafb", margin: "14px 0 5px" }}>{line.slice(3)}</h2>);
    } else if (line.startsWith("# ")) {
      html.push(<h1 key={i} style={{ fontSize: 20, fontWeight: 700, color: "#f9fafb", margin: "16px 0 6px" }}>{line.slice(2)}</h1>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      html.push(<div key={i} style={{ color: "#d1d5db", margin: "3px 0", paddingLeft: 16, display: "flex", gap: 8 }}><span style={{ color: "#6366f1" }}>•</span>{line.slice(2)}</div>);
    } else if (/^\d+\. /.test(line)) {
      html.push(<div key={i} style={{ color: "#d1d5db", margin: "3px 0", paddingLeft: 16 }}>{line}</div>);
    } else if (line.startsWith("> ")) {
      html.push(<div key={i} style={{ borderLeft: "3px solid #6366f1", paddingLeft: 12, margin: "6px 0", color: "#9ca3af", fontStyle: "italic" }}>{line.slice(2)}</div>);
    } else if (line === "") {
      html.push(<div key={i} style={{ height: 8 }} />);
    } else {
      const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
      html.push(
        <div key={i} style={{ color: "#d1d5db", lineHeight: 1.75, margin: "2px 0" }}>
          {parts.map((p, j) =>
            p.startsWith("`") && p.endsWith("`")
              ? <code key={j} style={{ background: "rgba(99,102,241,.2)", borderRadius: 4, padding: "1px 6px", fontFamily: "monospace", fontSize: 12, color: "#a5b4fc" }}>{p.slice(1, -1)}</code>
              : p.startsWith("**") && p.endsWith("**")
              ? <strong key={j} style={{ fontWeight: 700, color: "#f9fafb" }}>{p.slice(2, -2)}</strong>
              : p
          )}
        </div>
      );
    }
  });
  return <div>{html}</div>;
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function Page() {
  const [chats, setChats]           = useState<Chat[]>([]);
  const [activeId, setActiveId]     = useState<string | null>(null);
  const [draft, setDraft]           = useState("");
  const [model, setModel]           = useState("llama-3.3-70b-versatile");
  const [loading, setLoading]       = useState(false);
  const [loadingStep, setLoadingStep] = useState("Thinking...");
  const [error, setError]           = useState<string | null>(null);
  const [sidebar, setSidebar]       = useState(true);
  const [agentMode, setAgentMode]   = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef     = useRef<HTMLTextAreaElement>(null);

  const active = chats.find(c => c.id === activeId) ?? null;
  const currentModel = MODELS.find(m => m.id === model);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages, loading]);

  // Cycle loading messages
  useEffect(() => {
    if (!loading) return;
    const steps = ["Thinking...", "Planning approach...", "Running agents...", "Synthesizing...", "Almost done..."];
    let i = 0;
    const t = setInterval(() => { i = (i + 1) % steps.length; setLoadingStep(steps[i]); }, 1800);
    return () => clearInterval(t);
  }, [loading]);

  const newChat = () => {
    const c: Chat = { id: uid(), title: "New chat", messages: [] };
    setChats(p => [c, ...p]);
    setActiveId(c.id);
    setError(null);
  };

  // ── Image generation ──────────────────────────────────────────────
  const generateImage = async (prompt: string) => {
    let cid = activeId;
    if (!cid) {
      const c: Chat = { id: uid(), title: prompt.slice(0, 34), messages: [] };
      setChats(p => [c, ...p]);
      setActiveId(c.id);
      cid = c.id;
    }
    const userMsg: Message = { id: uid(), role: "user", content: prompt.trim(), time: now(), type: "text" };
    setChats(p => p.map(c => c.id === cid
      ? { ...c, messages: [...c.messages, userMsg], title: c.messages.length === 0 ? prompt.slice(0, 34) : c.title }
      : c
    ));
    setDraft("");
    setLoading(true);
    setLoadingStep("Generating image...");
    setError(null);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json() as { success: boolean; image?: string; mimeType?: string; error?: string };
      if (data.success && data.image) {
        const aiMsg: Message = {
          id: uid(), role: "assistant", time: now(), type: "image",
          content: `data:${data.mimeType};base64,${data.image}`,
        };
        setChats(p => p.map(c => c.id === cid ? { ...c, messages: [...c.messages, aiMsg] } : c));
      } else {
        setError(data.error ?? "Image generation failed");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
      setTimeout(() => taRef.current?.focus(), 80);
    }
  };

  // ── Send message ──────────────────────────────────────────────────
  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    // Auto-detect image requests
    const imageKeywords = ["generate image", "draw", "create image", "make image", "show me a picture", "generate a photo", "create a photo", "generate a picture", "paint a", "illustrate"];
    if (imageKeywords.some(kw => text.toLowerCase().includes(kw))) {
      await generateImage(text);
      return;
    }

    let cid = activeId;
    if (!cid) {
      const c: Chat = { id: uid(), title: text.slice(0, 34), messages: [] };
      setChats(p => [c, ...p]);
      setActiveId(c.id);
      cid = c.id;
    }

    const userMsg: Message = { id: uid(), role: "user", content: text.trim(), time: now(), type: "text" };
    setChats(p => p.map(c => c.id === cid
      ? { ...c, messages: [...c.messages, userMsg], title: c.messages.length === 0 ? text.slice(0, 34) : c.title }
      : c
    ));
    setDraft("");
    setLoading(true);
    setLoadingStep("Thinking...");
    setError(null);

    try {
      const history = chats.find(c => c.id === cid)?.messages ?? [];
      const messages = [
        ...history.filter(m => m.type !== "image").map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: text.trim() },
      ];

      // Use agent endpoint or direct chat
      const endpoint = agentMode ? "/api/agent" : "/api/chat";
      const provider = currentModel?.provider ?? "groq";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, model, provider }),
      });

      const data = await res.json() as {
        success: boolean;
        message: string;
        model?: string;
        provider?: string;
        toolCalls?: ToolCall[];
        image?: { data: string; mimeType: string } | null;
        agentsUsed?: string[];
        error?: string;
      };

      if (!res.ok) throw new Error(data.error ?? "Request failed");

      const aiMsg: Message = {
        id: uid(),
        role: "assistant",
        content: data.message,
        model: data.model,
        provider: data.provider,
        time: now(),
        type: data.image ? "image" : "text",
        toolCalls: data.toolCalls,
        image: data.image,
      };

      setChats(p => p.map(c => c.id === cid ? { ...c, messages: [...c.messages, aiMsg] } : c));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
      setTimeout(() => taRef.current?.focus(), 80);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(draft); }
  };

  const C = { fontFamily: "'Segoe UI', system-ui, sans-serif" } as React.CSSProperties;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0f", overflow: "hidden", ...C }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sidebar ? 265 : 0, minWidth: sidebar ? 265 : 0, flexShrink: 0,
        background: "#101014", borderRight: "1px solid #1e1e2e",
        display: "flex", flexDirection: "column",
        overflow: "hidden", transition: "all .25s ease",
      }}>
        <div style={{ padding: "14px 12px", display: "flex", flexDirection: "column", gap: 8, flex: 1, overflow: "hidden" }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 6px 10px" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 17, boxShadow: "0 0 20px rgba(99,102,241,.3)", flexShrink: 0 }}>M</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f9fafb" }}>MinaAI</div>
              <div style={{ fontSize: 10, color: "#4b5563" }}>Powered by Groq · Free</div>
            </div>
          </div>

          {/* New chat */}
          <button onClick={newChat} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "9px 12px",
            borderRadius: 8, border: "1px solid #2a2a3a", background: "transparent",
            color: "#d1d5db", fontSize: 13, cursor: "pointer", width: "100%", fontFamily: "inherit",
          }}
            onMouseOver={e => e.currentTarget.style.background = "#1a1a28"}
            onMouseOut={e => e.currentTarget.style.background = "transparent"}
          >
            <span style={{ fontSize: 18, color: "#6366f1" }}>+</span> New chat
          </button>

          {/* Agent mode toggle */}
          <div style={{ padding: "10px 12px", background: agentMode ? "rgba(99,102,241,.08)" : "#13131e", border: `1px solid ${agentMode ? "rgba(99,102,241,.25)" : "#2a2a3a"}`, borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: agentMode ? "#818cf8" : "#6b7280" }}>🤖 Agent Mode</span>
              <button onClick={() => setAgentMode(o => !o)} style={{ width: 36, height: 20, borderRadius: 10, border: "none", background: agentMode ? "#6366f1" : "#2a2a3a", cursor: "pointer", position: "relative", transition: "all .2s" }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: agentMode ? 19 : 3, transition: "all .2s" }} />
              </button>
            </div>
            <div style={{ fontSize: 10, color: "#4b5563" }}>
              {agentMode ? "🔍 Search · 💻 Code · 🐛 Debug · 📋 Plan · 📝 Review" : "Direct chat — no agents"}
            </div>
          </div>

          {/* Model selector */}
          <div>
            <div style={{ fontSize: 9, color: "#4b5563", fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", padding: "0 4px 5px" }}>Model</div>
            <select value={model} onChange={e => setModel(e.target.value)} style={{
              width: "100%", background: "#1a1a28", border: "1px solid #2a2a3a",
              borderRadius: 8, color: "#d1d5db", fontSize: 12, padding: "8px 10px",
              cursor: "pointer", outline: "none", fontFamily: "inherit",
            }}>
              <optgroup label="Groq (Free)">
                {MODELS.filter(m => m.provider === "groq").map(m => (
                  <option key={m.id} value={m.id}>{m.label} — {m.desc}</option>
                ))}
              </optgroup>
              <optgroup label="Google (Free tier)">
                {MODELS.filter(m => m.provider === "gemini").map(m => (
                  <option key={m.id} value={m.id}>{m.label} — {m.desc}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Current model info */}
          <div style={{ padding: "8px 12px", background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.15)", borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 3 }}>ACTIVE MODEL</div>
            <div style={{ fontSize: 12, color: "#a5b4fc", fontWeight: 600 }}>{currentModel?.label}</div>
            <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{currentModel?.desc} · {currentModel?.provider === "groq" ? "Free via Groq" : "Free via Google"}</div>
          </div>

          {/* Chat list */}
          <div style={{ fontSize: 9, color: "#4b5563", fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", padding: "4px 4px 2px" }}>Chats</div>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
            {chats.length === 0
              ? <div style={{ fontSize: 12, color: "#374151", textAlign: "center", padding: 16 }}>No chats yet</div>
              : chats.map(c => (
                <div key={c.id} onClick={() => setActiveId(c.id)} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 10px",
                  borderRadius: 8, cursor: "pointer",
                  background: activeId === c.id ? "#1a1a28" : "transparent",
                  border: `1px solid ${activeId === c.id ? "#2a2a3a" : "transparent"}`,
                }}
                  onMouseOver={e => { if (activeId !== c.id) e.currentTarget.style.background = "#13131e"; }}
                  onMouseOut={e => { if (activeId !== c.id) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontSize: 10, color: "#4b5563" }}>💬</span>
                  <span style={{ flex: 1, fontSize: 12, color: "#d1d5db", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
                  <button onClick={e => { e.stopPropagation(); setChats(p => p.filter(x => x.id !== c.id)); if (activeId === c.id) setActiveId(null); }}
                    style={{ background: "none", border: "none", color: "#374151", cursor: "pointer", fontSize: 14, flexShrink: 0 }}
                    onMouseOver={e => e.currentTarget.style.color = "#ef4444"}
                    onMouseOut={e => e.currentTarget.style.color = "#374151"}
                  >×</button>
                </div>
              ))
            }
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Header */}
        <header style={{ height: 52, background: "#101014", borderBottom: "1px solid #1e1e2e", display: "flex", alignItems: "center", padding: "0 16px", gap: 12, flexShrink: 0 }}>
          <button onClick={() => setSidebar(o => !o)} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 18, padding: 4 }}>☰</button>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>M</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#f9fafb" }}>MinaAI</span>
          <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: "rgba(99,102,241,.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,.3)" }}>
            {agentMode ? "🤖 Multi-Agent · " : ""}{currentModel?.label}
          </span>
          {loading && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#818cf8" }}>
              <div style={{ width: 12, height: 12, border: "2px solid #2a2a3a", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
              {loadingStep}
            </div>
          )}
        </header>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 0 8px" }}>
          {!active || active.messages.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 20, padding: 40 }}>
              <div style={{ width: 70, height: 70, borderRadius: 20, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 32, boxShadow: "0 0 50px rgba(99,102,241,.35)" }}>M</div>
              <div style={{ textAlign: "center" }}>
                <h1 style={{ fontSize: 26, fontWeight: 700, color: "#f9fafb", marginBottom: 8 }}>MinaAI — Multi-Agent System</h1>
                <p style={{ fontSize: 13, color: "#6b7280" }}>🔍 Search · 💻 Code · 🐛 Debug · 📋 Plan · 📝 Review · 🖼️ Images</p>
                <p style={{ fontSize: 11, color: "#374151", marginTop: 4 }}>Powered by Groq (free) · No API cost</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 580, width: "100%" }}>
                {CHIPS.map(s => (
                  <button key={s} onClick={() => send(s)} style={{
                    padding: "12px 14px", background: "#101014", border: "1px solid #1e1e2e",
                    borderRadius: 10, color: "#9ca3af", fontSize: 12, cursor: "pointer",
                    textAlign: "left", lineHeight: 1.5, fontFamily: "inherit", transition: "all .15s",
                  }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.color = "#f9fafb"; e.currentTarget.style.background = "#13131e"; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = "#1e1e2e"; e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.background = "#101014"; }}
                  >{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 780, margin: "0 auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 4 }}>
              {active.messages.map(msg => (
                <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 22 }}>

                  {/* Name row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                    {msg.role === "assistant" && (
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 11, flexShrink: 0 }}>M</div>
                    )}
                    <span style={{ fontSize: 11, color: "#4b5563" }}>
                      {msg.role === "user" ? "You" : `MinaAI${msg.model ? ` · ${msg.model}` : ""}`}
                    </span>
                    <span style={{ fontSize: 10, color: "#2d2d3a" }}>{msg.time}</span>
                  </div>

                  {/* User bubble */}
                  {msg.role === "user" ? (
                    <div style={{ background: "linear-gradient(135deg,#6366f1,#7c3aed)", color: "#fff", padding: "11px 16px", borderRadius: "14px 14px 3px 14px", maxWidth: "75%", fontSize: 14, lineHeight: 1.65 }}>
                      {msg.content}
                    </div>

                  ) : (
                    <div style={{ width: "100%" }}>
                      {/* Tool badges */}
                      {msg.toolCalls && <ToolBadges toolCalls={msg.toolCalls} />}

                      {/* Image output */}
                      {msg.image && (
                        <div style={{ background: "#101014", border: "1px solid #1e1e2e", borderRadius: "3px 14px 14px 14px", padding: "14px 18px", marginBottom: 8 }}>
                          <img src={`data:${msg.image.mimeType};base64,${msg.image.data}`} alt="Generated" style={{ maxWidth: "100%", width: 500, borderRadius: 10, display: "block" }} />
                          <div style={{ marginTop: 8, fontSize: 11, color: "#4b5563" }}>🎨 Generated by Image Agent</div>
                        </div>
                      )}

                      {/* Text output */}
                      {msg.type === "image" && !msg.image ? (
                        <div style={{ background: "#101014", border: "1px solid #1e1e2e", borderRadius: "3px 14px 14px 14px", padding: "14px 18px" }}>
                          <img src={msg.content} alt="Generated" style={{ maxWidth: "100%", width: 500, borderRadius: 10 }} />
                          <div style={{ marginTop: 8, fontSize: 11, color: "#4b5563" }}>🎨 Generated image</div>
                        </div>
                      ) : msg.content ? (
                        <div style={{ background: "#101014", border: "1px solid #1e1e2e", borderRadius: "3px 14px 14px 14px", padding: "16px 20px", fontSize: 14 }}>
                          <MsgText text={msg.content} />
                        </div>
                      ) : null}

                      {msg.content && msg.type !== "image" && (
                        <div style={{ marginTop: 5 }}><CopyBtn text={msg.content} /></div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 11, marginTop: 8, flexShrink: 0 }}>M</div>
                  <div style={{ background: "#101014", border: "1px solid #1e1e2e", borderRadius: "3px 14px 14px 14px" }}><Dots /></div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ margin: "0 20px 10px", padding: "10px 14px", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, color: "#f87171", fontSize: 13, display: "flex", justifyContent: "space-between" }}>
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>×</button>
          </div>
        )}

        {/* Input */}
        <div style={{ padding: "10px 20px 18px", background: "#0a0a0f", flexShrink: 0 }}>
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: "#101014", border: "1px solid #1e1e2e", borderRadius: 14, padding: "10px 14px" }}>
              <textarea
                ref={taRef}
                value={draft}
                onChange={e => { setDraft(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px"; }}
                onKeyDown={onKey}
                disabled={loading}
                placeholder={agentMode ? `Ask anything — agents will search, code, plan & more...` : `Message MinaAI (${currentModel?.label})...`}
                rows={1}
                style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#f9fafb", fontSize: 14, resize: "none", lineHeight: 1.65, minHeight: 24, maxHeight: 160, fontFamily: "inherit" }}
              />
              <button onClick={() => send(draft)} disabled={!draft.trim() || loading} style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: draft.trim() && !loading ? "linear-gradient(135deg,#6366f1,#7c3aed)" : "#1a1a28",
                border: "none", color: "#fff",
                cursor: draft.trim() && !loading ? "pointer" : "not-allowed",
                fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: draft.trim() && !loading ? "0 0 16px rgba(99,102,241,.4)" : "none",
                transition: "all .2s",
              }}>▲</button>
            </div>
            <div style={{ textAlign: "center", fontSize: 11, color: "#2d2d3a", marginTop: 7 }}>
              {agentMode ? "🤖 Multi-Agent Mode · Groq powered · Free" : `Direct chat · ${currentModel?.label}`}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#2a2a3a;border-radius:4px}
        *{box-sizing:border-box}
      `}</style>
    </div>
  );
}