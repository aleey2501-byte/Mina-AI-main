// components/SplashScreen.tsx
"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "radial-gradient(circle at center, #0a0a0f 0%, #050508 100%)",
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Dark glass card to make text pop */}
      <div
        style={{
          background: "rgba(10, 10, 15, 0.7)",
          backdropFilter: "blur(12px)",
          borderRadius: 32,
          padding: "40px 60px",
          textAlign: "center",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Animated logo */}
        <div style={{ position: "relative", marginBottom: 32, display: "inline-block" }}>
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: 28,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: 44,
              boxShadow: "0 0 60px rgba(99, 102, 241, 0.8)",
              animation: "pulse 1.8s ease-in-out infinite",
            }}
          >
            M
          </div>
          {/* Rotating ring */}
          <div
            style={{
              position: "absolute",
              inset: -12,
              borderRadius: 40,
              border: "2px solid transparent",
              borderTopColor: "#a78bfa",
              borderRightColor: "#6366f1",
              animation: "spin 1.2s linear infinite",
            }}
          />
        </div>

        {/* Title with strong contrast */}
        <h1
          style={{
            fontSize: 36,
            fontWeight: 800,
            background: "linear-gradient(135deg, #fff, #c7d2fe)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            marginBottom: 12,
            letterSpacing: "-0.5px",
          }}
        >
          MinaAI
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 16,
            color: "#a5b4fc",
            marginBottom: 40,
            fontWeight: 500,
            textShadow: "0 0 8px rgba(99,102,241,0.5)",
          }}
        >
          Multi-Agent Intelligence System
        </p>

        {/* Progress bar */}
        <div
          style={{
            width: 280,
            height: 4,
            background: "rgba(255,255,255,0.1)",
            borderRadius: 4,
            overflow: "hidden",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              height: "100%",
              width: "100%",
              background: "linear-gradient(90deg, #6366f1, #c084fc, #6366f1)",
              animation: "progress 2s ease-in-out infinite",
            }}
          />
        </div>

        {/* Loading dots */}
        <div style={{ display: "flex", gap: 12, marginTop: 32, justifyContent: "center" }}>
          {["#818cf8", "#a78bfa", "#c084fc"].map((c, i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: c,
                animation: `bounce 1.4s ${i * 0.2}s ease-in-out infinite`,
                boxShadow: "0 0 6px currentColor",
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            box-shadow: 0 0 60px rgba(99, 102, 241, 0.8);
          }
          50% {
            box-shadow: 0 0 90px rgba(99, 102, 241, 1);
          }
        }
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-14px);
          }
        }
      `}</style>
    </div>
  );
}