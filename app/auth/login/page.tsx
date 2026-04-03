// app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; speed: number; opacity: number }>>([]);

  useEffect(() => {
    if (status === "authenticated") router.push("/");
  }, [status, router]);

  // Generate floating particles
  useEffect(() => {
    const p = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 20 + 10,
      opacity: Math.random() * 0.5 + 0.1,
    }));
    setParticles(p);
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        email, password, name,
        isSignUp: isSignUp.toString(),
        redirect: false,
      });
      if (result?.error) setError(result.error);
      else router.push("/");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    setLoading(true);
    signIn("google", { callbackUrl: "/" });
  };

  if (status === "loading") return null;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif", position: "relative", overflow: "hidden" }}>

      {/* Animated background */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {/* Grid lines */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,102,241,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,.05) 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
        
        {/* Glowing orbs */}
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,.15) 0%, transparent 70%)", top: "10%", left: "10%", animation: "float1 8s ease-in-out infinite" }} />
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,.12) 0%, transparent 70%)", bottom: "15%", right: "10%", animation: "float2 10s ease-in-out infinite" }} />
        <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,.1) 0%, transparent 70%)", top: "50%", left: "50%", animation: "float3 6s ease-in-out infinite" }} />

        {/* Floating particles */}
        {particles.map(p => (
          <div key={p.id} style={{
            position: "absolute", borderRadius: "50%",
            width: p.size, height: p.size,
            background: `rgba(99,102,241,${p.opacity})`,
            left: `${p.x}%`, top: `${p.y}%`,
            animation: `floatUp ${p.speed}s linear infinite`,
            animationDelay: `${-Math.random() * 20}s`,
          }} />
        ))}

        {/* Circuit lines */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06 }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="circuit" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <path d="M 0 100 L 50 100 L 50 50 L 150 50 L 150 100 L 200 100" stroke="#6366f1" strokeWidth="1" fill="none"/>
              <path d="M 100 0 L 100 50 M 100 150 L 100 200" stroke="#6366f1" strokeWidth="1" fill="none"/>
              <circle cx="50" cy="100" r="3" fill="#6366f1"/>
              <circle cx="150" cy="100" r="3" fill="#6366f1"/>
              <circle cx="100" cy="50" r="3" fill="#6366f1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit)"/>
        </svg>
      </div>

      {/* Login card */}
      <div style={{ width: "100%", maxWidth: 420, padding: "0 20px", position: "relative", zIndex: 10 }}>
        <div style={{ background: "rgba(16,16,20,.85)", backdropFilter: "blur(20px)", border: "1px solid rgba(99,102,241,.2)", borderRadius: 20, padding: "36px 32px", boxShadow: "0 0 60px rgba(99,102,241,.15)" }}>

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 26, margin: "0 auto 12px", boxShadow: "0 0 30px rgba(99,102,241,.4)" }}>M</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f9fafb", margin: 0 }}>Welcome to MinaAI</h1>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
              {isSignUp ? "Create your account" : "Sign in to continue"}
            </p>
          </div>

          {/* Google button */}
          <button onClick={handleGoogle} disabled={loading} style={{
            width: "100%", padding: "11px 16px", borderRadius: 10,
            background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
            color: "#f9fafb", fontSize: 14, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16,
            fontFamily: "inherit", transition: "all .2s",
          }}
            onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,.1)"}
            onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,.06)"}
          >
            {/* Google SVG icon */}
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.2 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36.5 24 36.5c-5.2 0-9.6-3.5-11.2-8.2l-6.6 5.1C9.8 40 16.4 44 24 44z"/>
              <path fill="#1565C0" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.4l6.2 5.2C41.1 35.5 44 30.1 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: "#1e1e2e" }} />
            <span style={{ fontSize: 12, color: "#4b5563" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#1e1e2e" }} />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {isSignUp && (
              <input
                type="text" placeholder="Your name" value={name}
                onChange={e => setName(e.target.value)} required={isSignUp}
                style={{ padding: "11px 14px", background: "#13131e", border: "1px solid #2a2a3a", borderRadius: 10, color: "#f9fafb", fontSize: 14, outline: "none", fontFamily: "inherit" }}
                onFocus={e => e.target.style.borderColor = "#6366f1"}
                onBlur={e => e.target.style.borderColor = "#2a2a3a"}
              />
            )}
            <input
              type="email" placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)} required
              style={{ padding: "11px 14px", background: "#13131e", border: "1px solid #2a2a3a", borderRadius: 10, color: "#f9fafb", fontSize: 14, outline: "none", fontFamily: "inherit" }}
              onFocus={e => e.target.style.borderColor = "#6366f1"}
              onBlur={e => e.target.style.borderColor = "#2a2a3a"}
            />
            <input
              type="password" placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} required
              style={{ padding: "11px 14px", background: "#13131e", border: "1px solid #2a2a3a", borderRadius: 10, color: "#f9fafb", fontSize: 14, outline: "none", fontFamily: "inherit" }}
              onFocus={e => e.target.style.borderColor = "#6366f1"}
              onBlur={e => e.target.style.borderColor = "#2a2a3a"}
            />

            {error && (
              <div style={{ padding: "8px 12px", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, color: "#f87171", fontSize: 12 }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              padding: "11px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg,#6366f1,#7c3aed)", color: "#fff",
              fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit", opacity: loading ? 0.7 : 1,
              boxShadow: "0 0 20px rgba(99,102,241,.3)", transition: "all .2s",
            }}>
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          {/* Toggle sign up / sign in */}
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#6b7280" }}>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button onClick={() => { setIsSignUp(o => !o); setError(""); }} style={{ background: "none", border: "none", color: "#818cf8", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-30px)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-20px,20px)} }
        @keyframes float3 { 0%,100%{transform:translate(-50%,-50%)} 50%{transform:translate(-40%,-60%)} }
        @keyframes floatUp { 0%{transform:translateY(100vh);opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{transform:translateY(-100px);opacity:0} }
      `}</style>
    </div>
  );
}