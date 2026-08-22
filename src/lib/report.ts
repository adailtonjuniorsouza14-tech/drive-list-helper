export interface ReportPhoto {
  caption: string;
  dataUrl: string;
}

export interface ReportBlock {
  title: string;
  rows: { label: string; value: string; highlight?: boolean }[];
}

export interface ReportData {
  codigo: string;
  dataHora: string;
  inicio: string;
  termino: string;
  aprovado: boolean;
  blocks: ReportBlock[];
  fotos: ReportPhoto[];
  assinaturaResponsavel?: string | null | undefined;
  assinaturaMotorista?: string | null | undefined;
  responsavel: string;
  logoUrl?: string | undefined;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function buildReportHtml(d: ReportData) {
  const blocks = d.blocks
    .filter((b) => b.rows.length > 0)
    .map(
      (b) => `<section class="block"><h2>${esc(b.title)}</h2><table>${b.rows
        .map(
          (r) =>
            `<tr><th>${esc(r.label)}</th><td class="${
              r.highlight ? "resp" : ""
            }"><span>${esc(r.value)}</span></td></tr>`,
        )
        .join("")}</table></section>`,
    )
    .join("");

  const fotos = d.fotos.length
    ? `<section class="block avoid-break"><h2>Registro fotográfico</h2><div class="grid">${d.fotos
        .map(
          (f, i) =>
            `<figure><img src="${f.dataUrl}" alt="${esc(f.caption)}"><figcaption>FOTO ${
              i + 1
            }: ${esc(f.caption)}</figcaption></figure>`,
        )
        .join("")}</div></section>`
    : "";

  const sign = (label: string, img?: string | null) =>
    `<div class="sign"><div class="sign-box">${
      img ? `<img src="${img}" alt="Assinatura ${esc(label)}">` : ""
    }</div><span>${esc(label)}</span></div>`;

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Check list de carregamento - ${esc(d.codigo)}</title>
<style>
@page{size:A4;margin:14mm}
*{box-sizing:border-box}
body{font-family:Arial,Helvetica,sans-serif;color:#14261a;margin:0;padding:0;background:#fff;font-size:12px}
.sheet{width:100%;margin:0 auto}
.banner{width:100%;display:block}
.banner img{width:100%;display:block}
header.top{padding:10px 18px 8px;border-bottom:3px solid #1a7a3c}
header.top h1{font-size:15px;margin:0;color:#1a7a3c;text-transform:uppercase}
header.top p{margin:2px 0 0;font-size:11px;color:#555}
.body{padding:0 18px 18px}
.status{margin:12px 0;padding:10px 14px;border-radius:6px;font-weight:bold;text-align:center;letter-spacing:.04em;color:#fff}
.ok{background:#1a7a3c}.nok{background:#b3261e}
.stamps{display:flex;gap:10px;font-size:11px;margin-bottom:12px}
.stamps div{flex:1;border:1px solid #ddd;border-radius:5px;padding:6px 8px;background:#fafaf7}
h2{font-size:12px;text-transform:uppercase;background:#f2c200;color:#14261a;padding:5px 8px;margin:14px 0 0;border-radius:4px 4px 0 0}
table{width:100%;border-collapse:collapse}
th,td{border:1px solid #d9d9d9;padding:6px 8px;font-size:11.5px;vertical-align:top}
th{width:62%;text-align:left;font-weight:normal;background:#fff}
td.resp{text-align:right;width:38%}
td.resp span{display:inline-block;min-width:52px;text-align:center;border:1px solid #1a7a3c;border-radius:4px;padding:2px 8px;font-weight:bold;background:#eef7f0}
.grid{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px}
figure{margin:0;width:calc(50% - 5px);border:1px solid #cfcfcf;border-radius:4px;overflow:hidden;page-break-inside:avoid;break-inside:avoid}
figure img{width:100%;height:150px;object-fit:cover;display:block}
figcaption{border-top:1px solid #cfcfcf;padding:5px 6px;font-size:10.5px;color:#444;background:#fafafa}
.signs{display:flex;gap:24px;margin-top:22px}
.sign{flex:1;text-align:center}
.sign-box{height:70px;border:1px solid #cfcfcf;border-radius:4px;display:flex;align-items:center;justify-content:center;background:#fff}
.sign-box img{max-height:66px;max-width:100%}
.sign span{display:block;font-size:10.5px;color:#444;margin-top:4px;text-transform:uppercase}
footer{margin-top:18px;border-top:1px solid #ddd;padding-top:6px;font-size:10px;color:#777;text-align:center}
.avoid-break{page-break-inside:avoid}
@media print{body{padding:0}}
</style></head><body><div class="sheet">
<header class="top">${d.logoUrl ? `<img src="${d.logoUrl}" alt="Satus">` : ""}
<div><h1>Check list de carregamento — ${esc(d.dataHora)} — ${esc(d.codigo)}</h1>
<p>Satus · qualidade &amp; confiança</p></div></header>
<div class="status ${d.aprovado ? "ok" : "nok"}">${
    d.aprovado ? "APROVADO PARA CARREGAMENTO" : "PENDENTE / NÃO APROVADO"
  }</div>
<div class="stamps"><div><strong>Início:</strong> ${esc(d.inicio)}</div><div><strong>Término:</strong> ${esc(
    d.termino,
  )}</div></div>
${blocks}
${fotos}
<div class="signs">${sign(`Responsável — ${d.responsavel || "—"}`, d.assinaturaResponsavel)}${sign(
    "Motorista",
    d.assinaturaMotorista,
  )}</div>
<footer>Documento gerado eletronicamente · Código ${esc(d.codigo)}</footer>
</div></body></html>`;
}
