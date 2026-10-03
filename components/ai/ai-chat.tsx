"use client";

import { MessageCircleQuestion } from "lucide-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useState } from "react";

// Panel faqat birinchi bosishda yuklanadi — bosh sahifa JS hajmiga qo'shilmaydi (NFR-01).
const AiChatPanel = dynamic(() => import("./ai-chat-panel").then((m) => m.AiChatPanel), { ssr: false });

// 9-bo'lim: o'ng pastki burchakdagi "Savol bering" tugmasi.
export function AiChat() {
  const t = useTranslations("ai");
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => {
            setLoaded(true);
            setOpen(true);
          }}
          className="bg-brand fixed right-4 bottom-[calc(var(--bottom-bar-height)+env(safe-area-inset-bottom)+12px)] z-40 flex min-h-14 min-w-14 items-center justify-center gap-2 rounded-full px-4 font-semibold text-white shadow-lg transition-transform hover:scale-[1.03] md:right-6 md:bottom-6 md:px-5"
          aria-haspopup="dialog"
        >
          <MessageCircleQuestion className="size-6" aria-hidden />
          <span className="hidden md:inline">{t("button")}</span>
          <span className="sr-only md:hidden">{t("button")}</span>
        </button>
      )}
      {loaded && <AiChatPanel open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
