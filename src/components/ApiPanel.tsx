import { useState } from "react";
import { toast } from "sonner";
import { Bot, Database, KeyRound, ShieldCheck, RefreshCw, ArrowLeft, Undo2 } from "lucide-react";

import { GlassCard } from "@/components/GlassCard";
import {
  getIntegrationStatus,
  saveChatbotKey,
  saveDatabaseCredentials,
  resetIntegration,
  type IntegrationStatus,
} from "@/lib/integrations.functions";

type View = "menu" | "chatbot" | "database";

/** Staff API panel: swap the AI provider key or point the app at another database. */
export function ApiPanel() {
  const [view, setView] = useState<View>("menu");
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async (silent = false) => {
    if (!/^[0-9]{6}$/.test(pin)) {
      if (!silent) toast.error("Enter your 6-digit staff PIN first.");
      return;
    }
    setLoading(true);
    try {
      const res = await getIntegrationStatus({ data: { pin } });
      if (!res.ok) {
        toast.error(res.error);
        setStatus(null);
        return;
      }
      setStatus(res.status);
      if (!silent) toast.success("Integration status loaded.");
    } catch {
      toast.error("Network problem — could not load integration status.");
    } finally {
      setLoading(false);
    }
  };

  const reset = async (target: "chatbot" | "database") => {
    if (!/^[0-9]{6}$/.test(pin)) return toast.error("Enter your 6-digit staff PIN first.");
    if (!confirm(`Revert the ${target} to the clinic's built-in configuration?`)) return;
    const res = await resetIntegration({ data: { pin, target } });
    if (!res.ok) return toast.error(res.error);
    toast.success("Reverted to the built-in configuration.");
    void refresh(true);
  };

  return (
    <div className="mt-6 space-y-6">
      <GlassCard className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-primary">API &amp; integrations</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Connect your own AI provider key or your own database. Credentials are encrypted
              and stored server-side only — they are never sent back to any browser and never
              appear in the website code.
            </p>
          </div>
          <div className="flex items-center gap-2">
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
              onClick={() => void refresh()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Check status
            </button>
          </div>
        </div>

        {status && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <StatusCard
              title="Chatbot provider"
              active={status.chatbot.custom}
              lines={[
                `Key: ${status.chatbot.keyPreview || "—"}`,
                `Model: ${status.chatbot.model}`,
                `Endpoint: ${status.chatbot.baseUrl}`,
              ]}
              onReset={status.chatbot.custom ? () => void reset("chatbot") : undefined}
            />
            <StatusCard
              title="Database"
              active={status.database.custom}
              lines={[
                `URL: ${status.database.url || "—"}`,
                `Project: ${status.database.projectId || "—"}`,
                `Secret: ${status.database.secretPreview || "—"}`,
              ]}
              onReset={status.database.custom ? () => void reset("database") : undefined}
            />
          </div>
        )}
      </GlassCard>

      {view === "menu" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <ChoiceCard
            icon={<Bot className="h-6 w-6" />}
            title="Chat bot"
            description="Paste an AI provider API key. The assistant switches to it immediately and stops using the previous key."
            onClick={() => setView("chatbot")}
          />
          <ChoiceCard
            icon={<Database className="h-6 w-6" />}
            title="Database"
            description="Connect your own project: URL, project ID, publishable key and secret key. Verified before it is saved."
            onClick={() => setView("database")}
          />
        </div>
      ) : (
        <GlassCard className="p-6">
          <button
            onClick={() => setView("menu")}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {view === "chatbot" ? (
            <ChatbotForm pin={pin} onSaved={() => void refresh(true)} />
          ) : (
            <DatabaseForm pin={pin} onSaved={() => void refresh(true)} />
          )}
        </GlassCard>
      )}
    </div>
  );
}

function StatusCard({
  title,
  active,
  lines,
  onReset,
}: {
  title: string;
  active: boolean;
  lines: string[];
  onReset?: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-white/80 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-foreground">{title}</p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          {active ? "Custom" : "Built-in"}
        </span>
      </div>
      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
        {lines.map((l) => (
          <li key={l} className="break-all">
            {l}
          </li>
        ))}
      </ul>
      {onReset && (
        <button
          onClick={onReset}
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold transition hover:border-primary/40 hover:text-primary"
        >
          <Undo2 className="h-3.5 w-3.5" /> Revert to built-in
        </button>
      )}
    </div>
  );
}

function ChoiceCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-2xl border border-border bg-white/85 p-6 text-left transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg"
    >
      <div className="inline-flex rounded-xl bg-primary/10 p-3 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <p className="mt-3 text-lg font-bold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </button>
  );
}

