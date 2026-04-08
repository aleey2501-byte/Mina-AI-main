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

const MODELS = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B",    provider: "groq"     },
  { id: "llama-3.1-8b-instant",    label: "Llama 3.1 8B",     provider: "groq"     },
  { id: "mixtral-8x7b-32768",      label: "Mixtral 8x7B",     provider: "groq"     },
  { id: "gemma2-9b-it",            label: "Gemma 2 9B",       provider: "groq"     },
  { id: "deepseek-chat",           label: "DeepSeek V3",      provider: "deepseek" },
  { id: "gemini-2.5-flash",        label: "Gemini 2.5 Flash", provider: "gemini"   },
];

const TOOL_ICONS: Record<string, string> = {
  web_search: "🔍", generate_image: "🖼️", deep_reasoning: "🧠",
  code_agent: "💻", debug_agent: "🐛", planner_agent: "📋",
  reviewer_agent: "📝", summarize_and_analyze: "📊", chat: "💬",
};

const CHIPS = [
  "Search latest AI news",
  "Write a Python script",
  "Debug my code",
  "Build a startup plan",
  "Generate an image",
  "Explain machine learning",
];

const uid = () => Math.random().toString(36).slice(2, 9);
const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "14px 18px" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,.3)", animation: `tdot 1.4s ${i*0.2}s ease-in-out infinite` }} />
      ))}
    </div>
  );
}

function MsgText({ text }: { text: string }) {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let code: string[] = [];
  let inCode = false;

  lines.forEach((line, i) => {
    if (line.startsWith("```")) {
      if (!inCode) { inCode = true; code = []; }
      else {
        inCode = false;
        out.push(
          <div key={i} style={{ margin: "12px 0", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,.08)" }}>
            <div style={{ background: "rgba(255,255,255,.04)", padding: "5px 14px", fontSize: 11, color: "rgba(255,255,255,.3)", borderBottom: "1px solid rgba(255,255,255,.06)" }}>code</div>
            <pre style={{ margin: 0, padding: "14px 16px", overflowX: "auto", background: "rgba(0,0,0,.3)" }}>
              <code style={{ fontFamily: "monospace", fontSize: 13, color: "#a5b4fc", lineHeight: 1.7 }}>{code.join("\n")}</code>
            </pre>
          </div>
        );
        code = [];
      }
    } else if (inCode) {
      code.push(line);
    } else if (line.startsWith("### ")) {
      out.push(<p key={i} style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: "14px 0 4px" }}>{line.slice(4)}</p>);
    } else if (line.startsWith("## ")) {
      out.push(<p key={i} style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: "16px 0 6px" }}>{line.slice(3)}</p>);
    } else if (line.startsWith("# ")) {
      out.push(<p key={i} style={{ fontSize: 17, fontWeight: 600, color: "#fff", margin: "18px 0 8px" }}>{line.slice(2)}</p>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      out.push(<div key={i} style={{ display: "flex", gap: 10, color: "rgba(255,255,255,.8)", fontSize: 14, lineHeight: 1.7, margin: "3px 0" }}><span style={{ color: "#a78bfa", flexShrink: 0 }}>▸</span><span>{line.slice(2)}</span></div>);
    } else if (/^\d+\. /.test(line)) {
      out.push(<div key={i} style={{ color: "rgba(255,255,255,.8)", fontSize: 14, lineHeight: 1.7, margin: "3px 0", paddingLeft: 16 }}>{line}</div>);
    } else if (line.startsWith("> ")) {
      out.push(<div key={i} style={{ borderLeft: "3px solid #a78bfa", paddingLeft: 14, margin: "8px 0", color: "rgba(255,255,255,.5)", fontStyle: "italic", fontSize: 14 }}>{line.slice(2)}</div>);
    } else if (line === "") {
      out.push(<div key={i} style={{ height: 6 }} />);
    } else {
      const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
      out.push(
        <p key={i} style={{ color: "rgba(255,255,255,.85)", fontSize: 14, lineHeight: 1.75, margin: "2px 0" }}>
          {parts.map((p, j) =>
            p.startsWith("`") && p.endsWith("`")
              ? <code key={j} style={{ background: "rgba(167,139,250,.2)", borderRadius: 5, padding: "1px 7px", fontFamily: "monospace", fontSize: 12, color: "#c4b5fd" }}>{p.slice(1,-1)}</code>
              : p.startsWith("**") && p.endsWith("**")
              ? <strong key={j} style={{ fontWeight: 600, color: "#fff" }}>{p.slice(2,-2)}</strong>
              : p
          )}
        </p>
      );
    }
  });
  return <div>{out}</div>;
}

