"use client";

import { ArrowUp, CalendarCheck, ClipboardCheck, PhoneCall, Sparkles, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { buttonClass } from "@/components/ui/button";
import type { AiCta } from "@/lib/ai/types";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; text: string; cta?: AiCta };

const SESSION_KEY = "zk_ai_sid";
// Telefon: md (768px) dan kichik ekran — chat butun ekranni egallaydi.
const MOBILE = "(max-width: 767.98px)";

function sessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

const CTA = {
  test: { href: "/test", icon: ClipboardCheck },
  trial: { href: "/sinov-darsi", icon: CalendarCheck },
  operator: { href: { pathname: "/", hash: "ariza" }, icon: PhoneCall },
} as const;

export function AiChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("ai");
  const locale = useLocale();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const sid = useRef<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // Telefonda klaviatura o'zi ochilib, tayyor savollarni yopib qo'ymasin — fokus faqat sichqonchali qurilmada.
    if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Telefonda: panel ko'rinadigan maydonga (visualViewport) moslanadi — klaviatura ochilganda yozish maydoni
  // uning ustida qoladi (iOS'da 100dvh klaviaturani hisobga olmaydi). Orqadagi sahifa aylanmaydi.
  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    const mq = window.matchMedia(MOBILE);
    const vv = window.visualViewport;
    const body = document.body.style;
    const prevOverflow = body.overflow;

    const fit = () => {
      if (mq.matches && vv) {
        panel.style.top = `${vv.offsetTop}px`;
        panel.style.height = `${vv.height}px`;
        panel.style.bottom = "auto";
        body.overflow = "hidden";
        logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
      } else {
        panel.style.top = panel.style.height = panel.style.bottom = "";
        body.overflow = prevOverflow;
      }
    };

    fit();
    vv?.addEventListener("resize", fit);
    vv?.addEventListener("scroll", fit);
    mq.addEventListener("change", fit);
    return () => {
      vv?.removeEventListener("resize", fit);
      vv?.removeEventListener("scroll", fit);
      mq.removeEventListener("change", fit);
      panel.style.top = panel.style.height = panel.style.bottom = "";
      body.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  async function ask(text: string) {
    const message = text.trim();
    if (!message || pending) return;
    sid.current ??= sessionId();
    setMessages((m) => [...m, { role: "user", text: message }]);
    setInput("");
    setPending(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid.current, message, locale }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        res.ok
          ? { role: "assistant", text: String(data.text), cta: data.cta ?? null }
          : { role: "assistant", text: data?.error?.message ?? t("error"), cta: "operator" },
      ]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: t("error"), cta: "operator" }]);
    } finally {
      setPending(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    void ask(input);
  }

  const lastAssistant = messages.findLastIndex((m) => m.role === "assistant");
  const bubble = "max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-line";
  const botBubble = cn(bubble, "border-line rounded-tl-md border bg-white");

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="ai-title"
      hidden={!open}
      className={cn(
        // Telefon: butun ekran. Kompyuter: o'ng pastki burchakdagi oyna.
        "bg-bg fixed inset-0 z-50 flex h-dvh flex-col overflow-hidden",
        "md:border-line md:inset-auto md:right-6 md:bottom-6 md:h-auto md:max-h-[min(640px,75dvh)] md:w-[380px] md:rounded-[24px] md:border md:shadow-2xl",
      )}
    >
      <header className="bg-ink flex shrink-0 items-center gap-3 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 text-white md:px-5 md:pt-4 md:pb-4">
        <span className="bg-brand grid size-10 shrink-0 place-items-center rounded-full" aria-hidden>
          <Sparkles className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="ai-title" className="font-display truncate text-base font-semibold">
            {t("title")}
          </h2>
          <p className="flex items-center gap-1.5 text-xs text-white/70">
            <span className="bg-cta size-2 rounded-full" aria-hidden />
            {t("status")}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="-mr-2 grid size-11 shrink-0 place-items-center rounded-full hover:bg-white/10"
          aria-label={t("close")}
        >
          <X className="size-6" aria-hidden />
        </button>
      </header>

      <div
        ref={logRef}
        className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4"
        aria-live="polite"
      >
        <p className={botBubble}>{t("intro")}</p>
        {messages.length === 0 && (
          <div className="space-y-3 pt-1">
            <div className="flex flex-col items-start gap-2">
              {(t.raw("presets") as string[]).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void ask(q)}
                  className="border-brand/30 text-brand hover:bg-brand/5 active:bg-brand/10 min-h-11 rounded-full border bg-white px-4 py-2 text-left text-sm font-semibold"
                >
                  {q}
                </button>
              ))}
            </div>
            <p className="text-muted text-xs">{t("note")}</p>
          </div>
        )}
        {messages.map((m, i) => {
          const cta = m.cta ? CTA[m.cta] : null;
          return (
            <div
              key={i}
              className={cn("flex flex-col gap-2", m.role === "user" ? "items-end" : "items-start")}
            >
              <p className={m.role === "user" ? cn(bubble, "bg-brand rounded-tr-md text-white") : botBubble}>
                {m.text}
              </p>
              {cta && i === lastAssistant && m.cta && (
                <Link
                  href={cta.href}
                  onClick={onClose}
                  className={buttonClass("primary", "md", "w-full md:w-auto")}
                >
                  <cta.icon className="size-4" aria-hidden />
                  {t(`cta.${m.cta}`)}
                </Link>
              )}
            </div>
          );
        })}
        {pending && (
          <p className={cn(botBubble, "text-muted inline-flex items-center gap-2 text-sm")} role="status">
            <span className="flex gap-1" aria-hidden>
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  className="bg-muted size-1.5 rounded-full motion-safe:animate-bounce"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </span>
            {t("typing")}
          </p>
        )}
      </div>

      <form
        onSubmit={submit}
        className="border-line flex shrink-0 items-center gap-2 border-t bg-white px-3 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]"
      >
        <label htmlFor="ai-input" className="sr-only">
          {t("placeholder")}
        </label>
        <input
          id="ai-input"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          autoComplete="off"
          enterKeyHint="send"
          placeholder={t("placeholder")}
          className="border-line bg-bg min-h-12 min-w-0 flex-1 rounded-full border px-4 text-base outline-none"
        />
        <button
          type="submit"
          // Telefonda tugma bosilganda klaviatura yopilib qolmasin — fokus yozish maydonida qoladi.
          onPointerDown={(e) => e.preventDefault()}
          disabled={pending || !input.trim()}
          className="bg-brand grid size-12 shrink-0 place-items-center rounded-full text-white transition-opacity disabled:opacity-30"
          aria-label={t("send")}
        >
          <ArrowUp className="size-5" aria-hidden />
        </button>
      </form>
    </div>
  );
}
