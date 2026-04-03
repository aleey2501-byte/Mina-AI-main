// components/TechBackground.tsx
"use client";

import { useEffect, useRef } from "react";

export default function TechBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);

    let animId: number;
    let time = 0;

    const draw = () => {
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw moving gradient circles
      const x1 = canvas.width / 2 + Math.sin(time) * 150;
      const y1 = canvas.height / 2 + Math.cos(time * 0.6) * 100;
      const grad1 = ctx.createRadialGradient(x1, y1, 30, x1, y1, 250);
      grad1.addColorStop(0, "rgba(99,102,241,0.2)");
      grad1.addColorStop(1, "rgba(99,102,241,0)");
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const x2 = canvas.width / 3 + Math.cos(time * 0.8) * 80;
      const y2 = canvas.height / 3 + Math.sin(time * 0.9) * 70;
      const grad2 = ctx.createRadialGradient(x2, y2, 20, x2, y2, 200);
      grad2.addColorStop(0, "rgba(139,92,246,0.15)");
      grad2.addColorStop(1, "rgba(139,92,246,0)");
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.7,        // visible but not overwhelming
      }}
    />
  );
}