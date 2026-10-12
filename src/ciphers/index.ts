/**
 * Tarihi şifreleme modülleri — Türkçe alfabe (29 harf) ile çalışır.
 * Atbash, Sezar, Vigenère ve Scytale.
 */

export const TR_ALPHABET = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ";
export const ALPHABET_SIZE = TR_ALPHABET.length;

export type CipherId = "vigenere" | "atbash" | "sezar" | "scytale";
export type Direction = "encrypt" | "decrypt";

export interface CipherInfo {
  id: CipherId;
  name: string;
  era: string;
  keyKind: "none" | "text" | "number";
  keyLabel: string;
  keyHelp: string;
}

export const CIPHERS: readonly CipherInfo[] = [
  {
    id: "vigenere",
    name: "Vigenère",
    era: "16. yüzyıl İtalya",
    keyKind: "text",
    keyLabel: "Anahtar sözcük",
    keyHelp: "Harflerden oluşan bir anahtar; mesaj boyunca tekrar ederek harfleri kaydırır.",
  },
  {
    id: "atbash",
    name: "Atbash",
    era: "Antik İbrani",
    keyKind: "none",
    keyLabel: "Anahtar gerekmez",
    keyHelp: "Alfabenin ayna görüntüsü: A↔Z, B↔Y… Sır, alfabenin kendisinde.",
  },
  {
    id: "sezar",
    name: "Sezar",
    era: "Antik Roma",
    keyKind: "number",
    keyLabel: "Kaydırma (1–28)",
    keyHelp: "Alfabenin kaç harf kaydırılacağı. Sezar'ın favorisi 3'tü.",
  },
  {
    id: "scytale",
    name: "Scytale",
    era: "Antik Sparta",
    keyKind: "number",
    keyLabel: "Değnek kalınlığı (2–12)",
    keyHelp: "Şeridin sarıldığı değneğin çevresi, harf sayısı olarak. Doğru değnek olmadan mesaj okunmaz.",
  },
];

export function upperTr(ch: string): string {
  return ch.toLocaleUpperCase("tr-TR");
}

export function lowerTr(ch: string): string {
  return ch.toLocaleLowerCase("tr-TR");
}

/** Harfin Türk alfabesindeki indeksi; harf değilse -1. */
export function letterIndex(ch: string): number {
  return TR_ALPHABET.indexOf(upperTr(ch));
}

export function isLetter(ch: string): boolean {
  return letterIndex(ch) >= 0;
}

function shiftLetter(ch: string, shift: number): string {
  const idx = letterIndex(ch);
  if (idx < 0) return ch;
  const nidx = (((idx + shift) % ALPHABET_SIZE) + ALPHABET_SIZE) % ALPHABET_SIZE;
  const out = TR_ALPHABET.charAt(nidx);
  return ch === lowerTr(ch) ? lowerTr(out) : out;
}

function mapLetters(text: string, fn: (ch: string) => string): string {
  let out = "";
  for (const ch of text) out += fn(ch);
  return out;
}

/** Atbash: alfabenin ayna görüntüsü. Anahtarsız, kendi tersiyle çözülür. */
export function atbash(text: string): string {
  return mapLetters(text, (ch) => {
    const idx = letterIndex(ch);
    return idx < 0 ? ch : shiftLetter(ch, ALPHABET_SIZE - 1 - 2 * idx);
  });
}

/** Sezar şifresi: alfabeyi sabit sayıda kaydırır. */
export function sezar(text: string, shift: number): string {
  return mapLetters(text, (ch) => shiftLetter(ch, shift));
}

/** Vigenère şifresi: anahtar sözcük harfleriyle kaydırma yapar. */
export function vigenere(text: string, key: string, direction: Direction = "encrypt"): string {
  const keyLetters = [...key].filter(isLetter);
  if (keyLetters.length === 0) {
    throw new Error("Anahtar en az bir harf içermeli.");
  }
  let k = 0;
  return mapLetters(text, (ch) => {
    if (!isLetter(ch)) return ch;
    const shift = letterIndex(keyLetters[k % keyLetters.length]);
    k += 1;
    return shiftLetter(ch, direction === "encrypt" ? shift : -shift);
  });
}

/**
 * Scytale: metin `columns` genişliğinde satırlara yazılır, sütunlar okunur.
 * Doğru değnek kalınlığı (columns) bilinmeden mesaj çözülemez.
 */
export function scytaleEncrypt(text: string, columns: number): string {
  const chars = [...text];
  const rows = Math.ceil(chars.length / columns);
  const grid: string[][] = Array.from({ length: rows }, () => []);
  chars.forEach((ch, i) => {
    grid[Math.floor(i / columns)].push(ch);
  });
  const out: string[] = [];
  for (let c = 0; c < columns; c++) {
    for (let r = 0; r < rows; r++) {
      const ch = grid[r][c];
      if (ch !== undefined) out.push(ch);
    }
  }
  return out.join("");
}

export function scytaleDecrypt(text: string, columns: number): string {
  const chars = [...text];
  const n = chars.length;
  const rows = Math.ceil(n / columns);
  const grid: (string | undefined)[][] = Array.from({ length: rows }, () =>
    new Array<string | undefined>(columns).fill(undefined),
  );
  let k = 0;
  for (let c = 0; c < columns; c++) {
    for (let r = 0; r < rows; r++) {
      if (r * columns + c < n) grid[r][c] = chars[k++];
    }
  }
  return grid
    .flat()
    .filter((ch): ch is string => ch !== undefined)
    .join("");
}

function parseNumberKey(key: string, min: number, max: number, label: string): number {
  const value = Number.parseInt(key.trim(), 10);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${label} ${min} ile ${max} arasında bir tam sayı olmalı.`);
  }
  return value;
}

export function transform(
  text: string,
  id: CipherId,
  key: string,
  direction: Direction = "encrypt",
): string {
  switch (id) {
    case "atbash":
      return atbash(text);
    case "sezar": {
      const shift = parseNumberKey(key, 1, 28, "Kaydırma");
      return sezar(text, direction === "encrypt" ? shift : -shift);
    }
    case "vigenere":
      return vigenere(text, key, direction);
    case "scytale": {
      const columns = parseNumberKey(key, 2, 12, "Değnek kalınlığı");
      return direction === "encrypt"
        ? scytaleEncrypt(text, columns)
        : scytaleDecrypt(text, columns);
    }
  }
}
