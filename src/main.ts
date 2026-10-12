import "./style.css";
import { CIPHERS, transform } from "./ciphers";
import type { CipherId, CipherInfo, Direction } from "./ciphers";
import { renderSeal } from "./art/seal";
import { renderAlbertiDisk, renderScytaleStrip } from "./art/prints";
import { SCALES, melodyFromText } from "./music/melody";
import type { Sound } from "./music/melody";
import { renderMidi } from "./music/midi";
import { renderMelodyRoll } from "./music/roll";
import { MelodyPlayer } from "./music/player";
import { createWallStore } from "./wall/store";
import type { Mystery, WallStore } from "./wall/store";

const inputEl = document.querySelector<HTMLTextAreaElement>("#input")!;
const outputEl = document.querySelector<HTMLTextAreaElement>("#output")!;
const keyEl = document.querySelector<HTMLInputElement>("#key")!;
const hintEl = document.querySelector<HTMLInputElement>("#hint")!;
const keyLabel = document.querySelector<HTMLLabelElement>("#keyLabel")!;
const keyHelp = document.querySelector<HTMLElement>("#keyHelp")!;
const inputLabel = document.querySelector<HTMLLabelElement>("#inputLabel")!;
const outputLabel = document.querySelector<HTMLElement>("#outputLabel")!;
const errorEl = document.querySelector<HTMLElement>("#error")!;
const cipherList = document.querySelector<HTMLElement>("#cipherList")!;
const sealPreview = document.querySelector<HTMLElement>("#sealPreview")!;
const stripPreview = document.querySelector<HTMLElement>("#stripPreview")!;
const diskPreview = document.querySelector<HTMLElement>("#diskPreview")!;
const rollPreview = document.querySelector<HTMLElement>("#rollPreview")!;
const printArea = document.querySelector<HTMLElement>("#printArea")!;
const modeEncrypt = document.querySelector<HTMLButtonElement>("#modeEncrypt")!;
const modeDecrypt = document.querySelector<HTMLButtonElement>("#modeDecrypt")!;
const copyBtn = document.querySelector<HTMLButtonElement>("#copyBtn")!;
const scaleEl = document.querySelector<HTMLSelectElement>("#scale")!;
const bpmEl = document.querySelector<HTMLSelectElement>("#bpm")!;
const playBtn = document.querySelector<HTMLButtonElement>("#playBtn")!;

const player = new MelodyPlayer();
const wallStore: WallStore = createWallStore();
const wallList = document.querySelector<HTMLElement>("#wallList")!;
const wallStatus = document.querySelector<HTMLElement>("#wallStatus")!;
const pinBtn = document.querySelector<HTMLButtonElement>("#pinBtn")!;

let wallCache: Mystery[] = [];

function escHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const CIPHER_NAMES: Record<string, string> = Object.fromEntries(
  CIPHERS.map((c) => [c.id, c.name]),
);

function mysteryCard(m: Mystery): string {
  const date = new Date(m.createdAt).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const seal = renderSeal({
    ciphertext: m.ciphertext,
    cipherName: CIPHER_NAMES[m.cipherId] ?? m.cipherId,
    hint: m.hint === "" ? undefined : m.hint,
    date,
  });
  return `<article class="wall-card" data-id="${escHtml(m.id)}">
      <div class="wall-seal">${seal}</div>
      <div class="wall-meta">
        <strong>${escHtml(CIPHER_NAMES[m.cipherId] ?? m.cipherId)}</strong>
        <span>${escHtml(date)} · ${m.solverCount} çözüm</span>
        ${m.hint === "" ? "" : `<p class="wall-hint">ipucu: ${escHtml(m.hint)}</p>`}
        <div class="wall-solve">
          <input type="text" class="wall-key" placeholder="Anahtar dene…" />
          <button type="button" class="btn ghost wall-try">Dene</button>
          <button type="button" class="btn wall-solved">Çözüldü!</button>
        </div>
        <div class="wall-result"></div>
      </div>
    </article>`;
}