function Field({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span className="text-foreground">{label}</span>
      <input
        {...props}
        className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
      />
      {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
    </label>
  );
}

function ChatbotForm({ pin, onSaved }: { pin: string; onSaved: () => void }) {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("google/gemini-2.5-flash");
  const [baseUrl, setBaseUrl] = useState("https://ai.gateway.lovable.dev/v1");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!/^[0-9]{6}$/.test(pin)) return toast.error("Enter your 6-digit staff PIN above.");
    if (apiKey.trim().length < 10) return toast.error("Paste a valid API key.");
    setBusy(true);
    try {
      const res = await saveChatbotKey({
        data: { pin, apiKey: apiKey.trim(), model: model.trim(), baseUrl: baseUrl.trim() },
      });
      if (!res.ok) return void toast.error(res.error);
      setApiKey("");
      toast.success("API key verified and activated — the assistant now uses it.");
      onSaved();
    } catch {
      toast.error("Network problem — the key was not saved.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h3 className="flex items-center gap-2 text-lg font-bold text-primary">
        <Bot className="h-5 w-5" /> Chat bot API key
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        The key is tested against the provider before it is stored. Once saved, the assistant
        forgets the previous key entirely.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field
            label="API key"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={apiKey}
            maxLength={300}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-…"
            hint="Stored encrypted server-side. Never shown again after saving."
          />
        </div>
        <Field
          label="Model"
          value={model}
          maxLength={120}
          onChange={(e) => setModel(e.target.value)}
          placeholder="google/gemini-2.5-flash"
        />
        <Field
          label="API endpoint"
          value={baseUrl}
          maxLength={200}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://api.openai.com/v1"
          hint="Any OpenAI-compatible /chat/completions endpoint."
        />
      </div>
      <button
        onClick={save}
        disabled={busy}
        className="btn-royal mt-6 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-60"
      >
        <KeyRound className="h-4 w-4" /> {busy ? "Verifying…" : "Save & activate"}
      </button>
    </div>
  );
}

function DatabaseForm({ pin, onSaved }: { pin: string; onSaved: () => void }) {
  const [url, setUrl] = useState("");
  const [projectId, setProjectId] = useState("");
  const [publishableKey, setPublishableKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!/^[0-9]{6}$/.test(pin)) return toast.error("Enter your 6-digit staff PIN above.");
    if (!/^https:\/\/.+/.test(url.trim())) return toast.error("Enter the full https project URL.");
    if (publishableKey.trim().length < 10 || secretKey.trim().length < 10)
      return toast.error("Both the publishable key and the secret key are required.");
    setBusy(true);
    try {
      const res = await saveDatabaseCredentials({
        data: {
          pin,
          url: url.trim(),
          projectId: projectId.trim(),
          publishableKey: publishableKey.trim(),
          secretKey: secretKey.trim(),
        },
      });
      if (!res.ok) return void toast.error(res.error);
      setSecretKey("");
      setPublishableKey("");
      toast.success("Connection verified — the clinic data now runs on your database.");
      onSaved();
    } catch {
      toast.error("Network problem — the credentials were not saved.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h3 className="flex items-center gap-2 text-lg font-bold text-primary">
        <Database className="h-5 w-5" /> Database connection
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        The connection is tested live before it is stored. Your project must already contain a{" "}
        <code className="rounded bg-muted px-1">service_prices</code> table (columns:
        <code className="mx-1 rounded bg-muted px-1">title</code> primary key,
        <code className="mx-1 rounded bg-muted px-1">price</code>).
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field
          label="Project URL"
          value={url}
          maxLength={200}
          spellCheck={false}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://xxxx.supabase.co"
        />
        <Field
          label="Project ID"
          value={projectId}
          maxLength={80}
          spellCheck={false}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder="xxxxxxxxxxxxxxxx"
        />
        <Field
          label="Publishable (anon) key"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={publishableKey}
          maxLength={400}
          onChange={(e) => setPublishableKey(e.target.value)}
          placeholder="sb_publishable_…"
        />
        <Field
          label="Secret (service role) key"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={secretKey}
          maxLength={400}
          onChange={(e) => setSecretKey(e.target.value)}
          placeholder="sb_secret_…"
          hint="Encrypted at rest, used only by the server."
        />
      </div>
      <button
        onClick={save}
        disabled={busy}
        className="btn-royal mt-6 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-60"
      >
        <ShieldCheck className="h-4 w-4" /> {busy ? "Testing connection…" : "Save & connect"}
      </button>
    </div>
  );
}
