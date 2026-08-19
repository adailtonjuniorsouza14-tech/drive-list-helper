import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  cliente: z.string().min(1),
  codigo: z.string().min(1),
  documento: z.string().default(""),
  placa: z.string().default(""),
  aprovado: z.boolean(),
  finishedAt: z.string(),
  html: z.string().min(1),
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
    const ano = String(d.getFullYear());
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    const safe = (s: string) => s.replace(/[\\/:*?"<>|]/g, "-").trim() || "SEM-NOME";
    const hora = `${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;

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
      name: `Relatório - ${nomeRegistro}.html`,
      mimeType: "text/html",
      parentId: folderId,
      data: data.html,
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
