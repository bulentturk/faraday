/**
 * Gizem Duvarı: mühürlü mesajların asıldığı, çözülmeyi bekleyen vakalar.
 * Yerel mod tarayıcıda saklar; VITE_WALL_API_URL verilirse ortak REST duvarına bağlanır.
 */

import type { CipherId } from "../ciphers";
import { transform } from "../ciphers";

export interface Mystery {
  id: string;
  ciphertext: string;
  cipherId: CipherId;
  hint: string;
  createdAt: string;
  solverCount: number;
}

export type NewMystery = Pick<Mystery, "ciphertext" | "cipherId" | "hint">;

export interface WallStore {
  readonly mode: "local" | "remote";
  list(): Promise<Mystery[]>;
  add(mystery: NewMystery): Promise<Mystery>;
  markSolved(id: string): Promise<void>;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const STORAGE_KEY = "muhurhane-wall-v1";

export function sampleMysteries(): Mystery[] {
  return [
    {
      id: "ornek-sessiz",
      ciphertext: transform("Bir sır, sahibini bulur.", "vigenere", "SESSİZ", "encrypt"),
      cipherId: "vigenere",
      hint: "Anahtar bir kelime: sesi çıkmayanın adı.",
      createdAt: "2026-10-12T20:00:00.000Z",
      solverCount: 3,
    },
    {
      id: "ornek-degnek",
      ciphertext: transform("Gece yarısı kütüphanede buluş.", "scytale", "5", "encrypt"),
      cipherId: "scytale",
      hint: "Eliyle beş parmak kadar kalın bir değnek.",
      createdAt: "2026-10-11T21:30:00.000Z",
      solverCount: 1,
    },
    {
      id: "ornek-ayna",
      ciphertext: transform("Kapıdaki gölge benim.", "atbash", "", "encrypt"),
      cipherId: "atbash",
      hint: "Anahtarsız; sadece alfabenin aynasına bak.",
      createdAt: "2026-10-10T19:15:00.000Z",
      solverCount: 7,
    },
  ];
}

export class LocalWallStore implements WallStore {
  readonly mode = "local" as const;

  constructor(
    private readonly storage: StorageLike,
    seed: readonly Mystery[] = [],
  ) {
    if (this.storage.getItem(STORAGE_KEY) === null) {
      this.save([...seed]);
    }
  }

  private load(): Mystery[] {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Mystery[]) : [];
    } catch {
      return [];
    }
  }

  private save(mysteries: readonly Mystery[]): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(mysteries));
  }

  async list(): Promise<Mystery[]> {
    return this.load();
  }

  async add(mystery: NewMystery): Promise<Mystery> {
    const created: Mystery = {
      ...mystery,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      solverCount: 0,
    };
    this.save([created, ...this.load()]);
    return created;
  }

  async markSolved(id: string): Promise<void> {
    this.save(
      this.load().map((m) => (m.id === id ? { ...m, solverCount: m.solverCount + 1 } : m)),
    );
  }
}

export class RemoteWallStore implements WallStore {
  readonly mode = "remote" as const;

  constructor(private readonly baseUrl: string) {}

  private async req<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) {
      throw new Error(`Duvar yanıt vermedi (HTTP ${res.status}).`);
    }
    return (await res.json()) as T;
  }

  list(): Promise<Mystery[]> {
    return this.req<Mystery[]>("/mysteries");
  }

  add(mystery: NewMystery): Promise<Mystery> {
    return this.req<Mystery>("/mysteries", {
      method: "POST",
      body: JSON.stringify(mystery),
    });
  }

  markSolved(id: string): Promise<void> {
    return this.req<void>(`/mysteries/${encodeURIComponent(id)}/solve`, { method: "POST" });
  }
}

export function createWallStore(): WallStore {
  const url = import.meta.env.VITE_WALL_API_URL;
  if (typeof url === "string" && url.trim() !== "") {
    return new RemoteWallStore(url.trim());
  }
  const storage = globalThis.localStorage;
  return new LocalWallStore(storage, sampleMysteries());
}
