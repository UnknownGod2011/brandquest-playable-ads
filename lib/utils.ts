import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Generates a prefixed, collision-resistant id (e.g. "camp_l9x...z"). */
export function generateId(prefix = "id"): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2) + Date.now().toString(36)
  return `${prefix}_${rand}`
}

/** Formats a number with locale separators (e.g. 12345 -> "12,345"). */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n)
}

/** Compact currency-ish formatting for reward values (e.g. 1500 -> "$1.5K"). */
export function formatValue(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n}`
}

/** Human "time left" until an ISO date, or "Ended". */
export function timeLeft(endISO: string, now = Date.now()): string {
  const diff = new Date(endISO).getTime() - now
  if (diff <= 0) return "Ended"
  const days = Math.floor(diff / 86_400_000)
  if (days >= 1) return `${days}d left`
  const hours = Math.floor(diff / 3_600_000)
  if (hours >= 1) return `${hours}h left`
  const mins = Math.floor(diff / 60_000)
  return `${mins}m left`
}

/** Formats an ISO date as a short readable date. */
export function formatDate(iso: string): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/** Title-cases a snake_case enum value (e.g. "food_beverage" -> "Food Beverage"). */
export function humanize(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}
