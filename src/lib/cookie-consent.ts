/**
 * Cookie consent preferences.
 *
 * The clinic remembers a device with a first-party identifier so patients can
 * reschedule the appointment they booked. That identifier lives in
 * `localStorage` for core functionality and is mirrored in the `cmc_did`
 * cookie only after the visitor accepts cookies.
 */

export type CookieConsentValue = "accepted" | "essential";
export type CookieConsentState = CookieConsentValue | null;

const CONSENT_STORAGE_KEY = "cmc_cookie_consent";
const CONSENT_COOKIE = "cmc_cookie_consent";
const DEVICE_COOKIE = "cmc_did";
const DEVICE_STORAGE_KEY = "cmc_device_id";

const CONSENT_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const DEVICE_MAX_AGE = 60 * 60 * 24 * 3650; // 10 years

function isConsentValue(value: string | null | undefined): value is CookieConsentValue {
  return value === "accepted" || value === "essential";
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  try {
    const prefix = `${name}=`;
    const hit = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(prefix));
    return hit ? decodeURIComponent(hit.slice(prefix.length)) : null;
  } catch {
    return null;
  }
}

function writeCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;
  try {
    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${name}=${encodeURIComponent(
      value,
    )}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
  } catch {
    /* ignore */
  }
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  try {
    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax${secure}`;
  } catch {
    /* ignore */
  }
}

/** Current choice, or null when the visitor has not decided yet. */
export function getCookieConsent(): CookieConsentState {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (isConsentValue(stored)) return stored;
  } catch {
    /* ignore */
  }
  const fromCookie = readCookie(CONSENT_COOKIE);
  return isConsentValue(fromCookie) ? fromCookie : null;
}

/** True only when the visitor explicitly accepted optional cookies. */
export function hasCookieConsent(): boolean {
  return getCookieConsent() === "accepted";
}

export function setCookieConsent(value: CookieConsentValue) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
  writeCookie(CONSENT_COOKIE, value, CONSENT_MAX_AGE);

  if (value === "accepted") {
    // Mirror an existing device id straight away. If none exists yet,
    // getDeviceId() will create one when the visitor books.
    try {
      const existing = localStorage.getItem(DEVICE_STORAGE_KEY);
      if (existing) writeDeviceCookie(existing);
    } catch {
      /* ignore */
    }
  } else {
    removeDeviceCookie();
  }
}

/** The device cookie is only read after optional cookies are accepted. */
export function readDeviceCookie(): string | null {
  if (!hasCookieConsent()) return null;
  return readCookie(DEVICE_COOKIE);
}

/** The device cookie is only written after optional cookies are accepted. */
export function writeDeviceCookie(id: string) {
  if (!hasCookieConsent()) return;
  writeCookie(DEVICE_COOKIE, id, DEVICE_MAX_AGE);
}

export function removeDeviceCookie() {
  deleteCookie(DEVICE_COOKIE);
}
