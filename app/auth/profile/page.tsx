// app/profile/page.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats] = useState({ chats: 24, messages: 186, imagesGenerated: 12, agentsUsed: 47 });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") return null;
  if (!session) return null;

  const user = session.user;
  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase() ?? "U";

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#f9fafb" }}>

      {/* Header */}
      <header style={{ height: 56, background: "#101014", borderBottom: "1px solid #1e1e2e", display: "flex", alignItems: "center", padding: "0 24px", gap: 12 }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
          ← Back to MinaAI
        </button>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>M</div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>MinaAI</span>
        </div>
      </header>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 20px" }}>

        {/* Profile card */}
        <div style={{ background: "#101014", border: "1px solid #1e1e2e", borderRadius: 20, padding: "32px", marginBottom: 20, textAlign: "center" }}>
          
          {/* Avatar */}
          <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
            {user?.image ? (
              <img src={user.image} alt="Avatar" style={{ width: 80, height: 80, borderRadius: "50%", border: "3px solid #6366f1" }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 28, margin: "0 auto", border: "3px solid rgba(99,102,241,.4)" }}>
                {initials}
              </div>
            )}
            <div style={{ position: "absolute", bottom: 2, right: 2, width: 16, height: 16, borderRadius: "50%", background: "#22c55e", border: "2px solid #101014" }} />
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>{user?.name ?? "User"}</h1>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px" }}>{user?.email}</p>

          <div style={{ display: "inline-flex", gap: 8 }}>
            <span style={{ padding: "4px 12px", background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.3)", borderRadius: 20, fontSize: 12, color: "#818cf8" }}>
              ✨ Pro Member
            </span>
            <span style={{ padding: "4px 12px", background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 20, fontSize: 12, color: "#4ade80" }}>
              ● Active
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total Chats", value: stats.chats, icon: "💬", color: "#6366f1" },
            { label: "Messages Sent", value: stats.messages, icon: "📨", color: "#8b5cf6" },
            { label: "Images Generated", value: stats.imagesGenerated, icon: "🖼️", color: "#a78bfa" },
            { label: "Agent Calls", value: stats.agentsUsed, icon: "🤖", color: "#c4b5fd" },
          ].map(stat => (
            <div key={stat.label} style={{ background: "#101014", border: "1px solid #1e1e2e", borderRadius: 14, padding: "20px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${stat.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{stat.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Account info */}
        <div style={{ background: "#101014", border: "1px solid #1e1e2e", borderRadius: 16, padding: "24px", marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "#f9fafb" }}>Account Details</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Name", value: user?.name ?? "—" },
              { label: "Email", value: user?.email ?? "—" },
              { label: "Member Since", value: "2025" },
              { label: "Plan", value: "Free — Groq Powered" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1e1e2e" }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>{item.label}</span>
                <span style={{ fontSize: 13, color: "#d1d5db", fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => router.push("/")} style={{
            flex: 1, padding: "12px", borderRadius: 10, border: "1px solid #2a2a3a",
            background: "transparent", color: "#d1d5db", fontSize: 14, cursor: "pointer", fontFamily: "inherit",
          }}
            onMouseOver={e => e.currentTarget.style.background = "#1a1a28"}
            onMouseOut={e => e.currentTarget.style.background = "transparent"}
          >
            🏠 Go to Chat
          </button>
          <button onClick={() => signOut({ callbackUrl: "/login" })} style={{
            flex: 1, padding: "12px", borderRadius: 10, border: "1px solid rgba(239,68,68,.3)",
            background: "rgba(239,68,68,.1)", color: "#f87171", fontSize: 14, cursor: "pointer", fontFamily: "inherit",
          }}
            onMouseOver={e => e.currentTarget.style.background = "rgba(239,68,68,.2)"}
            onMouseOut={e => e.currentTarget.style.background = "rgba(239,68,68,.1)"}
          >
            🚪 Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}