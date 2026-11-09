import { addBooking, loadBookings, updateBooking, type StoredBooking } from "@/lib/bookings";
import { createAppointment, rescheduleAppointment } from "@/lib/appointments.functions";

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
  saveQueue([
    ...loadQueue(),
    { id: newId(), kind: "booking", at: new Date().toISOString(), payload },
  ]);
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

/** Replays every queued item to the server. Items that still fail stay in the queue. */
export async function flushQueue(): Promise<{ synced: number; remaining: number }> {
  const items = loadQueue();
  if (!items.length) return { synced: 0, remaining: 0 };

  const still: QueuedItem[] = [];
  let synced = 0;

  for (const item of items) {
    try {
      if (item.kind === "booking") {
        // Keep the local copy, but never duplicate it.
        if (!loadBookings().some((b) => b.id === item.payload.id)) addBooking(item.payload);

        const result = await createAppointment({
          data: {
            id: item.payload.id,
            name: item.payload.name,
            phone: item.payload.phone,
            email: item.payload.email ?? "",
            date: item.payload.date,
            service: item.payload.service,
            notes: item.payload.notes ?? "",
          },
        });
        if (!result.ok) throw new Error(result.error);
      } else {
        updateBooking(item.bookingId, item.payload);
        const local = loadBookings().find((b) => b.id === item.bookingId);
        const phone = item.payload.phone ?? local?.phone;
        const date = item.payload.date ?? local?.date;
        const service = item.payload.service ?? local?.service;
        if (!phone || !date || !service) throw new Error("Incomplete reschedule");

        const result = await rescheduleAppointment({
          data: { id: item.bookingId, phone, date, service },
        });
        if (!result.ok) throw new Error(result.error);
      }
      synced++;
    } catch {
      still.push(item);
    }
  }

  saveQueue(still);
  return { synced, remaining: still.length };
}
