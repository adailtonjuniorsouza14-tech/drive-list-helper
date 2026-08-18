const GATEWAY = "https://connector-gateway.lovable.dev/google_drive";

function headers() {
  const lovable = process.env["LOVABLE_API_KEY"];
  const conn = process.env["GOOGLE_DRIVE_API_KEY"];
  if (!lovable || !conn) throw new Error("Conexão com o Google Drive não configurada.");
  return {
    Authorization: `Bearer ${lovable}`,
    "X-Connection-Api-Key": conn,
  };
}

async function driveFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: { ...headers(), ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Drive request failed [${res.status}]: ${body}`);
    throw new Error(`Falha no Google Drive [${res.status}]: ${body}`);
  }
  return res;
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

export async function ensureFolder(name: string, parentId?: string): Promise<string> {
  const q = [
    "mimeType='application/vnd.google-apps.folder'",
    "trashed=false",
    `name='${esc(name)}'`,
    `'${parentId ?? "root"}' in parents`,
  ].join(" and ");
  const res = await driveFetch(
    `/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=1`,
  );
  const data = (await res.json()) as { files?: { id: string }[] };
  if (data.files?.length) return data.files[0]!.id;

  const created = await driveFetch(`/drive/v3/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId ?? "root"],
    }),
  });
  return ((await created.json()) as { id: string }).id;
}

export async function ensureFolderPath(segments: string[]): Promise<string> {
  let parent: string | undefined;
  for (const segment of segments) {
    parent = await ensureFolder(segment, parent);
  }
  return parent!;
}

export async function uploadFile(opts: {
  name: string;
  mimeType: string;
  parentId: string;
  data: Uint8Array | string;
}): Promise<{ id: string; webViewLink?: string }> {
  const boundary = `lovable${crypto.randomUUID()}`;
  const meta = JSON.stringify({ name: opts.name, parents: [opts.parentId] });
  const bytes =
    typeof opts.data === "string" ? new TextEncoder().encode(opts.data) : opts.data;

  const pre = new TextEncoder().encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n` +
      `--${boundary}\r\nContent-Type: ${opts.mimeType}\r\n\r\n`,
  );
  const post = new TextEncoder().encode(`\r\n--${boundary}--\r\n`);
  const body = new Uint8Array(pre.length + bytes.length + post.length);
  body.set(pre, 0);
  body.set(bytes, pre.length);
  body.set(post, pre.length + bytes.length);

  const res = await driveFetch(`/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink`, {
    method: "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
  return (await res.json()) as { id: string; webViewLink?: string };
}
