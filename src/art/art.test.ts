import { describe, expect, it } from "vitest";
import { renderSeal } from "./seal";
import { renderAlbertiDisk, renderScytaleStrip } from "./prints";

describe("SVG üreticileri", () => {
  it("mühür geçerli ve deterministiktir", () => {
    const opts = { ciphertext: "MSRHNBA", cipherName: "Vigenère", hint: "kitap", date: "1 Ocak 2026" };
    const a = renderSeal(opts);
    const b = renderSeal(opts);
    expect(a).toBe(b);
    expect(a.startsWith("<svg")).toBe(true);
    expect(a.trim().endsWith("</svg>")).toBe(true);
    expect(a).toContain("textPath");
    expect(a).toContain("MÜHÜRHANE");
  });

  it("mühürdeki metin XML'e uygun kaçışlanır", () => {
    const svg = renderSeal({ ciphertext: `<script>"&"</script>`, cipherName: "Atbash" });
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;");
    expect(svg).toContain("&amp;");
  });

  it("burç simgesi ve gizli satır mühüre işlenir", () => {
    const svg = renderSeal({
      ciphertext: "SIR",
      cipherName: "Vigenère",
      sky: { symbol: "♏", sign: "Akrep", planet: "Plüton" },
      secretLine: "Yıldızlar konuşur, ama fısıltıyla.",
    });
    expect(svg).toContain("♏");
    expect(svg).toContain("AKREP · PLÜTON");
    expect(svg).toContain("Yıldızlar konuşur, ama fısıltıyla.");
  });

  it("scytale şeridi ve Alberti diski üretilir", () => {
    const strip = renderScytaleStrip("MERHABA", 3);
    expect(strip.startsWith("<svg")).toBe(true);
    expect(strip).toContain("SCYTALE ŞERİDİ");

    const disk = renderAlbertiDisk("ANAHTAR");
    expect(disk.startsWith("<svg")).toBe(true);
    expect(disk).toContain("ALBERTİ ŞİFRE DİSKİ");
    // 29 harfli iki alfabe: dış + iç
    expect((disk.match(/<text /g) ?? []).length).toBeGreaterThanOrEqual(58);
  });
});
