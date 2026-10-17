/**
 * Contextual Notification Audio Service for Jharanai Dairy Farm.
 * Uses the Web Audio API to synthesize subtle, harmonious, gentle chimes
 * without external audio dependencies or network asset latency.
 */

export type SoundType = "success" | "confirm" | "error" | "warning" | "alert" | "info" | "none";

const SOUND_PREF_KEY = "jharanai_notification_sounds_enabled";

let sharedAudioCtx: AudioContext | null = null;
let lastSoundPlayTime = 0;
const MIN_SOUND_INTERVAL_MS = 220; // Prevent rapid-fire overlapping audio distortion

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === "suspended") {
      void sharedAudioCtx.resume().catch(() => {
        // Autoplay policy prevented immediate resume; will resume on user interaction
      });
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

export const soundService = {
  /**
   * Checks whether the user has enabled audio notifications. Default: true.
   */
  isEnabled(): boolean {
    if (typeof window === "undefined") return false;
    const pref = localStorage.getItem(SOUND_PREF_KEY);
    return pref === null ? true : pref === "true";
  },

  /**
   * Sets user sound preference in local storage.
   */
  setEnabled(enabled: boolean): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(SOUND_PREF_KEY, enabled ? "true" : "false");
  },

  /**
   * Plays a subtle, non-intrusive contextual notification sound based on category.
   */
  play(type: SoundType): void {
    if (type === "none" || !this.isEnabled()) return;

    const now = Date.now();
    if (now - lastSoundPlayTime < MIN_SOUND_INTERVAL_MS) {
      return; // Deduplicate / prevent audio stacking
    }
    lastSoundPlayTime = now;

    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const currentTime = ctx.currentTime;

      switch (type) {
        case "success": {
          // Warm harmonic ascending two-tone chime (D5 -> A5)
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = "sine";
          osc1.frequency.setValueAtTime(587.33, currentTime); // D5
          osc1.frequency.exponentialRampToValueAtTime(880.0, currentTime + 0.14); // A5

          osc2.type = "sine";
          osc2.frequency.setValueAtTime(880.0, currentTime + 0.08);

          gain.gain.setValueAtTime(0.001, currentTime);
          gain.gain.linearRampToValueAtTime(0.08, currentTime + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.28);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(currentTime);
          osc2.start(currentTime + 0.08);
          osc1.stop(currentTime + 0.28);
          osc2.stop(currentTime + 0.28);
          break;
        }

        case "confirm": {
          // Soft tactile confirmation bell triad (C5 -> E5 -> G5)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(523.25, currentTime); // C5
          osc.frequency.setValueAtTime(659.25, currentTime + 0.06); // E5
          osc.frequency.setValueAtTime(783.99, currentTime + 0.12); // G5

          gain.gain.setValueAtTime(0.001, currentTime);
          gain.gain.linearRampToValueAtTime(0.07, currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.24);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(currentTime);
          osc.stop(currentTime + 0.24);
          break;
        }

        case "error": {
          // Gentle low descending double tone (Eb4 -> C4) with smooth filter
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          filter.type = "lowpass";
          filter.frequency.setValueAtTime(750, currentTime);

          osc.type = "triangle";
          osc.frequency.setValueAtTime(311.13, currentTime); // Eb4
          osc.frequency.exponentialRampToValueAtTime(261.63, currentTime + 0.16); // C4

          gain.gain.setValueAtTime(0.001, currentTime);
          gain.gain.linearRampToValueAtTime(0.09, currentTime + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.28);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(currentTime);
          osc.stop(currentTime + 0.28);
          break;
        }

        case "warning": {
          // Soft cautionary pulse (A4 double pulse)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(440.0, currentTime);

          gain.gain.setValueAtTime(0.001, currentTime);
          gain.gain.linearRampToValueAtTime(0.07, currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.09);
          gain.gain.linearRampToValueAtTime(0.06, currentTime + 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.22);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(currentTime);
          osc.stop(currentTime + 0.22);
          break;
        }

        case "alert": {
          // High-clarity distinguishable attention chime (G5 -> C6)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(783.99, currentTime); // G5
          osc.frequency.setValueAtTime(1046.5, currentTime + 0.1); // C6

          gain.gain.setValueAtTime(0.001, currentTime);
          gain.gain.linearRampToValueAtTime(0.09, currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.32);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(currentTime);
          osc.stop(currentTime + 0.32);
          break;
        }

        case "info": {
          // Ultra-gentle single blip
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(659.25, currentTime);

          gain.gain.setValueAtTime(0.001, currentTime);
          gain.gain.linearRampToValueAtTime(0.03, currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.12);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(currentTime);
          osc.stop(currentTime + 0.12);
          break;
        }
      }
    } catch {
      // Audio playback fails silently if browser blocks autoplay or Web Audio is unavailable
    }
  },
};
