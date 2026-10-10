"use client";

// Shared notification sound utility. Uses Web Audio API so no binary
// asset is required, works offline, and respects a per-user mute toggle
// persisted in localStorage.

const STORAGE_KEY = "saffron_notif_sound_enabled";

let audioCtx = null;
let unlocked = false;
let lastPlayAt = 0;

function getAudioCtx() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) {
    try {
      audioCtx = new AC();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Must be called from a user gesture at least once (browsers block
// autoplay otherwise). Layouts call this on first click/keydown.
export function unlockNotificationSound() {
  if (unlocked || typeof window === "undefined") return;
  unlocked = true;
  try {
    getAudioCtx();
  } catch {}
}

export function isNotificationSoundEnabled() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === "1";
  } catch {
    return true;
  }
}

export function setNotificationSoundEnabled(enabled) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch {}
}

function tone(ctx, { freq, start, duration, type = "sine", gain = 0.18 }) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
  g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration + 0.05);
}

export function playNotificationSound() {
  try {
    if (typeof window === "undefined") return;
    if (!isNotificationSoundEnabled()) return;
    // Throttle: a single incoming message fans out to several SSE events
    // (chat-message + notification + counts). Only ding once per burst.
    const now = Date.now();
    if (now - lastPlayAt < 1500) return;
    lastPlayAt = now;
    const ctx = getAudioCtx();
    if (!ctx) return;
    // Pleasant two-note "ding-dong" chime
    tone(ctx, { freq: 880, start: 0, duration: 0.28, type: "sine", gain: 0.16 });
    tone(ctx, { freq: 1174.66, start: 0.14, duration: 0.4, type: "sine", gain: 0.14 });
  } catch {
    // never break UI because of sound
  }
}
