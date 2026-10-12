/** Piyano rulosu görünümü: melodinin SVG ile görselleştirmesi. */

import type { Sound } from "./melody";
import { totalBeats } from "./melody";

const INK = "#241b12";
const RED = "#b8613a";
const GOLD = "#c9a227";
const PAPER = "#f7efdd";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function num(n: number): string {
  return n.toFixed(1);
}

export function renderMelodyRoll(sounds: readonly Sound[], bpm: number): string {
  const pxPerBeat = 42;
  const noteH = 16;
  const margin = 30;
  const top = 84;

  const pitches = sounds.flatMap((s) => (s.midi === null ? [] : [s.midi]));
  const min = pitches.length > 0 ? Math.min(...pitches) : 57;
  const max = pitches.length > 0 ? Math.max(...pitches) : min + 12;

  const beats = Math.max(1, totalBeats(sounds));
  const width = margin * 2 + beats * pxPerBeat;
  const height = top + (max - min + 1) * noteH + 56;

  const parts: string[] = [];
  for (let b = 0; b <= Math.ceil(beats); b++) {
    const x = margin + b * pxPerBeat;
    parts.push(
      `<line x1="${num(x)}" y1="${top - 12}" x2="${num(x)}" y2="${num(top + (max - min + 1) * noteH)}" stroke="${INK}" stroke-width="${b % 4 === 0 ? 1 : 0.4}" opacity="0.25"/>`,
    );
  }

  let cursor = 0;
  sounds.forEach((sound, i) => {
    const x = margin + cursor * pxPerBeat;
    const w = Math.max(4, sound.beats * pxPerBeat - 3);
    if (sound.midi !== null) {
      const y = top + (max - sound.midi) * noteH;
      parts.push(
        `<rect x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${noteH - 3}" rx="3" fill="${i % 2 === 0 ? RED : GOLD}" opacity="0.9"/>`,
      );
    }
    cursor += sound.beats;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${num(width)} ${num(height)}" width="${num(width)}" height="${num(height)}">
  <rect width="${num(width)}" height="${num(height)}" fill="${PAPER}"/>
  <text x="${margin}" y="34" font-family="Georgia, 'Times New Roman', serif" font-size="22" letter-spacing="4" fill="${INK}">MELODİ RULOSU</text>
  <text x="${margin}" y="60" font-family="Georgia, 'Times New Roman', serif" font-size="14" fill="${RED}">${sounds.length} ses · ${num(beats)} vuruş · ${bpm} BPM · en düşük ${esc(String(min))} / en yüksek ${esc(String(max))}</text>
  ${parts.join("\n  ")}
  <text x="${margin}" y="${num(height - 18)}" font-family="Georgia, 'Times New Roman', serif" font-size="12" letter-spacing="3" fill="${INK}" opacity="0.6">MÜHÜRHANE · müzik modülü</text>
</svg>`;
}
