const LETTER_FIX: Record<string, string> = {
  "0": "O",
  "1": "I",
  "2": "Z",
  "4": "A",
  "5": "S",
  "6": "G",
  "7": "T",
  "8": "B",
};
const DIGIT_FIX: Record<string, string> = {
  O: "0",
  Q: "0",
  D: "0",
  I: "1",
  L: "1",
  Z: "2",
  A: "4",
  S: "5",
  G: "6",
  T: "7",
  B: "8",
};

const asLetter = (c: string) => LETTER_FIX[c] ?? c;
const asDigit = (c: string) => DIGIT_FIX[c] ?? c;

/** Normaliza um bloco de 7 caracteres para o padrão brasileiro (antigo ou Mercosul). */
function normalize(raw: string): string | null {
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s.length < 7) return null;
  for (let i = 0; i + 7 <= s.length; i++) {
    const c = s.slice(i, i + 7).split("");
    const mercosul = /[A-Z]/.test(c[4] ?? "") && !/^\d$/.test(c[4] ?? "");
    const out = [
      asLetter(c[0]!),
      asLetter(c[1]!),
      asLetter(c[2]!),
      asDigit(c[3]!),
      mercosul ? asLetter(c[4]!) : asDigit(c[4]!),
      asDigit(c[5]!),
      asDigit(c[6]!),
    ].join("");
    if (/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(out)) return out;
  }
  return null;
}

/** Aumenta contraste e escala para melhorar a leitura da placa. */
async function preprocess(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(4, Math.max(1, 1200 / bitmap.width));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i]! + 0.587 * d[i + 1]! + 0.114 * d[i + 2]!;
    d[i] = d[i + 1] = d[i + 2] = g;
    sum += g;
  }
  const mean = sum / (d.length / 4);
  for (let i = 0; i < d.length; i += 4) {
    const v = d[i]! > mean * 0.95 ? 255 : 0;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  bitmap.close();
  return canvas.toDataURL("image/png");
}

/** Lê a placa a partir da foto. Retorna null quando não reconhece. */
export async function readPlateFromImage(file: File): Promise<string | null> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    await worker.setParameters({
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    });
    const sources = [await preprocess(file), URL.createObjectURL(file)];
    for (const src of sources) {
      const { data } = await worker.recognize(src);
      if (src.startsWith("blob:")) URL.revokeObjectURL(src);
      const lines = [
        ...data.text.split(/\n+/).map((l) => l.trim()),
        data.text.replace(/\s+/g, ""),
      ].filter(Boolean);
      for (const line of lines) {
        if (/BRASIL|MERCOSUL/i.test(line)) continue;
        const plate = normalize(line);
        if (plate) return plate;
      }
    }
    return null;
  } finally {
    await worker.terminate();
  }
}
