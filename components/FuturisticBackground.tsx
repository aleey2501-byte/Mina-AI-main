"use client";

import { useEffect, useRef } from "react";

export default function FuturisticBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resize);

    // PARTICLES
    const particles = Array.from({ length: 60 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2,
    }));

    // CIRCUIT LINES
    const lines = Array.from({ length: 25 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: 100 + Math.random() * 200,
      angle: Math.random() * Math.PI * 2,
      speed: 0.002 + Math.random() * 0.003,
    }));

    let time = 0;
    let animId: number;

    const draw = () => {
      time += 0.01;
      ctx.clearRect(0, 0, width, height);

      // PARTICLES
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(139,92,246,0.6)";
        ctx.fill();
      });

      // CONNECT PARTICLES
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${1 - dist / 120})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // CIRCUIT LINES
      lines.forEach(line => {
        line.angle += line.speed;

        const x2 = line.x + Math.cos(line.angle) * line.length;
        const y2 = line.y + Math.sin(line.angle) * line.length;

        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = "rgba(0,200,255,0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      {/* IMAGE BACKGROUND */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundImage: "url('/ai-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          animation: "slowZoom 25s ease-in-out infinite alternate",
        }}
      />

      {/* DARK OVERLAY */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          background: "rgba(8, 8, 20, 0.85)",
          backdropFilter: "blur(6px)",
        }}
      />

      {/* CANVAS EFFECTS */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* GLOW EFFECT */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          background:
            "radial-gradient(circle at 30% 20%, rgba(139,92,246,0.2), transparent 60%)",
        }}
      />
    </>
  );
}