async function renderWall(): Promise<void> {
  try {
    wallCache = await wallStore.list();
    wallStatus.textContent =
      wallStore.mode === "local"
        ? "Yerel duvar: vakalar şu an bu tarayıcıda saklanıyor."
        : "Ortak duvar: herkesin vakaları.";
    wallList.innerHTML = wallCache.map(mysteryCard).join("");
  } catch (err) {
    wallStatus.textContent = err instanceof Error ? err.message : "Duvar yüklenemedi.";
  }
}

wallList.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const card = target.closest<HTMLElement>(".wall-card");
  if (card === null) return;
  const mystery = wallCache.find((m) => m.id === card.dataset.id);
  if (mystery === undefined) return;
  const resultEl = card.querySelector<HTMLElement>(".wall-result");

  if (target.classList.contains("wall-try")) {
    const input = card.querySelector<HTMLInputElement>(".wall-key");
    const key = input?.value ?? "";
    try {
      const plain = transform(mystery.ciphertext, mystery.cipherId, key, "decrypt");
      if (resultEl !== null) {
        resultEl.textContent = `deneme: ${plain}`;
      }
    } catch (err) {
      if (resultEl !== null) {
        resultEl.textContent = err instanceof Error ? err.message : "Anahtar çalışmadı.";
      }
    }
  }

  if (target.classList.contains("wall-solved")) {
    void wallStore.markSolved(mystery.id).then(renderWall);
  }
});

pinBtn.addEventListener("click", () => {
  const text = inputEl.value.trim();
  if (text === "") {
    errorEl.hidden = false;
    errorEl.textContent = "Önce bir mesaj yaz, sonra duvara as.";
    return;
  }
  const info = currentInfo();
  const ciphertext =
    state.mode === "encrypt" ? transform(text, info.id, keyEl.value, "encrypt") : text;
  void wallStore
    .add({ ciphertext, cipherId: info.id, hint: hintEl.value.trim() })
    .then(() => renderWall())
    .then(() => {
      document.querySelector(".wall")?.scrollIntoView({ behavior: "smooth" });
    });
});

void renderWall();

const state: { mode: Direction; cipher: CipherId } = {
  mode: "encrypt",
  cipher: "vigenere",
};

const DEFAULT_KEYS: Record<CipherId, string> = {
  vigenere: "ANAHTAR",
  atbash: "",
  sezar: "3",
  scytale: "5",
};

let sealSvg = "";
let stripSvg = "";
let diskSvg = "";
let melody: Sound[] = [];

function currentInfo(): CipherInfo {
  const info = CIPHERS.find((c) => c.id === state.cipher);
  if (info === undefined) throw new Error("Bilinmeyen şifre.");
  return info;
}

function artifactRod(key: string): number {
  const value = Number.parseInt(key.trim(), 10);
  return Number.isInteger(value) && value >= 2 && value <= 12 ? value : 5;
}

function currentBpm(): number {
  return Number.parseInt(bpmEl.value, 10) || 96;
}

function render(): void {
  const info = currentInfo();
  const text = inputEl.value;
  const key = keyEl.value;

  keyLabel.textContent = info.keyLabel;
  keyHelp.textContent = info.keyHelp;
  keyEl.disabled = info.keyKind === "none";

  document.querySelectorAll<HTMLElement>(".cipher-card").forEach((el) => {
    el.classList.toggle("active", el.dataset.cipher === state.cipher);
  });

  let out = "";
  if (text.trim() === "") {
    errorEl.hidden = true;
  } else {
    try {
      out = transform(text, info.id, key, state.mode);
      errorEl.hidden = true;
    } catch (err) {
      errorEl.hidden = false;
      errorEl.textContent = err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu.";
    }
  }
  outputEl.value = out;

  const artifactText = state.mode === "encrypt" ? out : text;
  const date = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const hint = hintEl.value.trim();

  sealSvg = renderSeal({
    ciphertext: artifactText,
    cipherName: info.name,
    hint: hint === "" ? undefined : hint,
    date,
  });
  sealPreview.innerHTML = sealSvg;

  stripSvg = renderScytaleStrip(artifactText, artifactRod(key));
  stripPreview.innerHTML = stripSvg;

  diskSvg = renderAlbertiDisk(key);
  diskPreview.innerHTML = diskSvg;

  melody = melodyFromText(text, { scaleId: scaleEl.value });
  rollPreview.innerHTML = renderMelodyRoll(melody, currentBpm());
}

