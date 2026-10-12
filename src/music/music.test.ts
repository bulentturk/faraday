import { describe, expect, it } from "vitest";
import { SCALES, melodyFromText, totalBeats } from "./melody";
import { renderMidi } from "./midi";
import { renderMelodyRoll } from "./roll";

describe("melodi eşlemesi", () => {
  it("deterministiktir ve harf başına bir ses üretir", () => {
    const a = melodyFromText("Gizli Sır");
    const b = melodyFromText("Gizli Sır");
    expect(a).toEqual(b);
    expect(a.filter((s) => s.midi !== null).length).toBe(8);
  });

  it("sesli harfler uzun, sessizler kısa notadır", () => {
    const [vowel] = melodyFromText("A");
    expect(vowel.beats).toBe(1);
    const [consonant] = melodyFromText("b");
    expect(consonant.beats).toBe(0.5);
  });

  it("noktalama ve boşluk sessizliktir", () => {
    const sounds = melodyFromText("A, B.");
    expect(sounds[1]).toEqual({ midi: null, beats: 0.75 });
    expect(sounds[2]).toEqual({ midi: null, beats: 0.5 });
    expect(sounds[4]).toEqual({ midi: null, beats: 1.5 });
  });

  it("notalar seçilen gamın içindedir", () => {
    for (const scale of SCALES) {
      for (const sound of melodyFromText("TÜRKÇE BİR MESAJ", { scaleId: scale.id })) {
        if (sound.midi === null) continue;
        const rel = sound.midi - 57;
        const degree = ((rel % 12) + 12) % 12;
        expect(scale.intervals).toContain(degree);
      }
    }
  });

  it("200 sesten fazla üretmez", () => {
    const sounds = melodyFromText("a".repeat(500));
    expect(sounds.length).toBe(200);
    expect(totalBeats(sounds)).toBe(200);
  });
});

/** SMF dosyasını çözümleyip yapıyı ve toplam vuruşu doğrular. */
function parseMidi(bytes: Uint8Array): { totalTicks: number; noteOns: number } {
  expect(String.fromCharCode(...bytes.slice(0, 4))).toBe("MThd");
  expect(bytes.slice(4, 8)).toEqual(Uint8Array.from([0, 0, 0, 6]));
  expect(bytes.slice(8, 10)).toEqual(Uint8Array.from([0, 0])); // format 0
  expect(bytes.slice(10, 12)).toEqual(Uint8Array.from([0, 1])); // 1 track
  const division = (bytes[12] << 8) | bytes[13];
  expect(division).toBe(480);

  expect(String.fromCharCode(...bytes.slice(14, 18))).toBe("MTrk");
  const trackLen = ((bytes[18] ?? 0) << 24) | ((bytes[19] ?? 0) << 16) | ((bytes[20] ?? 0) << 8) | (bytes[21] ?? 0);
  expect(22 + trackLen).toBe(bytes.length);

  let i = 22;
  let totalTicks = 0;
  let noteOns = 0;
  while (i < 22 + trackLen) {
    let value = 0;
    for (;;) {
      const byte = bytes[i++];
      value = (value << 7) | (byte & 0x7f);
      if ((byte & 0x80) === 0) break;
    }
    totalTicks += value;

    const status = bytes[i++];
    if (status === 0xff) {
      const type = bytes[i++];
      const len = bytes[i++];
      i += len;
      if (type === 0x2f) break;
    } else if (status === 0xc0) {
      i += 1;
    } else if ((status & 0xf0) === 0x90) {
      noteOns += 1;
      i += 2;
    } else if ((status & 0xf0) === 0x80) {
      i += 2;
    } else {
      throw new Error(`Bilinmeyen MIDI durumu: ${status}`);
    }
  }
  return { totalTicks, noteOns };
}

describe("MIDI üretici", () => {
  it("geçerli bir SMF dosyası üretir", () => {
    const sounds = melodyFromText("MERHABA");
    const midi = renderMidi(sounds, 96);
    const parsed = parseMidi(midi);
    expect(parsed.noteOns).toBe(7);
    expect(parsed.totalTicks).toBe(Math.round(totalBeats(sounds) * 480));
  });

  it("sessizlikler de zamanı ilerletir", () => {
    const sounds = melodyFromText("A. B");
    const parsed = parseMidi(renderMidi(sounds, 120));
    expect(parsed.noteOns).toBe(2);
    expect(parsed.totalTicks).toBe(Math.round(totalBeats(sounds) * 480));
  });

  it("deterministiktir", () => {
    const sounds = melodyFromText("SIR");
    expect(renderMidi(sounds, 96)).toEqual(renderMidi(sounds, 96));
  });
});

describe("piyano rulosu", () => {
  it("SVG üretir", () => {
    const svg = renderMelodyRoll(melodyFromText("MÜHÜRHANE"), 96);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("MELODİ RULOSU");
    expect(svg).toContain("<rect");
  });
});
