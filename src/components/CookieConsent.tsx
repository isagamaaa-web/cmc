import { useEffect, useRef, useState } from "react";
import { Cookie, ShieldCheck } from "lucide-react";
import { PrivacyPolicyLink } from "@/components/PrivacyPolicy";
import { getDeviceId } from "@/lib/bookings";
import {
  getCookieConsent,
  removeDeviceCookie,
  setCookieConsent,
  type CookieConsentValue,
} from "@/lib/cookie-consent";

/**
 * Non-blocking cookie notice. It never disables a form or traps the page, so
 * patients can book or reschedule with or without accepting optional cookies.
 */
export function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    if (getCookieConsent()) return;

    // No optional tracking cookie before the visitor makes a choice.
    removeDeviceCookie();
    const showTimer = setTimeout(() => setOpen(true), 650);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  // Give the page enough scroll room so the fixed card never covers a form button.
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("cookie-consent-open");
    return () => document.body.classList.remove("cookie-consent-open");
  }, [open]);

  const choose = (value: CookieConsentValue) => {
    setCookieConsent(value);
    if (value === "accepted") {
      try {
        // Creates the device id if needed and mirrors it into the cookie.
        getDeviceId();
      } catch {
        /* ignore */
      }
    }

    setClosing(true);
    hideTimer.current = setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 340);
  };

  if (!mounted || !open) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-3 bottom-24 z-[60] flex justify-center md:inset-x-auto md:bottom-6 md:left-6 md:justify-start"
      aria-live="polite"
    >
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="cookie-title"
        aria-describedby="cookie-description"
        className={`cookie-card pointer-events-auto relative w-full max-w-md overflow-hidden rounded-3xl border border-[#097d86]/20 bg-white/95 shadow-[0_30px_80px_-24px_rgba(9,125,134,0.65)] backdrop-blur-xl ${
          closing ? "cookie-card--exit" : "cookie-card--enter"
        }`}
      >
        <div className="h-1 w-full bg-gradient-to-r from-[#0ED5C0] via-[#0AA0AB] to-[#097D86]" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(14,213,192,0.28),transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(9,125,134,0.18),transparent_70%)]" />

        <div className="relative p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <span className="cookie-pulse absolute inset-0 rounded-2xl bg-[#0ED5C0]/30" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0ED5C0] to-[#097D86] shadow-lg shadow-[#097d86]/30">
                <Cookie className="cookie-wiggle h-7 w-7 text-white" strokeWidth={2.2} />
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0AA0AB]">
                Your privacy
              </p>
              <h2 id="cookie-title" className="mt-0.5 text-xl font-bold text-[#0B4A55]">
                Privacy &amp; cookies
              </h2>
              <p
                id="cookie-description"
                className="mt-1.5 text-sm leading-relaxed text-muted-foreground"
              >
                We use cookies and a device ID to keep your booking working and remember your
                appointment on this device. By accepting, you agree to our{" "}
                <PrivacyPolicyLink className="text-[#097D86]">Privacy Policy</PrivacyPolicyLink> and
                consent to cookies.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => choose("accepted")}
              className="btn-royal inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              <ShieldCheck className="h-4 w-4" /> Accept all &amp; continue
            </button>
            <button
              type="button"
              onClick={() => choose("essential")}
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-[#097D86] transition-colors hover:bg-[#097d86]/10"
            >
              Essential only
            </button>
          </div>

          <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
            <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#0ED5C0]" />
            Essential only keeps the site working without optional tracking. You can still book or
            reschedule without accepting optional cookies.
          </p>
        </div>
      </div>
    </div>
  );
}
