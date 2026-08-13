import { ADMIN_EMAIL } from "@/lib/clinic-data";

/**
 * Admin credential store (device-local).
 * The PIN is never stored in plain text — only a salted hash — and the number of
 * PIN attempts is capped per device, per calendar month.
 */

const CRED_KEY = "cmc_admin_cred";
const ATTEMPT_KEY = "cmc_admin_attempts";
const SALT = "cmc::admin::v1::";

export const DEFAULT_ADMIN_EMAIL = ADMIN_EMAIL;
const DEFAULT_ADMIN_PIN = "999950";
export const MAX_ATTEMPTS_PER_MONTH = 5;

/** Deterministic, synchronous hash (FNV-1a x2) so the raw PIN never touches storage. */
export function hashSecret(value: string): string {
  const s = SALT + value;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x85ebca6b) >>> 0;
  }
  return `${h1.toString(36)}${h2.toString(36)}`;
}

type Cred = { email: string; pinHash: string; updatedAt: string };

function readCred(): Cred {
  const fallback: Cred = {
    email: DEFAULT_ADMIN_EMAIL,
    pinHash: hashSecret(DEFAULT_ADMIN_PIN),
    updatedAt: "",
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(CRED_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Cred>;
    if (!parsed?.email || !parsed?.pinHash) return fallback;
    return { email: parsed.email, pinHash: parsed.pinHash, updatedAt: parsed.updatedAt ?? "" };
  } catch {
    return fallback;
  }
}

export function getAdminEmail(): string {
  return readCred().email;
}

export function isAdminEmail(email: string): boolean {
  return email.trim().toLowerCase() === getAdminEmail().trim().toLowerCase();
}

export function verifyPin(pin: string): boolean {
  return hashSecret(pin) === readCred().pinHash;
}

export function updateCredentials(next: { email: string; pin: string }) {
  const cred: Cred = {
    email: next.email.trim().toLowerCase(),
    pinHash: hashSecret(next.pin),
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CRED_KEY, JSON.stringify(cred));
  } catch {
    /* ignore */
  }
  return cred;
}

/* ---------------- attempt throttling ---------------- */

type Attempts = { month: string; count: number };

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function readAttempts(): Attempts {
  if (typeof window === "undefined") return { month: currentMonth(), count: 0 };
  try {
    const raw = localStorage.getItem(ATTEMPT_KEY);
    const parsed = raw ? (JSON.parse(raw) as Attempts) : null;
    if (!parsed || parsed.month !== currentMonth()) return { month: currentMonth(), count: 0 };
    return { month: parsed.month, count: Number(parsed.count) || 0 };
  } catch {
    return { month: currentMonth(), count: 0 };
  }
}

function writeAttempts(a: Attempts) {
  try {
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify(a));
  } catch {
    /* ignore */
  }
}

export function attemptsLeft(): number {
  return Math.max(0, MAX_ATTEMPTS_PER_MONTH - readAttempts().count);
}

export function isBlocked(): boolean {
  return attemptsLeft() <= 0;
}

/** Records one failed attempt and returns how many remain. */
export function registerFailedAttempt(): number {
  const a = readAttempts();
  const next = { month: a.month, count: a.count + 1 };
  writeAttempts(next);
  return Math.max(0, MAX_ATTEMPTS_PER_MONTH - next.count);
}

/** Clears the counter after a successful unlock. */
export function resetAttempts() {
  writeAttempts({ month: currentMonth(), count: 0 });
}

export function blockedUntilLabel(): string {
  const d = new Date();
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return next.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}
