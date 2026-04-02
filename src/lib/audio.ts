"use client";

type SfxKey = "hover" | "select" | "reveal" | "whoosh";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioContext) return audioContext;

  const Ctx = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;

  audioContext = new Ctx();
  return audioContext;
}

function playTone(ctx: AudioContext, args: { frequency: number; durationMs: number; gain: number; type?: OscillatorType; startInMs?: number }) {
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

function playSfxSynth(key: SfxKey): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  if (key === "hover") {
    playTone(ctx, { frequency: 660, durationMs: 70, gain: 0.03, type: "triangle" });
    return;
  }

  if (key === "select") {
    playTone(ctx, { frequency: 460, durationMs: 90, gain: 0.05, type: "square" });
    playTone(ctx, { frequency: 700, durationMs: 110, gain: 0.04, type: "triangle", startInMs: 70 });
    return;
  }

  if (key === "reveal") {
    playTone(ctx, { frequency: 240, durationMs: 260, gain: 0.04, type: "sawtooth" });
    playTone(ctx, { frequency: 320, durationMs: 300, gain: 0.04, type: "triangle", startInMs: 140 });
    return;
  }

  playTone(ctx, { frequency: 520, durationMs: 180, gain: 0.05, type: "sine" });
  playTone(ctx, { frequency: 260, durationMs: 220, gain: 0.04, type: "triangle", startInMs: 100 });
}

export function playSfx(key: SfxKey): void {
  try {
    playSfxSynth(key);
  } catch {
    // Avoid hard failure if audio subsystem is unavailable.
  }
}
