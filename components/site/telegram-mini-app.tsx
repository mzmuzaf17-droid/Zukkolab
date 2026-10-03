"use client";

import { useEffect, useSyncExternalStore } from "react";

type WebApp = {
  initData: string;
  ready: () => void;
  expand: () => void;
  requestContact?: (
    cb: (ok: boolean, res?: { responseUnsafe?: { contact?: { phone_number?: string } } }) => void,
  ) => void;
  isVersionAtLeast?: (v: string) => boolean;
};
declare global {
  interface Window {
    Telegram?: { WebApp?: WebApp };
  }
}

const FLAG = "zk_tg";
const SCRIPT = "https://telegram.org/js/telegram-web-app.js";
const listeners = new Set<() => void>();

function isMiniAppSession(): boolean {
  try {
    return (
      new URLSearchParams(window.location.search).get("tg") === "1" || sessionStorage.getItem(FLAG) === "1"
    );
  } catch {
    return false;
  }
}

// Sayt Telegram Mini App sifatida ochilganda (?tg=1): skript faqat shu holatda yuklanadi — oddiy saytga ta'sir yo'q.
export function TelegramMiniApp() {
  useEffect(() => {
    if (!isMiniAppSession()) return;
    try {
      sessionStorage.setItem(FLAG, "1");
    } catch {}
    if (window.Telegram?.WebApp) return;
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => {
      window.Telegram?.WebApp?.ready();
      window.Telegram?.WebApp?.expand();
      listeners.forEach((l) => l());
    };
    document.head.appendChild(s);
  }, []);
  return null;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// initData bo'sh bo'lmasa — sahifa haqiqatan Telegram ichida ochilgan.
export function useTelegramWebApp(): WebApp | null {
  return useSyncExternalStore(
    subscribe,
    () => (window.Telegram?.WebApp?.initData ? window.Telegram.WebApp : null),
    () => null,
  );
}
