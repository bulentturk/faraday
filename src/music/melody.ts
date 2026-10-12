/**
 * Müzikal kriptografi: metni notalara çevirir.
 * Harf → gam adımı; sesli harfler uzun, sessizler kısa notadır.
 * Boşluklar ve noktalama sessizliktir — ritim dilin kendisinden gelir.
 */

import { isLetter, letterIndex, upperTr } from "../ciphers";

export interface Scale {
  id: string;
  name: string;
  /** Oktav içi yarım ton adımları. */
  intervals: readonly number[];
}

export const SCALES: readonly Scale[] = [
  { id: "minor-pentatonic", name: "Minör Pentatonik", intervals: [0, 3, 5, 7, 10] },
  { id: "dorian", name: "Dorik", intervals: [0, 2, 3, 5, 7, 9, 10] },
  { id: "chromatic", name: "Kromatik", intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
];

export interface Sound {
  /** MIDI nota numarası; null = sessizlik. */
  midi: number | null;
  /** Süre, vuruş cinsinden. */
  beats: number;
}

export interface MelodyOptions {
  scaleId?: string;
  /** Kök nota (MIDI). Varsayılan 57 = A3. */
  rootMidi?: number;
}

export const VOWELS = "AEIİOÖUÜ";

const MAX_SOUNDS = 200;

function soundFor(ch: string, scale: Scale, root: number): Sound {
  const up = upperTr(ch);
  if (isLetter(up)) {
    const span = scale.intervals.length * 2;
    const pos = letterIndex(up) % span;
    const octave = Math.floor(pos / scale.intervals.length);
    const degree = pos % scale.intervals.length;
    return {
      midi: root + octave * 12 + scale.intervals[degree],
      beats: VOWELS.includes(up) ? 1 : 0.5,
    };
  }
  if (".!?…".includes(ch)) return { midi: null, beats: 1.5 };
  if (",;:—-".includes(ch)) return { midi: null, beats: 0.75 };
  if (/\s/.test(ch)) return { midi: null, beats: 0.5 };
  return { midi: null, beats: 0.25 };
}

export function melodyFromText(text: string, options: MelodyOptions = {}): Sound[] {
  const scale = SCALES.find((s) => s.id === options.scaleId) ?? SCALES[0];
  const root = options.rootMidi ?? 57;
  const sounds: Sound[] = [];
  for (const ch of text) {
    if (sounds.length >= MAX_SOUNDS) break;
    sounds.push(soundFor(ch, scale, root));
  }
  return sounds;
}

export function totalBeats(sounds: readonly Sound[]): number {
  return sounds.reduce((sum, s) => sum + s.beats, 0);
}
