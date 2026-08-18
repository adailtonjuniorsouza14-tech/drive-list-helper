import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  cliente: z.string().min(1),
  documento: z.string().default(""),
  placa: z.string().default(""),
  aprovado: z.boolean(),
  startedAt: z.string(),
  finishedAt: z.string(),
  entries: z.array(
    z.object({ section: z.string(), label: z.string(), value: z.string() }),
  ),
  fotos: z
    .array(z.object({ name: z.string(), mimeType: z.string(), dataBase64: z.string() }))
    .max(60)
    .default([]),
});

export const saveChecklistToDrive = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { ensureFolderPath, uploadFile } = await import("./drive.server");
    const { buildReportHtml } = await import("./checklist-report.server");

    const d = new Date(data.finishedAt);
    const ano = String(d.getFullYear());
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    const safe = (s: string) => s.replace(/[\\/:*?"<>|]/g, "-").trim() || "SEM-NOME";

    const hora = `${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;
    const nomeRegistro = safe(
      [`${ano}-${mes}-${dia} ${hora}`, data.documento, data.placa].filter(Boolean).join(" - "),
    );

    const folderId = await ensureFolderPath([
      "Check List de Carregamento",
      ano,
      `${mes} - ${ano}`,
      `${dia}-${mes}-${ano}`,
      safe(data.cliente),
      nomeRegistro,
    ]);

    const fotoNomes: string[] = [];
    for (const [i, foto] of data.fotos.entries()) {
      const bin = Uint8Array.from(atob(foto.dataBase64), (c) => c.charCodeAt(0));
      const ext = foto.mimeType.includes("png") ? "png" : "jpg";
      const name = `${String(i + 1).padStart(2, "0")} - ${safe(foto.name)}.${ext}`;
      fotoNomes.push(name);
      await uploadFile({ name, mimeType: foto.mimeType, parentId: folderId, data: bin });
    }

    const html = buildReportHtml({
      titulo: `Check list de carregamento - ${nomeRegistro}`,
      cliente: data.cliente,
      entries: data.entries,
      fotos: fotoNomes,
      startedAt: data.startedAt,
      finishedAt: data.finishedAt,
      aprovado: data.aprovado,
    });

    const doc = await uploadFile({
      name: `Relatório - ${nomeRegistro}.html`,
      mimeType: "text/html",
      parentId: folderId,
      data: html,
    });

    await uploadFile({
      name: `Dados - ${nomeRegistro}.json`,
      mimeType: "application/json",
      parentId: folderId,
      data: JSON.stringify({ ...data, fotos: fotoNomes }, null, 2),
    });

    return {
      folderId,
      path: `Check List de Carregamento/${ano}/${mes} - ${ano}/${dia}-${mes}-${ano}/${safe(data.cliente)}/${nomeRegistro}`,
      link: doc.webViewLink ?? `https://drive.google.com/drive/folders/${folderId}`,
    };
  });
