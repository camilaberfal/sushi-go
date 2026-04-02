"use client";

import { useEffect, useRef } from "react";
import { Howl } from "howler";

// Fallback synth implementation
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioContext) return audioContext;
  const Ctx = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  audioContext = new Ctx();
  return audioContext;
}

function playTone(args: { frequency: number; durationMs: number; gain: number; type?: OscillatorType; startInMs?: number }) {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  const now = ctx.currentTime + (args.startInMs ?? 0) / 1000;
  const durationSec = args.durationMs / 1000;
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  osc.type = args.type ?? "sine";
  osc.frequency.setValueAtTime(args.frequency, now);
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(args.gain, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
  
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + durationSec + 0.02);
}

function synthHover() { playTone({ frequency: 660, durationMs: 70, gain: 0.03, type: "triangle" }); }
function synthSelect() {
  playTone({ frequency: 460, durationMs: 90, gain: 0.05, type: "square" });
  playTone({ frequency: 700, durationMs: 110, gain: 0.04, type: "triangle", startInMs: 70 });
}
function synthReveal() {
  playTone({ frequency: 240, durationMs: 260, gain: 0.04, type: "sawtooth" });
  playTone({ frequency: 320, durationMs: 300, gain: 0.04, type: "triangle", startInMs: 140 });
}
function synthWhoosh() {
  playTone({ frequency: 520, durationMs: 180, gain: 0.05, type: "sine" });
  playTone({ frequency: 260, durationMs: 220, gain: 0.04, type: "triangle", startInMs: 100 });
}
function synthTick() { playTone({ frequency: 800, durationMs: 30, gain: 0.02, type: "sine" }); }

// Howler hook handling both real assets (if added by user) and fallback synth
export function useSoundEffects() {
  const sounds = useRef<{ [key: string]: Howl }>({});
  const waitingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // By default we use synth sounds to avoid 404 noise when /public/sfx assets are absent.
    // To enable file-based SFX later, set NEXT_PUBLIC_ENABLE_SFX_FILES=true.
    const enableFileSfx = process.env.NEXT_PUBLIC_ENABLE_SFX_FILES === "true";

    if (enableFileSfx) {
      sounds.current = {
        card_hover: new Howl({ src: ["/sfx/card_hover.mp3"], volume: 0.2, preload: true, onloaderror: () => { /* fallback */ } }),
        card_select: new Howl({ src: ["/sfx/card_select.mp3"], volume: 0.4, preload: true, onloaderror: () => { /* fallback */ } }),
        card_reveal: new Howl({ src: ["/sfx/card_reveal.mp3"], volume: 0.5, preload: true, onloaderror: () => { /* fallback */ } }),
        hand_rotate: new Howl({ src: ["/sfx/hand_rotate.mp3"], volume: 0.3, preload: true, onloaderror: () => { /* fallback */ } }),
        score_tick: new Howl({ src: ["/sfx/score_tick.mp3"], volume: 0.2, preload: true, onloaderror: () => { /* fallback */ } }),
        waiting: new Howl({ src: ["/sfx/waiting_ambience.mp3"], volume: 0.1, loop: true, preload: true, onloaderror: () => { /* fallback */ } }),
      };
    }

    return () => {
      if (waitingIntervalRef.current) {
        window.clearInterval(waitingIntervalRef.current);
      }
      Object.values(sounds.current).forEach((howl) => howl.unload());
    };
  }, []);

  const playWithFallback = (howlKey: string, fallback: () => void) => {
    const howl = sounds.current[howlKey];
    if (howl && howl.state() === "loaded") {
      howl.play();
    } else {
      fallback();
    }
  };

  return {
    playHover: () => playWithFallback("card_hover", synthHover),
    playSelect: () => playWithFallback("card_select", synthSelect),
    playReveal: () => playWithFallback("card_reveal", synthReveal),
    playRotate: () => playWithFallback("hand_rotate", synthWhoosh),
    playTick: () => playWithFallback("score_tick", synthTick),
    playWaiting: () => {
      const wait = sounds.current.waiting;
      if (wait && wait.state() === "loaded" && !wait.playing()) {
        wait.fade(0, 0.1, 1000);
        wait.play();
        return;
      }

      // Fallback: soft periodic synth pulse while waiting.
      if (!waitingIntervalRef.current) {
        synthTick();
        waitingIntervalRef.current = window.setInterval(() => {
          synthTick();
        }, 1000);
      }
    },
    stopWaiting: () => {
      const wait = sounds.current.waiting;
      if (wait && wait.playing()) {
        wait.fade(0.1, 0, 500);
        setTimeout(() => wait.stop(), 500);
      }

      if (waitingIntervalRef.current) {
        window.clearInterval(waitingIntervalRef.current);
        waitingIntervalRef.current = null;
      }
    },
  };
}
