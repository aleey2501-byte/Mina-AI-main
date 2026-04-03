// app/login/page.tsx
"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn("credentials", {
      email,
      password,
      isSignUp: String(isSignUp),
      redirect: true,
      callbackUrl: "/chat",
    });
    if (result?.error) alert(result.error);
  };

  return (
    <div style={{ maxWidth: 400, margin: "100px auto", padding: 20, background: "#101014", borderRadius: 16 }}>
      <h1 style={{ color: "#f9fafb", marginBottom: 20 }}>{isSignUp ? "Sign Up" : "Login"}</h1>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
          style={{ width: "100%", padding: 10, marginBottom: 10, background: "#1a1a28", border: "1px solid #2a2a3a", borderRadius: 8, color: "#fff" }} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required
          style={{ width: "100%", padding: 10, marginBottom: 10, background: "#1a1a28", border: "1px solid #2a2a3a", borderRadius: 8, color: "#fff" }} />
        <button type="submit" style={{ width: "100%", padding: 10, background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer" }}>
          {isSignUp ? "Create Account" : "Sign In"}
        </button>
      </form>
      <button onClick={() => setIsSignUp(!isSignUp)} style={{ marginTop: 12, background: "none", border: "none", color: "#818cf8", cursor: "pointer" }}>
        {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign up"}
      </button>
      <hr style={{ margin: "20px 0" }} />
      <button onClick={() => signIn("google", { callbackUrl: "/chat" })} style={{ width: "100%", padding: 10, background: "#fff", border: "none", borderRadius: 8, color: "#000", cursor: "pointer" }}>
        Sign in with Google
      </button>
    </div>
  );
}