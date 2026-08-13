import { useEffect } from "react";
import doctorImg from "@/assets/doctor-waving.png";
import logoImg from "@/assets/logo.png";

/**
 * Registers the offline pre-cache service worker (browser only) and pins the
 * hero doctor image so it renders even offline or when the PNG is blocked.
 */
export function OfflineCache() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (window.location.hostname === "localhost" && import.meta.env.DEV) return;

    const pinHeroAssets = () => {
      if (!("caches" in window)) return;
      caches
        .open("cmc-v7")
        .then((c) => c.addAll([doctorImg, logoImg]).catch(() => {}))
        .catch(() => {});
    };

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then(pinHeroAssets)
        .catch(() => {
          /* offline caching is a progressive enhancement */
        });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}

