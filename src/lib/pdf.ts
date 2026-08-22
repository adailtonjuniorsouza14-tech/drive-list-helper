export async function htmlToPdfBlob(html: string, fileName: string): Promise<Blob> {
  const html2pdf = (await import("html2pdf.js")).default;

  const host = document.createElement("div");
  host.style.position = "absolute";
  host.style.left = "0";
  host.style.top = "0";
  host.style.zIndex = "-9999";
  host.style.opacity = "1";
  host.style.pointerEvents = "none";
  host.style.width = "794px";
  host.style.background = "#ffffff";
  host.innerHTML = html
    .replace(/<!doctype html>/i, "")
    .replace(/<\/?(html|head|body)[^>]*>/gi, "");
  document.body.appendChild(host);

  try {
    // aguarda o carregamento de todas as imagens (fotos, logo, assinaturas)
    const imgs = Array.from(host.querySelectorAll("img"));
    await Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0) return resolve();
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
            setTimeout(resolve, 4000);
          }),
      ),
    );
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 250)));

    const height = Math.max(host.scrollHeight, 400);

    const blob: Blob = await html2pdf()
      .set({
        margin: [0, 0, 0, 0],
        filename: fileName,
        image: { type: "jpeg", quality: 0.92 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 794,
          windowHeight: height,
          width: 794,
          height,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"], avoid: ["figure", ".block", ".signs", "tr"] },
      })
      .from(host)
      .outputPdf("blob");
    return blob;
  } finally {
    host.remove();
  }
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
