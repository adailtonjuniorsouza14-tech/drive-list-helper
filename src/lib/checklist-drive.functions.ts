import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  cliente: z.string().min(1),
  codigo: z.string().min(1),
  documento: z.string().default(""),
  placa: z.string().default(""),
  aprovado: z.boolean(),
  finishedAt: z.string(),
  pdfBase64: z.string().min(1),
  pdfName: z.string().min(1),
  dados: z.string().min(1),
  fotos: z
    .array(z.object({ name: z.string(), mimeType: z.string(), dataBase64: z.string() }))
    .max(60)
    .default([]),
});

export const saveChecklistToDrive = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { ensureFolderPath, uploadFile } = await import("./drive.server");

    const d = new Date(data.finishedAt);
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(d)
      .reduce<Record<string, string>>((acc, p) => {
        acc[p.type] = p.value;
        return acc;
      }, {});
    const ano = parts["year"]!;
    const mes = parts["month"]!;
    const dia = parts["day"]!;
    const safe = (s: string) => s.replace(/[\\/:*?"<>|]/g, "-").trim() || "SEM-NOME";
    const hora = `${parts["hour"] === "24" ? "00" : parts["hour"]}h${parts["minute"]}`;

    const nomeRegistro = safe(
      [`${dia}-${mes}-${ano} ${hora}`, data.documento, data.placa, data.codigo]
        .filter(Boolean)
        .join(" - "),
    );

    const folderId = await ensureFolderPath([
      "Check List de Carregamento",
      ano,
      `${mes} - ${ano}`,
      `${dia}-${mes}-${ano}`,
      safe(data.cliente),
      nomeRegistro,
    ]);

    for (const [i, foto] of data.fotos.entries()) {
      const bin = Uint8Array.from(atob(foto.dataBase64), (c) => c.charCodeAt(0));
      const ext = foto.mimeType.includes("png") ? "png" : "jpg";
      await uploadFile({
        name: `${String(i + 1).padStart(2, "0")} - ${safe(foto.name)}.${ext}`,
        mimeType: foto.mimeType,
        parentId: folderId,
        data: bin,
      });
    }

    const doc = await uploadFile({
      name: safe(data.pdfName).endsWith(".pdf") ? safe(data.pdfName) : `${safe(data.pdfName)}.pdf`,
      mimeType: "application/pdf",
      parentId: folderId,
      data: Uint8Array.from(atob(data.pdfBase64), (c) => c.charCodeAt(0)),
    });

    await uploadFile({
      name: `Dados - ${nomeRegistro}.json`,
      mimeType: "application/json",
      parentId: folderId,
      data: data.dados,
    });

    return {
      folderId,
      path: `Check List de Carregamento/${ano}/${mes} - ${ano}/${dia}-${mes}-${ano}/${safe(
        data.cliente,
      )}/${nomeRegistro}`,
      link: doc.webViewLink ?? `https://drive.google.com/drive/folders/${folderId}`,
    };
  });
