/** Şifreli mühür: şifreli metinden deterministik olarak SVG mühür üretir. */

import { hashString, mulberry32 } from "./rng";

export interface SealOptions {
  ciphertext: string;
  cipherName: string;
  hint?: string;
  date?: string;
}

const INK = "#241b12";
const RED = "#8c2f1e";
const PAPER = "#f3e9d7";

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

function ringText(id: string, r: number, text: string, size: number, color: string): string {
  const pathId = `ringpath-${id}`;
  return `<path id="${pathId}" fill="none" d="M 400,400 m ${-r},0 a ${r},${r} 0 1,1 ${r * 2},0 a ${r},${r} 0 1,1 ${-r * 2},0"/>
  <text font-family="Georgia, 'Times New Roman', serif" font-size="${size}" fill="${color}" letter-spacing="3">
    <textPath href="#${pathId}" startOffset="50%" text-anchor="middle">${esc(text)}</textPath>
  </text>`;
}

function sigil(rand: () => number, maxR: number): string {
  const parts: string[] = [];
  const spokes = 7 + Math.floor(rand() * 7);
  for (let i = 0; i < spokes; i++) {
    const angle = (i / spokes) * Math.PI * 2 + rand() * 0.3;
    const r1 = maxR * (0.22 + rand() * 0.12);
    const r2 = maxR * (0.55 + rand() * 0.45);
    parts.push(
      `<line x1="${num(Math.cos(angle) * r1)}" y1="${num(Math.sin(angle) * r1)}" x2="${num(
        Math.cos(angle) * r2,
      )}" y2="${num(Math.sin(angle) * r2)}" transform="translate(400 400)" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`,
    );
  }
  const points = 5 + Math.floor(rand() * 5);
  const poly: string[] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2 + rand() * 0.2;
    const radius = maxR * (0.45 + rand() * 0.3);
    poly.push(`${num(400 + Math.cos(angle) * radius)},${num(400 + Math.sin(angle) * radius)}`);
  }
  parts.push(`<polygon points="${poly.join(" ")}" fill="none" stroke="${RED}" stroke-width="2.4"/>`);
  for (let i = 0; i < 4; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = maxR * (0.35 + rand() * 0.5);
    parts.push(
      `<circle cx="${num(400 + Math.cos(angle) * radius)}" cy="${num(
        400 + Math.sin(angle) * radius,
      )}" r="${num(3 + rand() * 6)}" fill="none" stroke="${INK}" stroke-width="1.6"/>`,
    );
  }
  parts.push(`<circle cx="400" cy="400" r="9" fill="${RED}"/>`);
  return parts.join("\n  ");
}

export function renderSeal(options: SealOptions): string {
  const { ciphertext, cipherName, hint, date } = options;
  const rand = mulberry32(hashString(`${ciphertext}|${cipherName}|${hint ?? ""}`));

  const ring =
    ciphertext.trim() === ""
      ? "MESAJ BEKLENİYOR · MÜHÜRHANE · "
      : ciphertext.toLocaleUpperCase("tr-TR").replace(/\s+/g, " ");
  const ringTextShort = ring.length > 150 ? `${ring.slice(0, 149)}…` : ring;

  const metaParts = [cipherName, date ?? "", hint ? `ipucu: ${hint}` : ""].filter((p) => p !== "");
  const meta = metaParts.join(" · ").toLocaleUpperCase("tr-TR");

  const dots: string[] = [];
  for (let i = 0; i < 72; i++) {
    const angle = (i / 72) * Math.PI * 2;
    dots.push(
      `<circle cx="${num(400 + Math.cos(angle) * 364)}" cy="${num(400 + Math.sin(angle) * 364)}" r="2.4" fill="${INK}" opacity="0.75"/>`,
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="${PAPER}"/>
  <circle cx="400" cy="400" r="374" fill="none" stroke="${INK}" stroke-width="5"/>
  <circle cx="400" cy="400" r="352" fill="none" stroke="${INK}" stroke-width="1.5"/>
  ${dots.join("\n  ")}
  ${ringText("outer", 312, ringTextShort, 21, INK)}
  <circle cx="400" cy="400" r="272" fill="none" stroke="${RED}" stroke-width="2"/>
  ${ringText("inner", 240, meta, 15, RED)}
  <circle cx="400" cy="400" r="196" fill="none" stroke="${INK}" stroke-width="1.2" opacity="0.6"/>
  ${sigil(rand, 170)}
  <text x="400" y="672" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="17" letter-spacing="6" fill="${INK}">MÜHÜRHANE</text>
</svg>`;
}
