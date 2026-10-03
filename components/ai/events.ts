// Chatni istalgan joydan ochish (pastki panel, tugmalar) — panel kodi faqat shunda yuklanadi.
export const AI_OPEN_EVENT = "zk:ai-open";

export function openAiChat() {
  window.dispatchEvent(new Event(AI_OPEN_EVENT));
}
