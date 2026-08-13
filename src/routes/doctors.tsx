import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  LogOut,
  CheckCircle2,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Stethoscope,
  FileText,
  Tag,
  CalendarClock,
  History,
  ListChecks,
  ArrowRight,
  PlusCircle,
  Download,
  KeyRound,
  X, Plug } from "lucide-react";
import { ApiPanel } from "@/components/ApiPanel";
import { GlassCard } from "@/components/GlassCard";
import { toast } from "sonner";
import {
  loadBookings,
  saveBookings,
  loadAudit,
  clearAudit,
  type StoredBooking,
  type AuditEntry,
} from "@/lib/bookings";
import { getAdminEmail, updateCredentials, verifyPin } from "@/lib/admin-credentials";
import { ALL_SERVICE_ITEMS } from "@/lib/clinic-data";
import { listPrices, updatePrices } from "@/lib/prices.functions";

/** Escapes a CSV cell, neutralising spreadsheet formula injection. */
function csvCell(value: string | undefined): string {
  const v = (value ?? "").replace(/\r?\n/g, " ");
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}



export const Route = createFileRoute("/doctors")({
  head: () => ({
    meta: [
      { title: "Doctors Portal — Central Medium Clinic" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<StoredBooking[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [tab, setTab] = useState<"appointments" | "history" | "prices" | "api">("appointments");
  const [query, setQuery] = useState("");
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const ok = sessionStorage.getItem("cmc_admin") === "1";
    if (!ok) {
      navigate({ to: "/booking" });
      return;
    }
    setAuthed(true);
    setBookings(loadBookings());
    setAudit(loadAudit());
  }, [navigate]);


  const [credOpen, setCredOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => {
    setRefreshing(true);
    const list = loadBookings();
    setBookings(list);
    setAudit(loadAudit());
    setQuery("");
    window.setTimeout(() => {
      setRefreshing(false);
      toast.success(`Refreshed — ${list.length} appointment${list.length === 1 ? "" : "s"}`);
    }, 350);
  };

  const exportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    if (tab === "history") {
      const rows = [
        ["When", "Patient", "Action", "Field", "From", "To"],
        ...audit.flatMap((a) =>
          a.changes.map((c) => [
            new Date(a.at).toLocaleString(),
            a.patient,
            a.action,
            c.field,
            c.from ?? "",
            c.to ?? "",
          ]),
        ),
      ];
      downloadCsv(`cmc-audit-history-${stamp}.csv`, rows);
      toast.success("Audit history exported");
      return;
    }
    const rows = [
      ["Name", "Phone", "Email", "Service", "Price", "Preferred date", "Requested", "Rescheduled", "Status", "Notes"],
      ...bookings.map((b) => [
        b.name,
        b.phone,
        b.email ?? "",
        b.service,
        b.price ?? "",
        b.date,
        new Date(b.submittedAt).toLocaleString(),
        b.updatedAt ? new Date(b.updatedAt).toLocaleString() : "",
        b.done ? "Done" : "Pending",
        b.notes ?? "",
      ]),
    ];
    downloadCsv(`cmc-appointments-${stamp}.csv`, rows);
    toast.success(`Exported ${bookings.length} appointment${bookings.length === 1 ? "" : "s"}`);
  };


  const signOut = () => {
    sessionStorage.removeItem("cmc_admin");
    navigate({ to: "/" });
  };

  const toggleDone = (id: string) => {
    const list = loadBookings().map((b) => (b.id === id ? { ...b, done: !b.done } : b));
    saveBookings(list);
    setBookings(list);
  };

  const remove = (id: string) => {
    if (!confirm("Delete this appointment?")) return;
    const list = loadBookings().filter((b) => b.id !== id);
    saveBookings(list);
    setBookings(list);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) =>
      [b.name, b.phone, b.email ?? "", b.service].some((f) =>
        f.toLowerCase().includes(q),
      ),
    );
  }, [bookings, query]);

  const filteredAudit = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return audit;
    return audit.filter((a) =>
      [a.patient, a.action, ...a.changes.flatMap((c) => [c.field, c.from ?? "", c.to ?? ""])].some(
        (f) => f.toLowerCase().includes(q),
      ),
    );
  }, [audit, query]);


  if (!authed) return null;

  return (
    <section className="px-4 py-12 md:px-8">
      <div className="mx-auto max-w-5xl">
        <GlassCard className="p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/70">
                Internal
              </p>
              <h1 className="mt-1 text-4xl font-extrabold text-primary sm:text-5xl">
                APPOINTMENTS
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                All booking requests, newest first.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={refresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-md disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
              </button>
              <button
                onClick={exportCsv}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-md"
              >
                <Download className="h-4 w-4" /> Export CSV
              </button>
              <button
                onClick={() => setCredOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-md"
              >
                <KeyRound className="h-4 w-4" /> Reset password
              </button>
              <button
                onClick={signOut}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:text-primary"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>

          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <TabButton
              active={tab === "appointments"}
              onClick={() => setTab("appointments")}
              icon={<ListChecks className="h-4 w-4" />}
              label={`Appointments (${bookings.length})`}
            />
            <TabButton
              active={tab === "history"}
              onClick={() => setTab("history")}
              icon={<History className="h-4 w-4" />}
              label={`Audit history (${audit.length})`}
            />
            <TabButton
              active={tab === "prices"}
              onClick={() => setTab("prices")}
              icon={<Tag className="h-4 w-4" />}
              label="Prices"
            />
            <TabButton
              active={tab === "api"}
              onClick={() => setTab("api")}
              icon={<Plug className="h-4 w-4" />}
              label="API"
            />
          </div>

          {tab !== "prices" && tab !== "api" && (
            <div className="mt-4 flex items-center gap-3 rounded-full border border-border bg-white/80 px-5 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  tab === "appointments"
                    ? "Search by name, phone or email..."
                    : "Search history by patient, field or value..."
                }
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          )}
        </GlassCard>

        {tab === "api" ? (
          <ApiPanel />
        ) : tab === "prices" ? (
          <PricesPanel />
        ) : tab === "history" ? (

          <div className="mt-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Showing <strong className="text-foreground">{filteredAudit.length}</strong> of{" "}
                {audit.length} change{audit.length === 1 ? "" : "s"}
              </p>
              {audit.length > 0 && (
                <button
                  onClick={() => {
                    if (!confirm("Clear the entire audit history?")) return;
                    clearAudit();
                    setAudit([]);
                    toast.success("Audit history cleared");
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" /> Clear history
                </button>
              )}
            </div>

            {filteredAudit.length === 0 ? (
              <GlassCard className="p-10 text-center text-muted-foreground">
                No changes recorded yet.
              </GlassCard>
            ) : (
              <ol className="space-y-3">
                {filteredAudit.map((a) => (
                  <li key={a.id}>
                    <GlassCard className="p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                              a.action === "created"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {a.action === "created" ? (
                              <PlusCircle className="h-4 w-4" />
                            ) : (
                              <CalendarClock className="h-4 w-4" />
                            )}
                          </span>
                          <div>
                            <p className="text-sm font-bold uppercase text-foreground">
                              {a.patient}
                            </p>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {a.action === "created" ? "Booking created" : "Rescheduled"}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(a.at).toLocaleString()}
                        </p>
                      </div>

                      <ul className="mt-4 space-y-2">
                        {a.changes.map((c, i) => (
                          <li
                            key={`${a.id}-${c.field}-${i}`}
                            className="flex flex-wrap items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-sm"
                          >
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {c.field}
                            </span>
                            {c.from && (
                              <>
                                <span className="text-muted-foreground line-through">{c.from}</span>
                                <ArrowRight className="h-3.5 w-3.5 text-primary" />
                              </>
                            )}
                            <span className="font-semibold text-foreground">{c.to ?? "—"}</span>
                          </li>
                        ))}
                      </ul>
                    </GlassCard>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ) : (
        <div className="mt-6">
          <p className="mb-3 text-sm text-muted-foreground">
            Showing <strong className="text-foreground">{filtered.length}</strong> of{" "}
            {bookings.length}
          </p>

          {filtered.length === 0 ? (
            <GlassCard className="p-10 text-center text-muted-foreground">
              No appointments yet.
            </GlassCard>
          ) : (
            <ul className="space-y-4">
              {filtered.map((b) => (
                <li key={b.id}>
                  <GlassCard className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold uppercase text-foreground">
                          {b.name}
                        </h2>
                        <div className="mt-1 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
                          <Stethoscope className="h-4 w-4" /> {b.service}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {b.done && (
                          <span className="rounded-full bg-accent/30 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
                            Done
                          </span>
                        )}
                        <button
                          onClick={() => toggleDone(b.id)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-white px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/10"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {b.done ? "Undo" : "Mark done"}
                        </button>
                        <button
                          onClick={() => remove(b.id)}
                          aria-label="Delete"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-destructive/40 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                      <Row icon={<Phone className="h-4 w-4" />} label="Phone" value={b.phone} />
                      {b.email && (
                        <Row icon={<Mail className="h-4 w-4" />} label="Email" value={b.email} />
                      )}
                      <Row
                        icon={<Calendar className="h-4 w-4" />}
                        label="Preferred date"
                        value={b.date}
                      />
                      <Row
                        icon={<Calendar className="h-4 w-4" />}
                        label="Requested"
                        value={new Date(b.submittedAt).toLocaleString()}
                      />
                      {b.price && (
                        <Row
                          icon={<Tag className="h-4 w-4" />}
                          label="Price"
                          value={b.price}
                        />
                      )}
                      {b.updatedAt && (
                        <Row
                          icon={<CalendarClock className="h-4 w-4" />}
                          label="Rescheduled"
                          value={new Date(b.updatedAt).toLocaleString()}
                        />
                      )}
                    </dl>

                    {b.notes && (
                      <div className="mt-5 rounded-xl bg-white/70 p-4">
                        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" /> Notes
                        </div>
                        <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">
                          {b.notes}
                        </p>
                      </div>
                    )}
                  </GlassCard>
                </li>
              ))}
            </ul>
          )}
        </div>
        )}
      </div>

      <CredentialsModal open={credOpen} onClose={() => setCredOpen(false)} />
    </section>
  );
}

function CredentialsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [currentPin, setCurrentPin] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCurrentPin("");
      setEmail(getAdminEmail());
      setPin("");
      setConfirmPin("");
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPin(currentPin)) {
      setError("Current PIN is incorrect.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError("Enter a valid admin email address.");
      return;
    }
    if (!/^[0-9]{6}$/.test(pin)) {
      setError("The new PIN must be exactly 6 digits.");
      return;
    }
    if (pin !== confirmPin) {
      setError("The two new PINs don't match.");
      return;
    }
    updateCredentials({ email, pin });
    toast.success("Admin email and PIN updated on this device.");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cred-title"
    >
      <div className="absolute inset-0 bg-[#0F252C]/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_40px_120px_-20px_rgba(9,125,134,0.6)]">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0ED5C0] to-[#097D86] shadow-lg">
          <KeyRound className="h-8 w-8 text-white" strokeWidth={2.4} />
        </div>
        <h2 id="cred-title" className="mt-4 text-center text-2xl font-bold uppercase text-[#0B4A55]">
          Reset admin password
        </h2>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Change the unlock email and the 6-digit PIN. The PIN is stored hashed.
        </p>

        <form onSubmit={save} className="mt-6 grid gap-4">
          <label className="grid gap-1.5 text-sm font-medium">
            Current PIN
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
              className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              autoComplete="current-password"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Admin email
            <input
              type="email"
              maxLength={120}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              autoComplete="email"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium">
              New PIN
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                autoComplete="new-password"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Confirm PIN
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                autoComplete="new-password"
              />
            </label>
          </div>

          {error && (
            <p role="alert" className="text-sm font-semibold text-destructive">
              {error}
            </p>
          )}

          <button type="submit" className="btn-royal mt-1 rounded-full px-5 py-2.5 font-semibold">
            Save new credentials
          </button>
        </form>
      </div>
    </div>
  );
}


function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-md"
          : "border-border bg-white text-foreground hover:border-primary/40 hover:text-primary"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-primary">{icon}</div>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
      </div>
    </div>
  );
}

/** Clinic-wide price editor — saves to the shared backend so every device updates. */
function PricesPanel() {
  const [rows, setRows] = useState<Record<string, string>>(() =>
    Object.fromEntries(ALL_SERVICE_ITEMS.map((i) => [i.title, i.price])),
  );
  const [initial, setInitial] = useState<Record<string, string>>(rows);
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    listPrices()
      .then((live) => {
        const base = Object.fromEntries(ALL_SERVICE_ITEMS.map((i) => [i.title, i.price]));
        const merged = { ...base, ...Object.fromEntries(live.map((r) => [r.title, r.price])) };
        setRows(merged);
        setInitial(merged);
      })
      .catch(() => toast.error("Could not load live prices — showing defaults."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const changed = Object.keys(rows).filter((k) => rows[k] !== initial[k]);

  const save = async () => {
    if (!/^[0-9]{6}$/.test(pin)) {
      toast.error("Enter your 6-digit staff PIN to publish price changes.");
      return;
    }
    if (!changed.length) {
      toast.info("No price changes to publish.");
      return;
    }
    setSaving(true);
    try {
      const res = await updatePrices({
        data: { pin, updates: changed.map((t) => ({ title: t, price: rows[t] })) },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setInitial({ ...rows });
      setPin("");
      toast.success(`Published ${res.saved} price update(s) to every device.`);
    } catch {
      toast.error("Network problem — price changes were not published.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6">
      <GlassCard className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-primary">Service prices</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Changes publish to the shared clinic database and appear on every visitor's
              device immediately.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="Staff PIN"
              autoComplete="off"
              className="w-32 rounded-full border border-border bg-white px-4 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              onClick={save}
              disabled={saving || loading}
              className="btn-royal rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {saving ? "Publishing…" : `Publish${changed.length ? ` (${changed.length})` : ""}`}
            </button>
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Reload
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {ALL_SERVICE_ITEMS.map((item) => (
            <label
              key={item.title}
              className="grid gap-1.5 rounded-xl bg-white/70 p-3 text-sm font-medium"
            >
              <span className="text-foreground">{item.title}</span>
              <input
                value={rows[item.title] ?? ""}
                maxLength={60}
                onChange={(e) =>
                  setRows((prev) => ({ ...prev, [item.title]: e.target.value }))
                }
                className={`rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-primary ${
                  rows[item.title] !== initial[item.title]
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border"
                }`}
              />
            </label>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
