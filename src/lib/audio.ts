"use client";

type SfxKey = "hover" | "select" | "reveal" | "whoosh";

const SFX_PATHS: Record<SfxKey, string> = {
  hover: "/sfx/hover.mp3",
  select: "/sfx/select.mp3",
  reveal: "/sfx/reveal.mp3",
  whoosh: "/sfx/whoosh.mp3",
};

const soundCache = new Map<SfxKey, HTMLAudioElement>();

function getSound(key: SfxKey): HTMLAudioElement {
  const cached = soundCache.get(key);
  if (cached) return cached;

  const sound = new Audio(SFX_PATHS[key]);
  sound.preload = "auto";
  sound.volume = key === "reveal" ? 0.8 : 0.45;

  soundCache.set(key, sound);
  return sound;
}

export function playSfx(key: SfxKey): void {
  try {
    const sound = getSound(key);
    sound.currentTime = 0;
    void sound.play();
  } catch {
    // Avoid hard failure if audio subsystem is unavailable.
  }
}
