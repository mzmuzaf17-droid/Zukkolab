import { brand } from "@/brand.config";
import { Link } from "@/lib/i18n/navigation";

export function Logo() {
  return (
    <Link
      href="/"
      className="font-display inline-flex items-center text-xl font-bold"
      aria-label={brand.name}
    >
      {brand.wordmark.first}
      <span className="bg-cta text-ink ml-0.5 rounded-md px-1.5">{brand.wordmark.second}</span>
    </Link>
  );
}