function setMode(mode: Direction): void {
  state.mode = mode;
  const encrypting = mode === "encrypt";
  modeEncrypt.classList.toggle("active", encrypting);
  modeDecrypt.classList.toggle("active", !encrypting);
  inputLabel.textContent = encrypting ? "Mesaj" : "Şifreli metin";
  inputEl.placeholder = encrypting ? "Gizlenecek mesajı yaz…" : "Çözülecek şifreli metin…";
  outputLabel.textContent = encrypting ? "Şifreli metin" : "Çözülen mesaj";
  render();
}

for (const info of CIPHERS) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "cipher-card";
  btn.dataset.cipher = info.id;
  const strong = document.createElement("strong");
  strong.textContent = info.name;
  const span = document.createElement("span");
  span.textContent = info.era;
  btn.append(strong, span);
  btn.addEventListener("click", () => {
    state.cipher = info.id;
    keyEl.value = DEFAULT_KEYS[info.id];
    render();
  });
  cipherList.append(btn);
}

for (const scale of SCALES) {
  const option = document.createElement("option");
  option.value = scale.id;
  option.textContent = scale.name;
  scaleEl.append(option);
}

function downloadBlob(data: BlobPart, filename: string, type: string): void {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

document.querySelector<HTMLButtonElement>("#dlSeal")!.addEventListener("click", () => {
  downloadBlob(sealSvg, "muhurhane-muhur.svg", "image/svg+xml;charset=utf-8");
});
document.querySelector<HTMLButtonElement>("#dlStrip")!.addEventListener("click", () => {
  downloadBlob(stripSvg, "muhurhane-scytale-seridi.svg", "image/svg+xml;charset=utf-8");
});
document.querySelector<HTMLButtonElement>("#dlDisk")!.addEventListener("click", () => {
  downloadBlob(diskSvg, "muhurhane-alberti-diski.svg", "image/svg+xml;charset=utf-8");
});
document.querySelector<HTMLButtonElement>("#dlMidi")!.addEventListener("click", () => {
  downloadBlob(renderMidi(melody, currentBpm()), "muhurhane-melodi.mid", "audio/midi");
});
document.querySelector<HTMLButtonElement>("#printBtn")!.addEventListener("click", () => {
  printArea.innerHTML = sealSvg + stripSvg + diskSvg;
  window.print();
});

copyBtn.addEventListener("click", () => {
  const value = outputEl.value;
  if (value === "") return;
  void navigator.clipboard.writeText(value).then(() => {
    copyBtn.textContent = "Kopyalandı!";
    setTimeout(() => {
      copyBtn.textContent = "Kopyala";
    }, 1500);
  });
});

playBtn.addEventListener("click", () => {
  if (playBtn.textContent === "Durdur") {
    player.stop();
    playBtn.textContent = "Dinle";
    return;
  }
  if (melody.length === 0) return;
  playBtn.textContent = "Durdur";
  player.play(melody, currentBpm(), () => {
    playBtn.textContent = "Dinle";
  });
});

modeEncrypt.addEventListener("click", () => setMode("encrypt"));
modeDecrypt.addEventListener("click", () => setMode("decrypt"));
inputEl.addEventListener("input", render);
keyEl.addEventListener("input", render);
hintEl.addEventListener("input", render);
scaleEl.addEventListener("change", render);
bpmEl.addEventListener("change", render);

keyEl.value = DEFAULT_KEYS[state.cipher];
setMode("encrypt");
