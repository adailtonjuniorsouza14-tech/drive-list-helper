export interface ReportEntry {
  section: string;
  label: string;
  value: string;
}

export function buildReportHtml(opts: {
  titulo: string;
  cliente: string;
  entries: ReportEntry[];
  fotos: string[];
  startedAt: string;
  finishedAt: string;
  aprovado: boolean;
}) {
  const bySection = new Map<string, ReportEntry[]>();
  for (const e of opts.entries) {
    if (!bySection.has(e.section)) bySection.set(e.section, []);
    bySection.get(e.section)!.push(e);
  }
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const sectionsHtml = [...bySection.entries()]
    .map(
      ([title, entries]) => `<h2>${escape(title)}</h2><table>${entries
        .map(
          (e) =>
            `<tr><th align="left">${escape(e.label)}</th><td>${escape(e.value)}</td></tr>`,
        )
        .join("")}</table>`,
    )
    .join("");

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>${escape(opts.titulo)}</title>
<style>body{font-family:Arial,Helvetica,sans-serif;margin:32px;color:#111}
h1{font-size:20px}h2{font-size:15px;margin-top:24px;text-transform:uppercase}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:6px;font-size:13px}
.status{padding:8px 12px;border-radius:6px;display:inline-block;font-weight:bold;margin-top:8px}
.ok{background:#e6f6ea;color:#1b7a3c}.pend{background:#fdecec;color:#a12b2b}</style></head><body>
<h1>${escape(opts.titulo)}</h1>
<p>Cliente: <strong>${escape(opts.cliente)}</strong><br>
Início: ${escape(opts.startedAt)}<br>Término: ${escape(opts.finishedAt)}</p>
<div class="status ${opts.aprovado ? "ok" : "pend"}">${
    opts.aprovado ? "APROVADO PARA CARREGAMENTO" : "PENDENTE / NÃO APROVADO"
  }</div>
${sectionsHtml}
<h2>Fotos anexadas (${opts.fotos.length})</h2>
<ul>${opts.fotos.map((f) => `<li>${escape(f)}</li>`).join("")}</ul>
</body></html>`;
}
