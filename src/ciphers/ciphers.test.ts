import { describe, expect, it } from "vitest";
import {
  ALPHABET_SIZE,
  TR_ALPHABET,
  atbash,
  letterIndex,
  scytaleDecrypt,
  scytaleEncrypt,
  sezar,
  transform,
  vigenere,
} from "./index";

describe("alfabe", () => {
  it("29 harfli ve benzersiz Türk alfabesidir", () => {
    expect(ALPHABET_SIZE).toBe(29);
    expect(new Set([...TR_ALPHABET]).size).toBe(29);
  });

  it("Türkçe harfleri tanır", () => {
    expect(letterIndex("ç")).toBe(3);
    expect(letterIndex("İ")).toBe(11);
    expect(letterIndex("ı")).toBe(10);
    expect(letterIndex("7")).toBe(-1);
  });
});

describe("atbash", () => {
  it("ayna görüntüsüdür", () => {
    expect(atbash("A")).toBe("Z");
    expect(atbash("Ç")).toBe("Ü");
    expect(atbash("Z")).toBe("A");
    expect(atbash("atbash")).toBe("zeyzgp");
  });

  it("kendi kendine çözülür", () => {
    const msg = "Şifreli MESAJ, gün ışığında! 123";
    expect(atbash(atbash(msg))).toBe(msg);
  });
});

describe("sezar", () => {
  it("alfabe sonundan başa sarar", () => {
    expect(sezar("Z", 1)).toBe("A");
    expect(sezar("z", 1)).toBe("a");
    expect(sezar("İ", 1)).toBe("J");
  });

  it("harf olmayanları korur", () => {
    expect(sezar("Merhaba, dünya! 42", 3)).toBe("Öğtjçdç, gzpbç! 42");
  });
});

describe("vigenere", () => {
  it("bilinen kaydırmayı üretir", () => {
    expect(vigenere("A", "B")).toBe("B");
    expect(vigenere("MERHABA", "ANA")).toBe("MSRHNBA");
  });

  it("gidiş-dönüş doğru çalışır", () => {
    const msg = "Gizli bir mesaj, 15 Haziran!";
    const key = "ANAHTAR";
    expect(vigenere(vigenere(msg, key), key, "decrypt")).toBe(msg);
  });

  it("harfsiz anahtarı reddeder", () => {
    expect(() => vigenere("MERHABA", "123")).toThrow(/harf/);
  });
});

describe("scytale", () => {
  it("bilinen ızgarayı üretir", () => {
    expect(scytaleEncrypt("MERHABA", 3)).toBe("MHAEARB");
    expect(scytaleDecrypt("MHAEARB", 3)).toBe("MERHABA");
  });

  it("tüm uzunluk/kalınlık kombinasyonlarında gidiş-dönüş çalışır", () => {
    for (let n = 0; n <= 40; n++) {
      const msg = "Bir sır yazdım".slice(0, n).padEnd(n, "x");
      for (let cols = 2; cols <= 12; cols++) {
        expect(scytaleDecrypt(scytaleEncrypt(msg, cols), cols)).toBe(msg);
      }
    }
  });
});

describe("transform", () => {
  it("şifre çözme yönüyle simetriktir", () => {
    const msg = "Sparta'nın sırrı ß ışık";
    for (const id of ["atbash", "sezar", "vigenere", "scytale"] as const) {
      const key = id === "vigenere" ? "DEĞNEK" : id === "atbash" ? "" : "5";
      const enc = transform(msg, id, key, "encrypt");
      expect(transform(enc, id, key, "decrypt")).toBe(msg);
    }
  });

  it("geçersiz anahtarları açıkça reddeder", () => {
    expect(() => transform("x", "sezar", "0", "encrypt")).toThrow(/Kaydırma/);
    expect(() => transform("x", "scytale", "99", "encrypt")).toThrow(/Değnek/);
    expect(() => transform("x", "vigenere", "", "encrypt")).toThrow(/harf/);
  });
});
