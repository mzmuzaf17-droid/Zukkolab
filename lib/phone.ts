// Oʻzbekiston raqamlari: +998 va 9 xonali milliy raqam (FR-SITE-04). Saqlash formati — E.164.
const UZ_NATIONAL =
  /^(33|50|55|61|62|65|66|67|69|70|71|72|73|74|75|76|77|78|79|88|90|91|93|94|95|97|98|99)\d{7}$/;

export function normalizeUzPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("998")) digits = digits.slice(3);
  else if (digits.startsWith("8") && digits.length === 10) digits = digits.slice(1);
  if (!UZ_NATIONAL.test(digits)) return null;
  return `+998${digits}`;
}

// +998901234567 → +998 (90) 123-45-67
export function formatUzPhone(e164: string): string {
  const d = e164.replace(/^\+998/, "");
  if (d.length !== 9) return e164;
  return `+998 (${d.slice(0, 2)}) ${d.slice(2, 5)}-${d.slice(5, 7)}-${d.slice(7)}`;
}

// Kiritish maskasi: "+998 (__) ___-__-__" (FR-SITE-04). Har bosishda qisman formatlaydi.
export function maskUzPhone(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("998")) digits = digits.slice(3);
  digits = digits.slice(0, 9);
  let out = "+998";
  if (digits.length > 0) out += ` (${digits.slice(0, 2)}`;
  if (digits.length >= 2) out += ")";
  if (digits.length > 2) out += ` ${digits.slice(2, 5)}`;
  if (digits.length > 5) out += `-${digits.slice(5, 7)}`;
  if (digits.length > 7) out += `-${digits.slice(7, 9)}`;
  return out;
}
