export type StoredBooking = {
  id: string;
  deviceId: string;
  name: string;
  email?: string;
  phone: string;
  date: string;
  service: string;
  price?: string;
  notes?: string;
  submittedAt: string;
  updatedAt?: string;
  done: boolean;
};

const STORAGE_KEY = "cmc_bookings";
const DEVICE_KEY = "cmc_device_id";

/**
 * Stable per-device identifier.
 * Browsers cannot read IP/MAC addresses (by design), so we combine a persisted
 * random UUID with a deterministic device fingerprint (user agent, screen,
 * timezone, language, platform). If storage is ever cleared, the fingerprint
 * still lets us recognise the same device.
 */
function fingerprint(): string {
  if (typeof window === "undefined") return "ssr";
  const parts = [
    navigator.userAgent,
    navigator.language,
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    String(new Date().getTimezoneOffset()),
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
  ].join("|");
  let h1 = 0x811c9dc5;
  for (let i = 0; i < parts.length; i++) {
    h1 ^= parts.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193) >>> 0;
  }
  return `fp_${h1.toString(36)}`;
}

/** Mirror of the device id in a long-lived cookie, so clearing one store isn't enough to lose it. */
function readCookieId(): string | null {
  try {
    const m = document.cookie.match(/(?:^|;\s*)cmc_did=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

function writeCookieId(id: string) {
  try {
    document.cookie = `cmc_did=${encodeURIComponent(id)}; path=/; max-age=${60 * 60 * 24 * 3650}; samesite=lax`;
  } catch {
    /* ignore */
  }
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "ssr";
  const fp = fingerprint();
  try {
    const existing = localStorage.getItem(DEVICE_KEY) ?? readCookieId();
    if (existing) {
      localStorage.setItem(DEVICE_KEY, existing);
      writeCookieId(existing);
      return existing;
    }
    const id = `${fp}_${
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)
    }`;
    localStorage.setItem(DEVICE_KEY, id);
    writeCookieId(id);
    return id;
  } catch {
    return readCookieId() ?? fp;
  }
}


/** True when a stored booking belongs to this device (UUID or fingerprint match). */
export function isSameDevice(bookingDeviceId: string | undefined, deviceId: string) {
  if (!bookingDeviceId) return false;
  if (bookingDeviceId === deviceId) return true;
  const a = bookingDeviceId.split("_").slice(0, 2).join("_");
  const b = deviceId.split("_").slice(0, 2).join("_");
  return a === b;
}

export function loadBookings(): StoredBooking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as StoredBooking[]) : [];
  } catch {
    return [];
  }
}

export function saveBookings(list: StoredBooking[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export type AuditEntry = {
  id: string;
  bookingId: string;
  patient: string;
  action: "created" | "rescheduled";
  at: string;
  changes: { field: string; from?: string; to?: string }[];
};

const AUDIT_KEY = "cmc_audit";
const MAX_AUDIT = 300;

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function loadAudit(): AuditEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as AuditEntry[]) : [];
  } catch {
    return [];
  }
}

function appendAudit(entry: AuditEntry) {
  try {
    const list = [entry, ...loadAudit()].slice(0, MAX_AUDIT);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function clearAudit() {
  try {
    localStorage.removeItem(AUDIT_KEY);
  } catch {
    /* ignore */
  }
}

export function addBooking(b: StoredBooking) {
  const list = loadBookings();
  list.unshift(b);
  saveBookings(list);
  appendAudit({
    id: newId(),
    bookingId: b.id,
    patient: b.name,
    action: "created",
    at: b.submittedAt,
    changes: [
      { field: "date", to: b.date },
      { field: "service", to: b.service },
      { field: "phone", to: b.phone },
      ...(b.price ? [{ field: "price", to: b.price }] : []),
    ],
  });
}

export function updateBooking(id: string, patch: Partial<StoredBooking>) {
  const before = loadBookings().find((b) => b.id === id);
  const list = loadBookings().map((b) =>
    b.id === id ? { ...b, ...patch, updatedAt: new Date().toISOString() } : b,
  );
  saveBookings(list);
  const after = list.find((b) => b.id === id);
  if (before && after) {
    const changes = (Object.keys(patch) as (keyof StoredBooking)[])
      .filter((k) => String(before[k] ?? "") !== String(after[k] ?? ""))
      .map((k) => ({
        field: String(k),
        from: before[k] === undefined ? undefined : String(before[k]),
        to: after[k] === undefined ? undefined : String(after[k]),
      }));
    if (changes.length) {
      appendAudit({
        id: newId(),
        bookingId: id,
        patient: after.name,
        action: "rescheduled",
        at: after.updatedAt ?? new Date().toISOString(),
        changes,
      });
    }
  }
  return after;
}

/** Most recent booking made from this device, if any. */
export function findMyBooking(): StoredBooking | undefined {
  const id = getDeviceId();
  return loadBookings().find((b) => isSameDevice(b.deviceId, id));
}

