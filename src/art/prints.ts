/** Baskıya hazır fiziksel şifre aletleri: scytale şeridi ve Alberti şifre diski. */

import { TR_ALPHABET, letterIndex } from "../ciphers";
import { hashString, mulberry32 } from "./rng";

const INK = "#241b12";
const RED = "#8c2f1e";
const PAPER = "#f7efdd";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function num(n: number): string {
  return n.toFixed(1);
}

/** Scytale şeridi: şifreli metin hücrelere dizilir, her `rod` harfte kıvrım çizgisi. */
export function renderScytaleStrip(ciphertext: string, rod: number): string {
  const chars = [...ciphertext.toLocaleUpperCase("tr-TR")];
  const perRow = 42;
  const cellW = 36;
  const cellH = 58;
  const margin = 36;
  const header = 96;
  const rows = Math.max(1, Math.ceil(chars.length / perRow));
  const width = margin * 2 + perRow * cellW;
  const height = margin * 2 + header + rows * cellH + 34;

  const cells: string[] = [];
  chars.forEach((ch, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const x = margin + col * cellW;
    const y = margin + header + row * cellH;
    cells.push(
      `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="none" stroke="${INK}" stroke-width="0.6" opacity="0.35"/>`,
    );
    cells.push(
      `<text x="${num(x + cellW / 2)}" y="${num(y + cellH / 2 + 8)}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="24" fill="${INK}">${esc(
        ch,
      )}</text>`,
    );
    if ((i + 1) % rod === 0) {
      cells.push(
        `<line x1="${x + cellW}" y1="${y}" x2="${x + cellW}" y2="${y + cellH}" stroke="${RED}" stroke-width="2" stroke-dasharray="6 5"/>`,
      );
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="${PAPER}"/>
  <text x="${margin}" y="${margin + 26}" font-family="Georgia, 'Times New Roman', serif" font-size="24" letter-spacing="4" fill="${INK}">SCYTALE ŞERİDİ</text>
  <text x="${margin}" y="${margin + 58}" font-family="Georgia, 'Times New Roman', serif" font-size="16" fill="${RED}">Değnek kalınlığı: ${rod} harf — kes, değneğe sar; kırmızı çizgiler değneğin etrafına denk gelir.</text>
  <text x="${margin}" y="${margin + 82}" font-family="Georgia, 'Times New Roman', serif" font-size="13" fill="${INK}" opacity="0.7">Yanlış kalınlıktaki değnek metni anlamsızlaştırır. Doğru değnek mesajı açar.</text>
  ${cells.join("\n  ")}
  <text x="${margin}" y="${num(height - 14)}" font-family="Georgia, 'Times New Roman', serif" font-size="12" letter-spacing="3" fill="${INK}" opacity="0.6">MÜHÜRHANE · scytale</text>
</svg>`;
}

/** Alberti şifre diski: dış sabit alfabe, iç anahtarla döndürülmüş karışık alfabe. */
export function renderAlbertiDisk(key: string): string {
  const size = TR_ALPHABET.length;
  const step = 360 / size;
  const seedText = key.trim() === "" ? "MÜHÜRHANE" : key;
  const rand = mulberry32(hashString(seedText));

  const mixed = [...TR_ALPHABET];
  for (let i = mixed.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = mixed[i];
    mixed[i] = mixed[j];
    mixed[j] = tmp;
  }

  const firstLetter = [...key].find((ch) => letterIndex(ch) >= 0);
  const offset = firstLetter === undefined ? 0 : letterIndex(firstLetter);
  const offsetDeg = offset * step;

  const outerLetters: string[] = [];
  const innerLetters: string[] = [];
  for (let i = 0; i < size; i++) {
    const deg = i * step;
    outerLetters.push(
      `<text x="400" y="72" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="26" fill="${INK}" transform="rotate(${num(deg)} 400 400)">${esc(
        TR_ALPHABET.charAt(i),
      )}</text>`,
    );
    innerLetters.push(
      `<text x="400" y="188" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="24" fill="${RED}" transform="rotate(${num(deg)} 400 400)">${esc(
        mixed[i],
      )}</text>`,
    );
  }

  const pairTopOuter = TR_ALPHABET.charAt(offset);
  const pairTopInner = mixed[0];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="${PAPER}"/>
  <text x="400" y="38" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="20" letter-spacing="5" fill="${INK}">ALBERTİ ŞİFRE DİSKİ</text>
  <circle cx="400" cy="400" r="382" fill="none" stroke="${INK}" stroke-width="1.5" stroke-dasharray="9 7"/>
  <circle cx="400" cy="400" r="352" fill="none" stroke="${INK}" stroke-width="2.5"/>
  <circle cx="400" cy="400" r="288" fill="none" stroke="${INK}" stroke-width="2.5"/>
  ${outerLetters.join("\n  ")}
  <g transform="rotate(${num(offsetDeg)} 400 400)">
    <circle cx="400" cy="400" r="252" fill="${PAPER}" stroke="${RED}" stroke-width="1.5" stroke-dasharray="9 7"/>
    ${innerLetters.join("\n  ")}
  </g>
  <polygon points="400,54 386,26 414,26" fill="${RED}"/>
  <circle cx="400" cy="400" r="46" fill="none" stroke="${INK}" stroke-width="1.5"/>
  <line x1="378" y1="400" x2="422" y2="400" stroke="${INK}" stroke-width="1.2"/>
  <line x1="400" y1="378" x2="400" y2="422" stroke="${INK}" stroke-width="1.2"/>
  <text x="400" y="700" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="17" fill="${INK}">İç diski kes ve ${esc(
    pairTopInner,
  )} harfini A'nın altına getir (anahtar: ${esc(seedText.toLocaleUpperCase("tr-TR"))})</text>
  <text x="400" y="728" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="14" fill="${RED}">Tepe eşleşmesi: dış ${esc(
    pairTopOuter,
  )} ↔ iç ${esc(pairTopInner)} · noktayı ortala, iğneyle sabitle</text>
  <text x="400" y="772" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="12" letter-spacing="3" fill="${INK}" opacity="0.6">MÜHÜRHANE · alberti</text>
</svg>`;
}
