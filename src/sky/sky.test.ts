import { describe, expect, it } from "vitest";
import { ZODIAC_COUNT, skyProfileFromBirth, zodiacAt } from "./index";
import { transform } from "../ciphers";

describe("gökyüzü anahtarı", () => {
  it("tarih sınırlarını doğru okur", () => {
    expect(skyProfileFromBirth("2000-12-22").sign).toBe("Oğlak");
    expect(skyProfileFromBirth("2000-01-19").sign).toBe("Oğlak");
    expect(skyProfileFromBirth("2000-01-20").sign).toBe("Kova");
    expect(skyProfileFromBirth("1990-11-05").sign).toBe("Akrep");
    expect(skyProfileFromBirth("1985-07-23").sign).toBe("Aslan");
  });

  it("on iki burcun tamamı erişilebilirdir", () => {
    const starts = [
      "2000-12-22", "2000-01-20", "2000-02-19", "2000-03-21",
      "2000-04-20", "2000-05-21", "2000-06-21", "2000-07-23",
      "2000-08-23", "2000-09-23", "2000-10-23", "2000-11-22",
    ];
    const signs = new Set(starts.map((d) => skyProfileFromBirth(d).sign));
    expect(signs.size).toBe(ZODIAC_COUNT);
  });

  it("her profilin anahtarı kendi şifresiyle çalışır", () => {
    for (const dateISO of ["2000-03-21", "2000-08-23", "2000-05-21", "2000-10-23"]) {
      const profile = skyProfileFromBirth(dateISO);
      const msg = "Yıldızların arasında bir sır var.";
      const enc = transform(msg, profile.cipherId, profile.cipherKey, "encrypt");
      expect(transform(enc, profile.cipherId, profile.cipherKey, "decrypt")).toBe(msg);
    }
  });

  it("geçersiz tarihi reddeder", () => {
    expect(() => skyProfileFromBirth("")).toThrow();
    expect(() => skyProfileFromBirth("2000-02-30")).toThrow();
    expect(() => skyProfileFromBirth("5 Ocak")).toThrow();
  });

  it("burç sınırında zodiacAt tutarlıdır", () => {
    expect(zodiacAt(1, 19).sign).toBe("Oğlak");
    expect(zodiacAt(1, 20).sign).toBe("Kova");
    expect(zodiacAt(12, 21).sign).toBe("Yay");
    expect(zodiacAt(12, 22).sign).toBe("Oğlak");
  });
});
