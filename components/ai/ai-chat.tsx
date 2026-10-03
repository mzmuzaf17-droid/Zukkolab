"use client";

import { MessageCircleQuestion } from "lucide-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { AI_OPEN_EVENT } from "./events";

// Panel faqat birinchi bosishda yuklanadi — bosh sahifa JS hajmiga qo'shilmaydi (NFR-01).
const AiChatPanel = dynamic(() => import("./ai-chat-panel").then((m) => m.AiChatPanel), { ssr: false });

// 9-bo'lim: o'ng pastki burchakdagi "Savol bering" tugmasi.
export function AiChat() {
  const t = useTranslations("ai");
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const open = () => {
      setLoaded(true);
      setOpen(true);
    };
    window.addEventListener(AI_OPEN_EVENT, open);
    return () => window.removeEventListener(AI_OPEN_EVENT, open);
  }, []);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => {
            setLoaded(true);
            setOpen(true);
          }}
          className="bg-brand fixed right-6 bottom-6 z-40 hidden min-h-14 items-center justify-center gap-2 rounded-full px-5 font-semibold text-white shadow-lg transition-transform hover:scale-[1.03] md:flex"
          aria-haspopup="dialog"
        >
          <MessageCircleQuestion className="size-6" aria-hidden />
          {t("button")}
        </button>
      )}
      {loaded && <AiChatPanel open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
