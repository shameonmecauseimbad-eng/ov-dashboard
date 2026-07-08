"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number; bx: number; by: number };

/**
 * P9 — Reaktives Partikel-Raster als Ambient-Layer hinter allen Widgets:
 * weiße Punkte in einem unsichtbaren Gitter, die der Maus wie ein Kraftfeld
 * ausweichen und sanft zurückfedern. Natives Canvas (keine Lib), sehr subtil,
 * prefers-reduced-motion deaktiviert den Layer komplett.
 */
export default function ParticleField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const gap = 46;
    const radius = 120;
    let width = 0;
    let height = 0;
    let raf = 0;
    let points: Point[] = [];
    const mouse = { x: -9999, y: -9999 };

    const build = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      points = [];
      for (let y = gap / 2; y < height; y += gap) {
        for (let x = gap / 2; x < width; x += gap) {
          points.push({ x, y, bx: x, by: y });
        }
      }
    };

    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of points) {
        const dx = p.bx - mouse.x;
        const dy = p.by - mouse.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        if (dist < radius) {
          const force = (1 - dist / radius) * 14;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }
        p.x += (p.bx - p.x) * 0.08;
        p.y += (p.by - p.y) * 0.08;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    build();
    tick();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onLeave);
    window.addEventListener("resize", build);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      window.removeEventListener("resize", build);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
