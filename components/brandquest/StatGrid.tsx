import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface Stat {
  label: string
  value: string | number
  icon?: LucideIcon
  hint?: string
  accent?: "primary" | "accent" | "reward" | "neon" | "destructive"
}

const accentText: Record<NonNullable<Stat["accent"]>, string> = {
  primary: "text-primary",
  accent: "text-accent",
  reward: "text-reward",
  neon: "text-neon",
  destructive: "text-destructive",
}

interface StatGridProps {
  stats: Stat[]
  columns?: 2 | 3 | 4
  className?: string
}

/** Responsive grid of small KPI cards used across all dashboards. */
export function StatGrid({ stats, columns = 4, className }: StatGridProps) {
  const cols =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2 lg:grid-cols-4"

  return (
    <div className={cn("grid grid-cols-1 gap-3", cols, className)}>
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card
            key={stat.label}
            className="gap-0 p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </span>
              {Icon ? (
                <Icon
                  className={cn(
                    "size-4",
                    stat.accent ? accentText[stat.accent] : "text-muted-foreground",
                  )}
                  aria-hidden="true"
                />
              ) : null}
            </div>
            <div className="mt-2 text-2xl font-bold tabular-nums">
              {stat.value}
            </div>
            {stat.hint ? (
              <div className="mt-1 text-xs text-muted-foreground">{stat.hint}</div>
            ) : null}
          </Card>
        )
      })}
    </div>
  )
}
