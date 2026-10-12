import { describe, expect, it } from "vitest";
import type { StorageLike } from "./store";
import { LocalWallStore, sampleMysteries } from "./store";
import { transform } from "../ciphers";

function fakeStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

describe("gizem duvarı (yerel)", () => {
  it("ilk açılışta örnek vakalarla dolar", async () => {
    const store = new LocalWallStore(fakeStorage(), sampleMysteries());
    const list = await store.list();
    expect(list.length).toBe(3);
  });

  it("yeni mühür en üste eklenir ve kalıcıdır", async () => {
    const storage = fakeStorage();
    const store = new LocalWallStore(storage, []);
    const created = await store.add({ ciphertext: "MSRHNBA", cipherId: "vigenere", hint: "ipucu" });
    expect(created.solverCount).toBe(0);

    const reopened = new LocalWallStore(storage, sampleMysteries());
    const list = await reopened.list();
    expect(list[0].ciphertext).toBe("MSRHNBA");
    expect(list.length).toBe(1);
  });

  it("çözüldü işareti sayacı artırır", async () => {
    const store = new LocalWallStore(fakeStorage(), []);
    const created = await store.add({ ciphertext: "XY", cipherId: "atbash", hint: "" });
    await store.markSolved(created.id);
    await store.markSolved(created.id);
    const list = await store.list();
    expect(list[0].solverCount).toBe(2);
  });

  it("bozuk veriyle çökmez", async () => {
    const storage = fakeStorage();
    storage.setItem("muhurhane-wall-v1", "bozuk json{");
    const store = new LocalWallStore(storage);
    expect(await store.list()).toEqual([]);
  });
});

describe("örnek vakalar gerçekten çözülebilir", () => {
  it("her örnek, ipucundaki anahtarla çözülebilir", () => {
    const samples = sampleMysteries();
    const plain = samples.map((m) => {
      const key = m.cipherId === "vigenere" ? "SESSİZ" : m.cipherId === "scytale" ? "5" : "";
      return transform(m.ciphertext, m.cipherId, key, "decrypt");
    });
    expect(plain[0]).toBe("Bir sır, sahibini bulur.");
    expect(plain[1]).toBe("Gece yarısı kütüphanede buluş.");
    expect(plain[2]).toBe("Kapıdaki gölge benim.");
  });
});
