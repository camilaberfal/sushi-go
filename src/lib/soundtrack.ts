"use client";

export type SoundtrackLevel = 0 | 1 | 2 | 3;

const SOUNDTRACK_STORAGE_KEY = "sushi-go:soundtrack-level";
const LEVEL_TO_VOLUME: Record<SoundtrackLevel, number> = {
  0: 0,
  1: 0.22,
  2: 0.42,
  3: 0.62,
};

let soundtrackAudio: HTMLAudioElement | null = null;
let listenersAttached = false;
let currentLevel: SoundtrackLevel = 2;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readStoredLevel(): SoundtrackLevel {
  if (!isBrowser()) return 2;
  const raw = window.localStorage.getItem(SOUNDTRACK_STORAGE_KEY);
  const parsed = Number(raw);
  if (parsed === 0 || parsed === 1 || parsed === 2 || parsed === 3) return parsed;
  return 2;
}

function ensureAudio(): HTMLAudioElement | null {
  if (!isBrowser()) return null;
  if (soundtrackAudio) return soundtrackAudio;

  const audio = new Audio("/soundtrack.mp3");
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = LEVEL_TO_VOLUME[currentLevel];
  soundtrackAudio = audio;
  return soundtrackAudio;
}

function tryPlay(): void {
  const audio = ensureAudio();
  if (!audio) return;
  if (currentLevel === 0) return;

  void audio.play().catch(() => {
    // Browser autoplay policy can block until first user gesture.
  });
}

function attachUnlockListeners(): void {
  if (!isBrowser() || listenersAttached) return;

  const unlock = () => {
    tryPlay();
  };

  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("keydown", unlock);
  listenersAttached = true;
}

export function initSoundtrack(): void {
  currentLevel = readStoredLevel();
  const audio = ensureAudio();
  if (!audio) return;

  audio.volume = LEVEL_TO_VOLUME[currentLevel];
  attachUnlockListeners();
  tryPlay();
}

export function getSoundtrackLevel(): SoundtrackLevel {
  if (isBrowser()) {
    currentLevel = readStoredLevel();
  }
  return currentLevel;
}

export function setSoundtrackLevel(level: SoundtrackLevel): void {
  currentLevel = level;

  if (isBrowser()) {
    window.localStorage.setItem(SOUNDTRACK_STORAGE_KEY, String(level));
  }

  const audio = ensureAudio();
  if (!audio) return;

  audio.volume = LEVEL_TO_VOLUME[level];
  if (level === 0) {
    audio.pause();
    return;
  }

  tryPlay();
}

export function cycleSoundtrackLevel(): SoundtrackLevel {
  const next = ((getSoundtrackLevel() + 1) % 4) as SoundtrackLevel;
  setSoundtrackLevel(next);
  return next;
}
