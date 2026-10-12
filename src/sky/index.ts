/**
 * Gökyüzü Anahtarı: doğum tarihinden burç, element ve yönetici gezegen üretir;
 * her element bir şifre geleneğine bağlanır — loncaya göre anahtar gökyüzünde doğar.
 */

import type { CipherId } from "../ciphers";

export type Element = "Ateş" | "Toprak" | "Hava" | "Su";

export interface SkyProfile {
  sign: string;
  symbol: string;
  element: Element;
  planet: string;
  motto: string;
  cipherId: CipherId;
  cipherKey: string;
}

interface Zodiac {
  sign: string;
  symbol: string;
  planet: string;
  element: Element;
  motto: string;
  start: [number, number];
  end: [number, number];
}

const ZODIAC: readonly Zodiac[] = [
  {
    sign: "Oğlak",
    symbol: "♑",
    planet: "Satürn",
    element: "Toprak",
    motto: "Taşın altındaki en eski sözü sen taşıyorsun.",
    start: [12, 22],
    end: [1, 19],
  },
  {
    sign: "Kova",
    symbol: "♒",
    planet: "Uranüs",
    element: "Hava",
    motto: "Sana gelen fikir, yüzyıl öncesinin mektubu olabilir.",
    start: [1, 20],
    end: [2, 18],
  },
  {
    sign: "Balık",
    symbol: "♓",
    planet: "Neptün",
    element: "Su",
    motto: "Rüyanda gördüğün harf, sabaha kadar kaybolmayacak.",
    start: [2, 19],
    end: [3, 20],
  },
  {
    sign: "Koç",
    symbol: "♈",
    planet: "Mars",
    element: "Ateş",
    motto: "İlk harfi sen yaz; gerisi seni takip edecek.",
    start: [3, 21],
    end: [4, 19],
  },
  {
    sign: "Boğa",
    symbol: "♉",
    planet: "Venüs",
    element: "Toprak",
    motto: "Biriktirdiğin her sır, ağırlığını sonunda belli eder.",
    start: [4, 20],
    end: [5, 20],
  },
  {
    sign: "İkizler",
    symbol: "♊",
    planet: "Merkür",
    element: "Hava",
    motto: "İki mesaj var: biri sana, biri aynana.",
    start: [5, 21],
    end: [6, 20],
  },
  {
    sign: "Yengeç",
    symbol: "♋",
    planet: "Ay",
    element: "Su",
    motto: "Kabuğunun altındaki yazı, sadece dolunayda okunur.",
    start: [6, 21],
    end: [7, 22],
  },
  {
    sign: "Aslan",
    symbol: "♌",
    planet: "Güneş",
    element: "Ateş",
    motto: "Mührün ışığı, sahibinden önce görünür.",
    start: [7, 23],
    end: [8, 22],
  },
  {
    sign: "Başak",
    symbol: "♍",
    planet: "Merkür",
    element: "Toprak",
    motto: "Bir harflik hata, bir ömrü gizler; dikkat et.",
    start: [8, 23],
    end: [9, 22],
  },
  {
    sign: "Terazi",
    symbol: "♎",
    planet: "Venüs",
    element: "Hava",
    motto: "Terazinin bir kefesinde sır, diğerinde anahtar var.",
    start: [9, 23],
    end: [10, 22],
  },
  {
    sign: "Akrep",
    symbol: "♏",
    planet: "Plüton",
    element: "Su",
    motto: "Suyun en dibi, en berrak sırrı saklar.",
    start: [10, 23],
    end: [11, 21],
  },
  {
    sign: "Yay",
    symbol: "♐",
    planet: "Jüpiter",
    element: "Ateş",
    motto: "Okanın gittiği yerde, cevap çoktan yazılıdır.",
    start: [11, 22],
    end: [12, 21],
  },
];

export const ZODIAC_COUNT = ZODIAC.length;

export function zodiacAt(month: number, day: number): Zodiac {
  for (const z of ZODIAC) {
    const [sm, sd] = z.start;
    const [em, ed] = z.end;
    const after = month > sm || (month === sm && day >= sd);
    const before = month < em || (month === em && day <= ed);
    const inside = sm <= em ? after && before : after || before;
    if (inside) return z;
  }
  return ZODIAC[0];
}

/** "YYYY-MM-DD" biçiminde doğum tarihi → gökyüzü profili. */
export function skyProfileFromBirth(dateISO: string): SkyProfile {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO.trim());
  if (match === null) throw new Error("Doğum tarihi YYYY-AA-GG biçiminde olmalı.");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Bu tarih takvimde yok.");
  }

  const zodiac = zodiacAt(month, day);
  const index = ZODIAC.indexOf(zodiac);

  let cipherId: CipherId;
  let cipherKey: string;
  switch (zodiac.element) {
    case "Ateş":
      cipherId = "sezar";
      cipherKey = String(((index * 7) % 28) + 1);
      break;
    case "Toprak":
      cipherId = "atbash";
      cipherKey = "";
      break;
    case "Hava":
      cipherId = "vigenere";
      cipherKey = zodiac.planet.toLocaleUpperCase("tr-TR");
      break;
    case "Su":
      cipherId = "scytale";
      cipherKey = String((index % 10) + 2);
      break;
  }

  return {
    sign: zodiac.sign,
    symbol: zodiac.symbol,
    element: zodiac.element,
    planet: zodiac.planet,
    motto: zodiac.motto,
    cipherId,
    cipherKey,
  };
}
