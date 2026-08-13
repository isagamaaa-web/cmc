import { useEffect, useRef, useState } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";

type LangCode = "en" | "am" | "om" | "ar" | "so";

const LANGS: { code: LangCode; label: string; native: string; flag: string }[] = [
  { code: "en", label: "English", native: "English", flag: "🇬🇧" },
  { code: "am", label: "Amharic", native: "አማርኛ", flag: "🇪🇹" },
  { code: "om", label: "Oromoo", native: "Afaan Oromoo", flag: "🇪🇹" },
  { code: "ar", label: "Arabic", native: "العربية", flag: "🇸🇦" },
  { code: "so", label: "Somali", native: "Soomaali", flag: "🇸🇴" },
];

const STORAGE_KEY = "cmc_lang";

function setGoogTransCookie(target: LangCode) {
  const value = `/en/${target}`;
  const host = window.location.hostname;
  // Cookie for exact host and for parent domain(s)
  document.cookie = `googtrans=${value};path=/`;
  document.cookie = `googtrans=${value};path=/;domain=${host}`;
  const parts = host.split(".");
  if (parts.length > 1) {
    const parent = "." + parts.slice(-2).join(".");
    document.cookie = `googtrans=${value};path=/;domain=${parent}`;
  }
}

function clearGoogTransCookie() {
  const past = "Thu, 01 Jan 1970 00:00:00 GMT";
  const host = window.location.hostname;
  document.cookie = `googtrans=;expires=${past};path=/`;
  document.cookie = `googtrans=;expires=${past};path=/;domain=${host}`;
  const parts = host.split(".");
  if (parts.length > 1) {
    const parent = "." + parts.slice(-2).join(".");
    document.cookie = `googtrans=;expires=${past};path=/;domain=${parent}`;
  }
}

export function LanguageSwitcher() {
  const [current, setCurrent] = useState<LangCode>("en");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Boot: read saved lang, set cookie BEFORE loading widget, then load widget.
  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as LangCode | null) || "en";
    setCurrent(saved);

    if (saved !== "en") {
      setGoogTransCookie(saved);

      // Only load the Google Translate script when actually translating.
      if (!document.getElementById("google-translate-script")) {
        (window as unknown as { googleTranslateElementInit: () => void }).googleTranslateElementInit =
          () => {
            const w = window as unknown as {
              google: {
                translate: {
                  TranslateElement: new (
                    opts: Record<string, unknown>,
                    el: string,
                  ) => void;
                };
              };
            };
            new w.google.translate.TranslateElement(
              {
                pageLanguage: "en",
                includedLanguages: "en,am,om,ar,so",
                autoDisplay: false,
                layout: 0,
              },
              "google_translate_element",
            );
          };
        const s = document.createElement("script");
        s.id = "google-translate-script";
        s.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        s.async = true;
        s.defer = true;
        document.body.appendChild(s);
      }
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const change = (code: LangCode) => {
    localStorage.setItem(STORAGE_KEY, code);
    if (code === "en") clearGoogTransCookie();
    else setGoogTransCookie(code);
    setCurrent(code);
    setOpen(false);
    // Fastest, most reliable way to apply Google Translate on all rendered nodes.
    window.location.reload();
  };

  const active = LANGS.find((l) => l.code === current) ?? LANGS[0];

  return (
    <>
      <div ref={rootRef} className="relative notranslate" translate="no">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Change language"
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-white/70 px-3 py-1.5 text-sm font-semibold text-primary shadow-sm hover:bg-white"
        >
          <Globe className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">{active.native}</span>
          <span className="sm:hidden">{active.flag}</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>
        {open && (
          <ul
            role="listbox"
            className="absolute left-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-primary/20 bg-white shadow-xl"
          >
            {LANGS.map((l) => {
              const isActive = l.code === current;
              return (
                <li key={l.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => change(l.code)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
                      isActive ? "bg-secondary text-primary" : "hover:bg-secondary/60"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span aria-hidden>{l.flag}</span>
                      <span className="font-medium">{l.native}</span>
                      <span className="text-xs text-muted-foreground">{l.label}</span>
                    </span>
                    {isActive && <Check className="h-4 w-4 text-primary" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {/* Hidden Google Translate mount + banner hider */}
      <div id="google_translate_element" style={{ display: "none" }} aria-hidden />
      <style>{`
        .goog-te-banner-frame, .skiptranslate { display: none !important; }
        body { top: 0 !important; }
        #goog-gt-tt, .goog-te-balloon-frame { display: none !important; }
        .goog-text-highlight { background: none !important; box-shadow: none !important; }
      `}</style>
    </>
  );
}