function ToolBadges({ toolCalls }: { toolCalls: ToolCall[] }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!toolCalls?.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
      {toolCalls.map((tc, i) => (
        <button key={i} onClick={() => setOpen(open === i ? null : i)} style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.5)", fontFamily: "inherit" }}>
          {TOOL_ICONS[tc.tool] ?? "🔧"} {tc.tool.replace(/_/g, " ")}
        </button>
      ))}
    </div>
  );
}

export default function Page() {
  const [chats, setChats]             = useState<Chat[]>([]);
  const [activeId, setActiveId]       = useState<string | null>(null);
  const [draft, setDraft]             = useState("");
  const [model, setModel]             = useState("llama-3.3-70b-versatile");
  const [loading, setLoading]         = useState(false);
  const [loadingStep, setLoadingStep] = useState("Thinking...");
  const [error, setError]             = useState<string | null>(null);
  const [sidebar, setSidebar]         = useState(true);
  const [agentMode, setAgentMode]     = useState(true);
  const [userName]                    = useState("there");
  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef     = useRef<HTMLTextAreaElement>(null);

  const active       = chats.find(c => c.id === activeId) ?? null;
  const currentModel = MODELS.find(m => m.id === model);
  const inChat       = !!(active && active.messages.length > 0);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [active?.messages, loading]);

  useEffect(() => {
    if (!loading) return;
    const steps = ["Thinking...", "Planning...", "Running agents...", "Synthesizing...", "Almost done..."];
    let i = 0;
    const t = setInterval(() => { i = (i+1)%steps.length; setLoadingStep(steps[i]); }, 1800);
    return () => clearInterval(t);
  }, [loading]);

  const newChat = () => {
    const c: Chat = { id: uid(), title: "New chat", messages: [] };
    setChats(p => [c, ...p]);
    setActiveId(c.id);
    setError(null);
  };

  const generateImage = async (prompt: string) => {
    let cid = activeId;
    if (!cid) {
      const c: Chat = { id: uid(), title: prompt.slice(0,34), messages: [] };
      setChats(p => [c,...p]); setActiveId(c.id); cid = c.id;
    }
    const userMsg: Message = { id: uid(), role: "user", content: prompt.trim(), time: now(), type: "text" };
    setChats(p => p.map(c => c.id===cid ? {...c, messages:[...c.messages,userMsg], title: c.messages.length===0?prompt.slice(0,34):c.title} : c));
    setDraft(""); setLoading(true); setLoadingStep("Generating image..."); setError(null);
    try {
      const res  = await fetch("/api/generate-image", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({prompt}) });
      const data = await res.json() as { success:boolean; image?:string; mimeType?:string; error?:string };
      if (data.success && data.image) {
        const aiMsg: Message = { id:uid(), role:"assistant", time:now(), type:"image", content:`data:${data.mimeType};base64,${data.image}` };
        setChats(p => p.map(c => c.id===cid ? {...c, messages:[...c.messages,aiMsg]} : c));
      } else { setError(data.error ?? "Image generation failed"); }
    } catch(e) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); setTimeout(()=>taRef.current?.focus(),80); }
  };

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const imgKw = ["generate image","draw","create image","make image","show me a picture","generate a photo","paint a","illustrate"];
    if (imgKw.some(kw => text.toLowerCase().includes(kw))) { await generateImage(text); return; }

    let cid = activeId;
    if (!cid) {
      const c: Chat = { id:uid(), title:text.slice(0,34), messages:[] };
      setChats(p=>[c,...p]); setActiveId(c.id); cid = c.id;
    }
    const userMsg: Message = { id:uid(), role:"user", content:text.trim(), time:now(), type:"text" };
    setChats(p=>p.map(c=>c.id===cid?{...c,messages:[...c.messages,userMsg],title:c.messages.length===0?text.slice(0,34):c.title}:c));
    setDraft(""); setLoading(true); setLoadingStep("Thinking..."); setError(null);

    try {
      const history  = chats.find(c=>c.id===cid)?.messages??[];
      const messages = [...history.filter(m=>m.type!=="image").map(m=>({role:m.role,content:m.content})), {role:"user",content:text.trim()}];
      const endpoint = agentMode ? "/api/agent" : "/api/chat";
      const provider = currentModel?.provider ?? "groq";

      const res  = await fetch(endpoint, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({messages,model,provider}) });
      const data = await res.json() as { success:boolean; message:string; model?:string; provider?:string; toolCalls?:ToolCall[]; image?:{data:string;mimeType:string}|null; error?:string };
      if (!res.ok) throw new Error(data.error??"Request failed");

      const aiMsg: Message = { id:uid(), role:"assistant", content:data.message, model:data.model, provider:data.provider, time:now(), type:data.image?"image":"text", toolCalls:data.toolCalls, image:data.image };
      setChats(p=>p.map(c=>c.id===cid?{...c,messages:[...c.messages,aiMsg]}:c));
    } catch(e) { setError(e instanceof Error ? e.message : "Something went wrong"); }
    finally { setLoading(false); setTimeout(()=>taRef.current?.focus(),80); }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(draft); }
  };

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"'Inter',system-ui,sans-serif", overflow:"hidden", position:"relative" }}>

      {/* ── GRADIENT MESH BACKGROUND (like Lovable) ── */}
      <div style={{ position:"fixed", inset:0, zIndex:0, background:"#0a0a0f" }}>
        <div style={{ position:"absolute", top:"-10%", left:"20%", width:"60%", height:"60%", background:"radial-gradient(ellipse, rgba(88,80,236,.35) 0%, transparent 70%)", filter:"blur(40px)" }} />
        <div style={{ position:"absolute", top:"30%", left:"-10%", width:"50%", height:"50%", background:"radial-gradient(ellipse, rgba(139,92,246,.2) 0%, transparent 70%)", filter:"blur(60px)" }} />
        <div style={{ position:"absolute", bottom:"-5%", right:"10%", width:"55%", height:"55%", background:"radial-gradient(ellipse, rgba(236,72,153,.25) 0%, transparent 70%)", filter:"blur(50px)" }} />
        <div style={{ position:"absolute", bottom:"20%", left:"30%", width:"40%", height:"40%", background:"radial-gradient(ellipse, rgba(59,130,246,.15) 0%, transparent 70%)", filter:"blur(40px)" }} />
      </div>

      {/* ── SIDEBAR ── */}
      <aside style={{ width: sidebar?260:0, minWidth: sidebar?260:0, flexShrink:0, position:"relative", zIndex:10, background:"rgba(10,10,15,.7)", backdropFilter:"blur(20px)", borderRight:"1px solid rgba(255,255,255,.06)", display:"flex", flexDirection:"column", overflow:"hidden", transition:"all .3s cubic-bezier(.4,0,.2,1)" }}>
        <div style={{ padding:"20px 16px", display:"flex", flexDirection:"column", gap:2, flex:1, overflow:"hidden" }}>

          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"4px 6px 20px" }}>
            <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:14, flexShrink:0 }}>M</div>
            <span style={{ fontSize:15, fontWeight:600, color:"rgba(255,255,255,.9)", letterSpacing:"-.01em" }}>MinaAI</span>
          </div>

          {/* Nav items */}
          {[
            { icon:"⌂", label:"Home", action: ()=>{ setActiveId(null); } },
            { icon:"⊕", label:"New chat", action: newChat },
          ].map(item => (
            <button key={item.label} onClick={item.action} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 10px", borderRadius:8, border:"none", background:"transparent", color:"rgba(255,255,255,.5)", fontSize:13, cursor:"pointer", width:"100%", fontFamily:"inherit", transition:"all .15s", textAlign:"left" }}
              onMouseOver={e=>{e.currentTarget.style.background="rgba(255,255,255,.07)";e.currentTarget.style.color="rgba(255,255,255,.9)";}}
              onMouseOut={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,.5)";}}
            >
              <span style={{ fontSize:14, width:16, textAlign:"center" }}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          {/* Agent toggle row */}
          <button onClick={()=>setAgentMode(o=>!o)} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 10px", borderRadius:8, border:"none", background: agentMode?"rgba(99,102,241,.12)":"transparent", color: agentMode?"rgba(167,139,250,.9)":"rgba(255,255,255,.5)", fontSize:13, cursor:"pointer", width:"100%", fontFamily:"inherit", transition:"all .15s", textAlign:"left" }}
            onMouseOver={e=>{e.currentTarget.style.background=agentMode?"rgba(99,102,241,.18)":"rgba(255,255,255,.07)";}}
            onMouseOut={e=>{e.currentTarget.style.background=agentMode?"rgba(99,102,241,.12)":"transparent";}}
          >
            <span style={{ fontSize:14, width:16, textAlign:"center" }}>⚡</span>
            Agents {agentMode ? "on" : "off"}
            <div style={{ marginLeft:"auto", width:30, height:16, borderRadius:8, background: agentMode?"#6366f1":"rgba(255,255,255,.1)", position:"relative", transition:"all .2s", flexShrink:0 }}>
              <div style={{ width:12, height:12, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left: agentMode?16:2, transition:"all .2s" }} />
            </div>
          </button>

          {/* Model picker */}
          <div style={{ padding:"4px 4px 8px" }}>
            <div style={{ fontSize:10, color:"rgba(255,255,255,.2)", fontWeight:500, letterSpacing:".08em", textTransform:"uppercase", marginBottom:6, paddingLeft:6 }}>Model</div>
            <select value={model} onChange={e=>setModel(e.target.value)} style={{ width:"100%", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)", borderRadius:8, color:"rgba(255,255,255,.7)", fontSize:12, padding:"8px 10px", cursor:"pointer", outline:"none", fontFamily:"inherit" }}>
              <optgroup label="Groq — Free">
                {MODELS.filter(m=>m.provider==="groq").map(m=><option key={m.id} value={m.id}>{m.label}</option>)}
              </optgroup>
              <optgroup label="DeepSeek">
                {MODELS.filter(m=>m.provider==="deepseek").map(m=><option key={m.id} value={m.id}>{m.label}</option>)}
              </optgroup>
              <optgroup label="Google">
                {MODELS.filter(m=>m.provider==="gemini").map(m=><option key={m.id} value={m.id}>{m.label}</option>)}
              </optgroup>
            </select>
          </div>

          {/* Recents */}
          {chats.length > 0 && (
            <>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.2)", fontWeight:500, letterSpacing:".08em", textTransform:"uppercase", padding:"8px 10px 4px" }}>Recents</div>
              <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:1 }}>
                {chats.map(c => (
                  <div
                    key={c.id}
                    onClick={()=>setActiveId(c.id)}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:8, cursor:"pointer", background: activeId===c.id?"rgba(255,255,255,.08)":"transparent", transition:"all .1s" }}
                    onMouseOver={e=>{if(activeId!==c.id)e.currentTarget.style.background="rgba(255,255,255,.04)";}}
                    onMouseOut={e=>{if(activeId!==c.id)e.currentTarget.style.background="transparent";}}
                  >
                    <span style={{ fontSize:12, color:"rgba(255,255,255,.25)", flexShrink:0 }}>◇</span>
                    <span style={{ flex:1, fontSize:12, color: activeId===c.id?"rgba(255,255,255,.8)":"rgba(255,255,255,.4)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.title}</span>
                    <button
                      onClick={e=>{e.stopPropagation();setChats(p=>p.filter(x=>x.id!==c.id));if(activeId===c.id)setActiveId(null);}}
                      style={{ background:"none", border:"none", color:"rgba(255,255,255,.15)", cursor:"pointer", fontSize:14, flexShrink:0, padding:2, fontFamily:"inherit" }}
                      onMouseOver={e=>e.currentTarget.style.color="#f87171"}
                      onMouseOut={e=>e.currentTarget.style.color="rgba(255,255,255,.15)"}
                    >×</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, position:"relative", zIndex:5 }}>

        {/* Topbar — minimal */}
        <header style={{ height:52, display:"flex", alignItems:"center", padding:"0 20px", gap:12, flexShrink:0, position:"relative", zIndex:10 }}>
          <button onClick={()=>setSidebar(o=>!o)} style={{ background:"none", border:"none", color:"rgba(255,255,255,.3)", cursor:"pointer", fontSize:18, padding:4, transition:"color .15s" }}
            onMouseOver={e=>e.currentTarget.style.color="rgba(255,255,255,.7)"}
            onMouseOut={e=>e.currentTarget.style.color="rgba(255,255,255,.3)"}
          >☰</button>

          {loading && (
            <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:7, fontSize:12, color:"rgba(255,255,255,.4)" }}>
              <div style={{ width:10, height:10, border:"1.5px solid rgba(255,255,255,.1)", borderTopColor:"#a78bfa", borderRadius:"50%", animation:"spin .8s linear infinite" }} />
              {loadingStep}
            </div>
          )}
        </header>

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>

          {!inChat ? (
            /* ── WELCOME (Lovable-style centered) ── */
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 24px 0", gap:32 }}>

              {/* Big greeting */}
              <h1 style={{ fontSize:36, fontWeight:600, color:"#fff", margin:0, textAlign:"center", letterSpacing:"-.02em", lineHeight:1.2, textShadow:"0 2px 20px rgba(139,92,246,.3)" }}>
                What&apos;s on your mind, {userName}?
              </h1>

              {/* Main input — large centered like Lovable */}
              <div style={{ width:"100%", maxWidth:680 }}>
                <div style={{ background:"rgba(20,20,35,.85)", backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,.1)", borderRadius:16, padding:"18px 20px 14px", transition:"border-color .2s", boxShadow:"0 8px 32px rgba(0,0,0,.4)" }}
                  onFocusCapture={e=>e.currentTarget.style.borderColor="rgba(139,92,246,.5)"}
                  onBlurCapture={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.1)"}
                >
                  <textarea
                    ref={taRef}
                    value={draft}
                    autoFocus
                    onChange={e=>{ setDraft(e.target.value); e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,160)+"px"; }}
                    onKeyDown={onKey}
                    disabled={loading}
                    placeholder="Ask MinaAI to search, code, plan, or create..."
                    rows={1}
                    style={{ width:"100%", background:"none", border:"none", outline:"none", color:"rgba(255,255,255,.9)", fontSize:15, resize:"none", lineHeight:1.6, minHeight:28, maxHeight:160, fontFamily:"inherit", marginBottom:12 }}
                  />
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      {/* Model badge */}
                      <div style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.08)", borderRadius:20, cursor:"pointer" }}>
                        <div style={{ width:5, height:5, borderRadius:"50%", background:"#a78bfa" }} />
                        <span style={{ fontSize:11, color:"rgba(255,255,255,.5)" }}>{currentModel?.label}</span>
                      </div>
                      {/* Agent badge */}
                      {agentMode && (
                        <div style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", background:"rgba(99,102,241,.1)", border:"1px solid rgba(99,102,241,.2)", borderRadius:20 }}>
                          <span style={{ fontSize:11, color:"#818cf8" }}>Agents</span>
                        </div>
                      )}
                    </div>
                    <button onClick={()=>send(draft)} disabled={!draft.trim()||loading} style={{ width:36, height:36, borderRadius:10, border:"none", background: draft.trim()&&!loading?"linear-gradient(135deg,#6366f1,#8b5cf6)":"rgba(255,255,255,.06)", color: draft.trim()&&!loading?"#fff":"rgba(255,255,255,.2)", cursor: draft.trim()&&!loading?"pointer":"not-allowed", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s", flexShrink:0, boxShadow: draft.trim()&&!loading?"0 4px 16px rgba(99,102,241,.4)":"none" }}>↑</button>
                  </div>
                </div>
              </div>

              {/* Suggestion chips */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center", maxWidth:620 }}>
                {CHIPS.map(chip => (
                  <button key={chip} onClick={()=>send(chip)} style={{ padding:"8px 16px", background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.08)", borderRadius:20, color:"rgba(255,255,255,.5)", fontSize:13, cursor:"pointer", fontFamily:"inherit", transition:"all .15s", backdropFilter:"blur(10px)" }}
                    onMouseOver={e=>{e.currentTarget.style.background="rgba(255,255,255,.1)";e.currentTarget.style.color="rgba(255,255,255,.85)";e.currentTarget.style.borderColor="rgba(255,255,255,.15)";}}
                    onMouseOut={e=>{e.currentTarget.style.background="rgba(255,255,255,.06)";e.currentTarget.style.color="rgba(255,255,255,.5)";e.currentTarget.style.borderColor="rgba(255,255,255,.08)";}}
                  >{chip}</button>
                ))}
              </div>
            </div>

          ) : (

            /* ── CHAT MESSAGES ── */
            <div style={{ maxWidth:760, margin:"0 auto", width:"100%", padding:"28px 24px", display:"flex", flexDirection:"column", gap:4 }}>
              {active!.messages.map(msg => (
                <div key={msg.id} style={{ display:"flex", flexDirection:"column", alignItems: msg.role==="user"?"flex-end":"flex-start", marginBottom:20 }}>

                  <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
                    {msg.role==="assistant" && (
                      <div style={{ width:20, height:20, borderRadius:5, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:10, flexShrink:0 }}>M</div>
                    )}
                    <span style={{ fontSize:11, color:"rgba(255,255,255,.25)" }}>{msg.role==="user"?"You":"MinaAI"}</span>
                    <span style={{ fontSize:10, color:"rgba(255,255,255,.15)" }}>{msg.time}</span>
                  </div>

                  {msg.role==="user" ? (
                    <div style={{ background:"rgba(99,102,241,.2)", backdropFilter:"blur(10px)", border:"1px solid rgba(99,102,241,.3)", color:"rgba(255,255,255,.9)", padding:"11px 16px", borderRadius:"16px 16px 4px 16px", maxWidth:"72%", fontSize:14, lineHeight:1.65 }}>
                      {msg.content}
                    </div>
                  ) : (
                    <div style={{ width:"100%", maxWidth:"88%" }}>
                      {msg.toolCalls && <ToolBadges toolCalls={msg.toolCalls} />}

                      {msg.image && (
                        <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:14, padding:14, marginBottom:8, display:"inline-block" }}>
                          <img src={`data:${msg.image.mimeType};base64,${msg.image.data}`} alt="Generated" style={{ maxWidth:"100%", width:480, borderRadius:10, display:"block" }} />
                        </div>
                      )}

                      {msg.type==="image" && !msg.image && (
                        <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:14, padding:14 }}>
                          <img src={msg.content} alt="Generated" style={{ maxWidth:"100%", width:480, borderRadius:10 }} />
                        </div>
                      )}

                      {msg.content && msg.type!=="image" && (
                        <>
                          <div style={{ background:"rgba(255,255,255,.04)", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,.06)", borderRadius:"4px 16px 16px 16px", padding:"14px 18px" }}>
                            <MsgText text={msg.content} />
                          </div>
                          <button onClick={()=>navigator.clipboard.writeText(msg.content)} style={{ marginTop:5, fontSize:11, color:"rgba(255,255,255,.2)", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", padding:0, transition:"color .15s" }}
                            onMouseOver={e=>e.currentTarget.style.color="rgba(255,255,255,.5)"}
                            onMouseOut={e=>e.currentTarget.style.color="rgba(255,255,255,.2)"}
                          >Copy</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                  <div style={{ width:20, height:20, borderRadius:5, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:10, marginTop:6, flexShrink:0 }}>M</div>
                  <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.06)", borderRadius:"4px 16px 16px 16px" }}>
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* ── BOTTOM INPUT (in chat mode) ── */}
        {inChat && (
          <div style={{ padding:"12px 24px 20px", flexShrink:0, position:"relative", zIndex:10 }}>
            <div style={{ maxWidth:760, margin:"0 auto" }}>
              {error && (
                <div style={{ marginBottom:8, padding:"8px 14px", background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.2)", borderRadius:9, color:"#f87171", fontSize:13, display:"flex", justifyContent:"space-between" }}>
                  <span>{error}</span>
                  <button onClick={()=>setError(null)} style={{ background:"none", border:"none", color:"#f87171", cursor:"pointer" }}>×</button>
                </div>
              )}
              <div style={{ background:"rgba(20,20,35,.85)", backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,.1)", borderRadius:14, padding:"12px 14px 10px", transition:"border-color .2s", boxShadow:"0 -4px 20px rgba(0,0,0,.3)" }}
                onFocusCapture={e=>e.currentTarget.style.borderColor="rgba(139,92,246,.4)"}
                onBlurCapture={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.1)"}
              >
                <textarea
                  ref={taRef}
                  value={draft}
                  onChange={e=>{ setDraft(e.target.value); e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,160)+"px"; }}
                  onKeyDown={onKey}
                  disabled={loading}
                  placeholder="Ask anything..."
                  rows={1}
                  style={{ width:"100%", background:"none", border:"none", outline:"none", color:"rgba(255,255,255,.9)", fontSize:14, resize:"none", lineHeight:1.6, minHeight:24, maxHeight:160, fontFamily:"inherit", marginBottom:8 }}
                />
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,.15)" }}>{currentModel?.label}</span>
                  <button onClick={()=>send(draft)} disabled={!draft.trim()||loading} style={{ width:32, height:32, borderRadius:8, border:"none", background: draft.trim()&&!loading?"linear-gradient(135deg,#6366f1,#8b5cf6)":"rgba(255,255,255,.05)", color: draft.trim()&&!loading?"#fff":"rgba(255,255,255,.2)", cursor: draft.trim()&&!loading?"pointer":"not-allowed", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s", flexShrink:0 }}>↑</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error on welcome screen */}
        {!inChat && error && (
          <div style={{ margin:"0 24px 12px", maxWidth:680, alignSelf:"center", width:"100%", padding:"10px 14px", background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.2)", borderRadius:9, color:"#f87171", fontSize:13, display:"flex", justifyContent:"space-between" }}>
            <span>{error}</span>
            <button onClick={()=>setError(null)} style={{ background:"none", border:"none", color:"#f87171", cursor:"pointer" }}>×</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes tdot { 0%,60%,100%{transform:translateY(0);opacity:.3} 30%{transform:translateY(-5px);opacity:1} }
        @keyframes spin  { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:3px}
        * { box-sizing:border-box }
        select option { background:#14141f }
        select optgroup { background:#0d0d1a; font-size:11px }
      `}</style>
    </div>
  );
}