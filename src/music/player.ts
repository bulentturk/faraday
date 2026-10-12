/** Web Audio ile melodi çalma. */

import type { Sound } from "./melody";

export class MelodyPlayer {
  private ctx: AudioContext | null = null;
  private nodes: OscillatorNode[] = [];
  private endTimer: number | null = null;

  play(sounds: readonly Sound[], bpm: number, onEnd?: () => void): void {
    this.stop();
    const ctx = this.ctx ?? new AudioContext();
    this.ctx = ctx;
    void ctx.resume();

    const beatSeconds = 60 / bpm;
    let t = ctx.currentTime + 0.05;
    for (const sound of sounds) {
      const duration = sound.beats * beatSeconds;
      if (sound.midi !== null) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = 440 * Math.pow(2, (sound.midi - 69) / 12);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration * 0.92);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + duration);
        this.nodes.push(osc);
      }
      t += duration;
    }

    this.endTimer = window.setTimeout(
      () => {
        this.stop();
        onEnd?.();
      },
      (t - ctx.currentTime) * 1000 + 150,
    );
  }

  stop(): void {
    if (this.endTimer !== null) {
      window.clearTimeout(this.endTimer);
      this.endTimer = null;
    }
    for (const node of this.nodes) {
      try {
        node.stop();
      } catch {
        // zaten durmuş olabilir
      }
    }
    this.nodes = [];
  }
}
