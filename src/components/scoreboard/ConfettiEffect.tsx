"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#ffffff"];
const CONFETTI_COUNT = 20;

type ConfettiParticle = {
  id: number;
  x: number;
  launchY: number;
  fallY: number;
  color: string;
  size: number;
  rotation: number;
  duration: number;
};

export function ConfettiEffect() {
  const shouldReduceMotion = useReducedMotion();
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);

  useEffect(() => {
    if (shouldReduceMotion) {
      setParticles([]);
      return;
    }

    const newParticles: ConfettiParticle[] = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * 220 - 110,
      launchY: -(Math.random() * 150 + 80),
      fallY: Math.random() * 250 + 140,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 7 + 6,
      rotation: Math.random() * 360,
      duration: Math.random() * 0.5 + 1.5,
    }));

    setParticles(newParticles);
  }, [shouldReduceMotion]);

  if (shouldReduceMotion || particles.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-visible">
      {particles.map((p) => (
        <motion.svg
          key={p.id}
          viewBox="0 0 12 12"
          initial={{ opacity: 1, scale: 0, x: 0, y: 0, rotate: 0 }}
          animate={{
            opacity: [1, 1, 0],
            scale: [0, 1.1, 1],
            x: p.x,
            y: [0, p.launchY, p.fallY],
            rotate: p.rotation + 360,
          }}
          transition={{
            duration: p.duration,
            ease: "easeOut",
            times: [0, 0.35, 1],
          }}
          className="absolute left-1/2 top-1/2"
          style={{
            width: p.size,
            height: p.size,
          }}
        >
          <rect x="1" y="1" width="10" height="10" rx="2" fill={p.color} />
        </motion.svg>
      ))}
    </div>
  );
}
