// Web Audio API Sound Synthesizer for Restaurant Alerts

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Kitchen Alert: Crisp digital restaurant service bell
  public playOrderChime() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(440, now + 0.4);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1320, now); // E6
      osc2.frequency.exponentialRampToValueAtTime(660, now + 0.4);

      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);

      // Repeat second chime pulse
      setTimeout(() => {
        const ctx2 = this.getContext();
        if (!ctx2) return;
        const now2 = ctx2.currentTime;
        const osc = ctx2.createOscillator();
        const gain = ctx2.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, now2); // C6
        gain.gain.setValueAtTime(0.25, now2);
        gain.gain.exponentialRampToValueAtTime(0.001, now2 + 0.4);
        osc.connect(gain);
        gain.connect(ctx2.destination);
        osc.start(now2);
        osc.stop(now2 + 0.4);
      }, 150);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  // Waiter Dispatch: Order Ready double-chime
  public playReadyBell() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [587.33, 880]; // D5, A5
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + index * 0.15;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  // Assistance Request: Urgent 3-tone attention chime
  public playAssistancePing() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const freqs = [784, 659.25, 1046.5]; // G5, E5, C6
      freqs.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + index * 0.12;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.25);
      });
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }
}

export const sounds = new SoundManager();
