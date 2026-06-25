import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

/**
 * Reusable empty state. Used everywhere real data is absent (no campaigns yet,
 * no attempts yet, etc.) so the app never shows fabricated data.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Icon className="size-7" aria-hidden="true" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-balance">{title}</h3>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground text-pretty">
          {description}
        </p>
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  )
}
