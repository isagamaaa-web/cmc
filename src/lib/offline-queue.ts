import { addBooking, updateBooking, type StoredBooking } from "@/lib/bookings";

/**
 * Offline submission queue.
 * Any booking or reschedule that fails to persist (storage error, offline, crash)
 * is parked here and replayed automatically as soon as the device is online again.
 */

export type QueuedItem =
  | { id: string; kind: "booking"; at: string; payload: StoredBooking }
  | {
      id: string;
      kind: "reschedule";
      at: string;
      bookingId: string;
      payload: Partial<StoredBooking>;
    };

const QUEUE_KEY = "cmc_offline_queue";

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function loadQueue(): QueuedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as QueuedItem[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(list: QueuedItem[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function queueBooking(payload: StoredBooking) {
  saveQueue([...loadQueue(), { id: newId(), kind: "booking", at: new Date().toISOString(), payload }]);
}

export function queueReschedule(bookingId: string, payload: Partial<StoredBooking>) {
  saveQueue([
    ...loadQueue(),
    { id: newId(), kind: "reschedule", at: new Date().toISOString(), bookingId, payload },
  ]);
}

export function queueSize(): number {
  return loadQueue().length;
}

/** Replays every queued item. Items that still fail stay in the queue. */
export function flushQueue(): { synced: number; remaining: number } {
  const items = loadQueue();
  if (!items.length) return { synced: 0, remaining: 0 };
  const still: QueuedItem[] = [];
  let synced = 0;
  for (const item of items) {
    try {
      if (item.kind === "booking") addBooking(item.payload);
      else updateBooking(item.bookingId, item.payload);
      synced++;
    } catch {
      still.push(item);
    }
  }
  saveQueue(still);
  return { synced, remaining: still.length };
}
