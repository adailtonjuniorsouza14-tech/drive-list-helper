const KEY = "checklist-upload-queue";

export interface QueuedUpload {
  id: string;
  createdAt: string;
  payload: unknown;
}

export function readQueue(): QueuedUpload[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as QueuedUpload[];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedUpload[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function enqueueUpload(payload: unknown) {
  const items = readQueue();
  items.push({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), payload });
  writeQueue(items);
  return items.length;
}

export async function flushQueue(
  send: (payload: unknown) => Promise<unknown>,
): Promise<{ sent: number; pending: number }> {
  let items = readQueue();
  let sent = 0;
  for (const item of [...items]) {
    try {
      await send(item.payload);
      sent++;
      items = readQueue().filter((i) => i.id !== item.id);
      writeQueue(items);
    } catch {
      break;
    }
  }
  return { sent, pending: readQueue().length };
}
