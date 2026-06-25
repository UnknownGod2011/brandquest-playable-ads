import { Gift } from "lucide-react"
import { cn } from "@/lib/utils"

interface RewardBadgeProps {
  reward: string
  className?: string
  size?: "sm" | "default"
}

/**
 * Consistent accent reward badge. Always uses the dedicated --reward token so
 * rewards read identically across game cards, profiles, and leaderboards.
 */
export function RewardBadge({
  reward,
  className,
  size = "default",
}: RewardBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-reward font-semibold text-reward-foreground shadow-sm",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className,
      )}
    >
      <Gift className={size === "sm" ? "size-3" : "size-3.5"} aria-hidden="true" />
      <span className="truncate">{reward}</span>
    </span>
  )
}
