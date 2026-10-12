/** Minimal Standard MIDI File (format 0) üretici. */

import type { Sound } from "./melody";

const TICKS_PER_BEAT = 480;

function vlq(value: number): number[] {
  let v = Math.max(0, Math.round(value));
  const out = [v & 0x7f];
  v >>= 7;
  while (v > 0) {
    out.unshift((v & 0x7f) | 0x80);
    v >>= 7;
  }
  return out;
}

function int32be(value: number): number[] {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

export function renderMidi(sounds: readonly Sound[], bpm = 96): Uint8Array<ArrayBuffer> {
  const track: number[] = [];

  const microsPerBeat = Math.round(60_000_000 / bpm);
  track.push(0x00, 0xff, 0x51, 0x03, (microsPerBeat >>> 16) & 0xff, (microsPerBeat >>> 8) & 0xff, microsPerBeat & 0xff);
  track.push(0x00, 0xc0, 0x00); // program: akustik kuyruklu piyano

  let pending = 0;
  for (const sound of sounds) {
    const ticks = Math.round(sound.beats * TICKS_PER_BEAT);
    if (sound.midi === null) {
      pending += ticks;
      continue;
    }
    track.push(...vlq(pending), 0x90, sound.midi & 0x7f, 0x64);
    pending = 0;
    track.push(...vlq(ticks), 0x80, sound.midi & 0x7f, 0x40);
  }

  track.push(...vlq(pending), 0xff, 0x2f, 0x00);

  return Uint8Array.from([
    0x4d, 0x54, 0x68, 0x64, // "MThd"
    0x00, 0x00, 0x00, 0x06,
    0x00, 0x00, // format 0
    0x00, 0x01, // 1 track
    (TICKS_PER_BEAT >>> 8) & 0xff, TICKS_PER_BEAT & 0xff,
    0x4d, 0x54, 0x72, 0x6b, // "MTrk"
    ...int32be(track.length),
    ...track,
  ]);
}
