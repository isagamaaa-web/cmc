import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { chatWithClinicAI } from "@/lib/ai-chat.functions";
import { offlineAnswer } from "@/lib/offline-knowledge";

type Msg = { role: "user" | "assistant"; content: string };

function sanitize(input: string): string {
  // Strip control chars and cap length. Rendering is text-only (no dangerouslySetInnerHTML),
  // so React auto-escapes. This adds an extra guard against XSS payloads.
  return input.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, 1000).trim();
}

/**
 * Hardening for model output: the assistant is an information-only helper, so it
 * must never emit executable markup. We strip any HTML/script-like content and
 * code fences before the text is rendered (React still escapes on top of this).
 */
function sanitizeReply(reply: string): string {
  const cleaned = reply
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/<\s*\/?\s*(script|style|iframe|object|embed|link|meta|svg|img|form)[^>]*>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`{1,2}([^`]*)`{1,2}/g, "$1")
    .replace(/\b(javascript|data|vbscript)\s*:/gi, "")
    .replace(/on[a-z]+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, "")
    .trim();
  return (
    cleaned.slice(0, 2000) ||
    "Sorry, I couldn't answer that. Please call us at 0912-22-49-71."
  );
}

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 12;


export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Central Clinic's AI. Ask me about our services, doctor, hours, or how to book an appointment.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentAt = useRef<number[]>([]);
  const chat = useServerFn(chatWithClinicAI);

  useEffect(() => {
    const t = setTimeout(() => setTeaser(true), 1500);
    const h = setTimeout(() => setTeaser(false), 12000);
    return () => {
      clearTimeout(t);
      clearTimeout(h);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async () => {
    const clean = sanitize(input);
    if (!clean || loading) return;

    // Simple client-side flood guard.
    const now = Date.now();
    sentAt.current = sentAt.current.filter((t) => now - t < RATE_WINDOW_MS);
    if (sentAt.current.length >= RATE_MAX) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "You're sending messages very quickly. Please wait a moment before asking again — or call 0912-22-49-71.",
        },
      ]);
      setInput("");
      return;
    }
    sentAt.current.push(now);

    const next: Msg[] = [...messages, { role: "user", content: clean }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      // Offline-first: answer prices, hours, services and location locally.
      const local = offlineAnswer(clean);
      if (local) {
        setMessages((m) => [...m, { role: "assistant", content: local }]);
        setLoading(false);
        return;
      }
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              "You appear to be offline. I can still answer questions about our prices, services, opening hours and location — just ask. For anything else, call 0912-22-49-71.",
          },
        ]);
        setLoading(false);
        return;
      }
      const res = await chat({ data: { messages: next.slice(-20) } });
      setMessages((m) => [...m, { role: "assistant", content: sanitizeReply(res.reply) }]);
    } catch (err) {
      console.error("Chatbot server function error:", err);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            offlineAnswer(clean) ??
            "I couldn't reach our assistant just now. I can still help with prices, services, hours and our location — or call 0912-22-49-71 / 0911-48-72-49.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 md:bottom-6 md:right-6">
      {!open && teaser && (
        <div className="glass-card animate-fade-in max-w-[240px] rounded-2xl rounded-br-sm px-4 py-3 text-sm shadow-lg">
          Hi, I am Central Clinic's AI! Ask me things if you need help.
        </div>
      )}
      {open && (
        <div
          role="dialog"
          aria-label="Central Clinic AI Assistant"
          className="glass-card flex h-[520px] w-[92vw] max-w-[380px] flex-col overflow-hidden rounded-2xl p-0 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-border/60 bg-primary px-4 py-3 text-primary-foreground">
            <div>
              <div className="text-sm font-semibold">Central Clinic AI</div>
              <div className="text-[11px] opacity-80">Online · 24/7</div>
            </div>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-white/80 text-foreground"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="max-w-[85%] rounded-2xl bg-white/80 px-3 py-2 text-sm text-muted-foreground">
                Typing…
              </div>
            )}
          </div>
          <form
            className="flex items-center gap-2 border-t border-border/60 bg-white/70 p-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <label htmlFor="chat-input" className="sr-only">
              Message
            </label>
            <input
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1000}
              placeholder="Ask about services, hours, booking…"
              className="flex-1 rounded-full border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="btn-royal inline-flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        onClick={() => {
          setOpen((v) => !v);
          setTeaser(false);
        }}
        className="btn-royal inline-flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-transform hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
