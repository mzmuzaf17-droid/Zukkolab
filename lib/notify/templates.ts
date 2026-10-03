import { formatUzPhone } from "@/lib/phone";

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export type LeadCard = {
  fullName: string;
  phone: string;
  direction?: string | null;
  source: string;
  operator: boolean;
  demo: boolean;
  booking?: string | null;
  student?: string | null;
  test?: string | null;
};

// Menejerlar guruhidagi lid kartasi (7-bo'lim): ism, telefon (tel: havola), yo'nalish, manba, test, bron.
export function leadCardText(card: LeadCard, t: (key: string) => string): string {
  const lines = [`<b>${t("newLead")}</b>${card.demo ? ` · ${t("demo")}` : ""}`];
  if (card.operator) lines.push(t("operator"));
  lines.push(
    `${t("name")}: <b>${escapeHtml(card.fullName)}</b>`,
    `${t("phone")}: <a href="tel:${card.phone}">${formatUzPhone(card.phone)}</a>`,
  );
  if (card.student) lines.push(`${t("student")}: ${escapeHtml(card.student)}`);
  if (card.direction) lines.push(`${t("direction")}: ${escapeHtml(card.direction)}`);
  if (card.booking) lines.push(`${t("booking")}: ${escapeHtml(card.booking)}`);
  if (card.test) lines.push(`${t("test")}: ${escapeHtml(card.test)}`);
  lines.push(`${t("source")}: ${escapeHtml(card.source)}`);
  return lines.join("\n");
}
