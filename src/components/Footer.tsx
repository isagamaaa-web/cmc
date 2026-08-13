import { Link } from "@tanstack/react-router";
import { Phone, MapPin, Clock } from "lucide-react";
import logo from "@/assets/logo.png";
import { CLINIC, telHref } from "@/lib/clinic-data";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-white/60 backdrop-blur">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3 md:px-8">
        <div>
          <Link to="/" className="inline-block" aria-label="Home">
            <img
              src={logo}
              alt="Central Health Services logo"
              className="h-12 w-auto transition-transform hover:scale-105"
            />
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            {CLINIC.name} — led by {CLINIC.doctor}, {CLINIC.role}. Complete medical care, day
            and night.
          </p>
        </div>
        <div>
          <h3 className="text-lg text-primary">Contact</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {CLINIC.phones.map((p) => (
              <li key={p}>
                <a href={telHref(p)} className="inline-flex items-center gap-2 hover:text-primary">
                  <Phone className="h-4 w-4" aria-hidden /> {p}
                </a>
              </li>
            ))}
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
              <span>{CLINIC.address}</span>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" aria-hidden /> {CLINIC.hours}
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg text-primary">Explore</h3>
          <ul className="mt-3 grid grid-cols-2 gap-1 text-sm">
            <li><Link to="/" className="hover:text-primary">Home</Link></li>
            <li><Link to="/about" className="hover:text-primary">About</Link></li>
            <li><Link to="/services" className="hover:text-primary">Services</Link></li>
            <li><Link to="/booking" className="hover:text-primary">Book</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {CLINIC.name}. All rights reserved.
      </div>
    </footer>
  );
}
