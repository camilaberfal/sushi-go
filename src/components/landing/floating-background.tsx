"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { playSfx } from "@/lib/audio";

import gyozaImg from "@/app/assets/illustrations/gyoza-illustration.png";
import maki1Img from "@/app/assets/illustrations/maki-illustration-x1.png";
import maki2Img from "@/app/assets/illustrations/maki-illustration-x2.png";
import maki3Img from "@/app/assets/illustrations/maki-illustration-x3.png";
import nigiriCalamarImg from "@/app/assets/illustrations/nigiri-calamar-illustration.png";
import nigiriHuevoImg from "@/app/assets/illustrations/nigiri-huevo-illustration.png";
import nigiriSalmonImg from "@/app/assets/illustrations/nigiri-salmon-illustration.png";
import palillosImg from "@/app/assets/illustrations/palillos-illustration.png";
import pudinImg from "@/app/assets/illustrations/pudin-illustration.png";
import sashimiImg from "@/app/assets/illustrations/sashimi-illustration.png";
import tempuraImg from "@/app/assets/illustrations/tempura-illustration.png";
import wasabiImg from "@/app/assets/illustrations/wasabi-illustration.png";

const images = [
  gyozaImg,
  maki1Img,
  maki2Img,
  maki3Img,
  nigiriCalamarImg,
  nigiriHuevoImg,
  nigiriSalmonImg,
  palillosImg,
  pudinImg,
  sashimiImg,
  tempuraImg,
  wasabiImg,
];

type FloatingItem = {
  id: number;
  img: any;
  left: string;
  top: string;
  duration: number;
  driftDuration: number;
  scale: number;
  baseRotate: number;
  moveX: number;
  moveY: number;
};

export function FloatingBackground() {
  const [items, setItems] = useState<FloatingItem[]>([]);

  useEffect(() => {
    // Generate scattered items far across the screen
    const generated: FloatingItem[] = [];
    const cols = 8;
    const rows = 5;
    const count = cols * rows;
    const xStep = 100 / cols;
    const yStep = 100 / rows;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const imgIndex = (i * 7 + 13) % images.length;
      const img = images[imgIndex];
      const jitterX = (Math.random() * 20) - 10;
      const jitterY = (Math.random() * 20) - 10;
      const left = `${(col + 0.5) * xStep + jitterX}%`;
      const top = `${(row + 0.5) * yStep + jitterY}%`;
      const duration = Math.random() * 40 + 60;
      const driftDuration = Math.random() * 30 + 40;
      const scale = Math.random() * 0.3 + 0.4;
      const baseRotate = Math.floor(Math.random() * 360);
      const moveX = (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 300 + 100);
      const moveY = (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 300 + 100);

      generated.push({
        id: i,
        img,
        left,
        top,
        duration,
        driftDuration,
        scale,
        baseRotate,
        moveX,
        moveY,
      });
    }

    setItems(generated);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[#a881f3] mix-blend-color-dodge opacity-[0.05]" />
      {items.map((item) => (
        <motion.div
          key={item.id}
          onMouseEnter={() => playSfx("hover")}
          className="group absolute opacity-40 pointer-events-auto transition-all duration-500 ease-out hover:z-50 hover:opacity-100"
          style={{
            left: item.left,
            top: item.top,
          }}
          animate={{
            x: [0, item.moveX, item.moveX * -0.5, 0],
            y: [0, item.moveY * -0.5, item.moveY, 0],
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <motion.div
            className="transition-transform duration-[2000ms] ease-out group-hover:scale-[1.3] group-hover:drop-shadow-[0_0_30px_rgba(255,255,255,0.7)] cursor-pointer"
            animate={{ rotate: [item.baseRotate, item.baseRotate + 360 * (Math.random() > 0.5 ? 1 : -1)] }}
            transition={{
              duration: item.driftDuration,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{ transform: `translate(-50%, -50%) scale(${item.scale})` }}
          >
            <Image src={item.img} alt="" width={96} height={96} className="select-none" />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
