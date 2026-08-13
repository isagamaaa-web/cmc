import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import logo from "@/assets/logo.png";
import { CLINIC, telHref } from "@/lib/clinic-data";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/contact", label: "Contact" },
  { to: "/reschedule", label: "Reschedule" },
  { to: "/booking", label: "Book Appointment" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <Link to="/" className="group flex items-center gap-3" aria-label={`${CLINIC.brand} home`}>
          <img
            src={logo}
            alt="Central Health Services logo"
            className="h-10 w-auto transition-transform duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_10px_rgba(66,120,220,0.55)]"
          />
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          <div className="mr-2">
            <LanguageSwitcher />
          </div>
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="btn-rect px-3 py-2 text-sm font-medium text-foreground/80"
              activeProps={{ className: "text-primary border-primary/40 bg-primary/10" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}

          <a
            href={telHref(CLINIC.phones[0])}
            className="btn-royal ml-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
            aria-label={`Call ${CLINIC.phones[0]}`}
          >
            <Phone className="h-4 w-4" aria-hidden />
            {CLINIC.phones[0]}
          </a>
        </nav>
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitcher />
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-2 text-foreground lg:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border/60 bg-white/90 lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-2" aria-label="Mobile">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="btn-rect my-0.5 px-3 py-3 text-sm font-medium text-foreground/80"
                activeProps={{ className: "text-primary border-primary/40 bg-primary/10" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}

            <a
              href={telHref(CLINIC.phones[0])}
              className="btn-royal mt-2 inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
            >
              <Phone className="h-4 w-4" aria-hidden /> Emergency: {CLINIC.phones[0]}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
