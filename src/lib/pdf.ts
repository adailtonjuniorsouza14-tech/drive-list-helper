export async function htmlToPdfBlob(html: string, fileName: string): Promise<Blob> {
  const html2pdf = (await import("html2pdf.js")).default;

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.width = "794px";
  host.style.background = "#ffffff";
  host.innerHTML = html
    .replace(/<!doctype html>/i, "")
    .replace(/<\/?(html|head|body)[^>]*>/gi, "");
  document.body.appendChild(host);

  try {
    await new Promise((r) => setTimeout(r, 300));
    const blob: Blob = await html2pdf()
      .set({
        margin: [8, 8, 8, 8],
        filename: fileName,
        image: { type: "jpeg", quality: 0.92 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
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
