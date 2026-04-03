// app/loading.tsx  (Next.js auto-uses this as loading UI)
export default function Loading() {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#0a0a0f",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', system-ui, sans-serif", zIndex: 9999,
    }}>
      {/* Animated logo */}
      <div style={{ position: "relative", marginBottom: 32 }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 32, boxShadow: "0 0 40px rgba(99,102,241,.5)", animation: "pulse 2s ease-in-out infinite" }}>M</div>
        {/* Ring */}
        <div style={{ position: "absolute", inset: -8, borderRadius: 28, border: "2px solid transparent", borderTopColor: "#6366f1", borderRightColor: "#8b5cf6", animation: "spin 1.5s linear infinite" }} />
      </div>

      {/* Title */}
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f9fafb", margin: "0 0 8px" }}>MinaAI</h1>
      <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 32px" }}>Multi-Agent Intelligence System</p>

      {/* Progress bar */}
      <div style={{ width: 200, height: 3, background: "#1e1e2e", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", background: "linear-gradient(90deg,#6366f1,#8b5cf6)", borderRadius: 4, animation: "progress 2s ease-in-out infinite" }} />
      </div>

      {/* Dots */}
      <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
        {["#6366f1","#8b5cf6","#a78bfa"].map((c, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c, animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
        ))}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{box-shadow:0 0 40px rgba(99,102,241,.5)} 50%{box-shadow:0 0 60px rgba(99,102,241,.8)} }
        @keyframes progress { 0%{width:0;margin-left:0} 50%{width:100%;margin-left:0} 100%{width:0;margin-left:100%} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      `}</style>
    </div>
  );
}