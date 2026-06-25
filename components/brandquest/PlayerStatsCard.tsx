import {
  Award,
  Flame,
  Gamepad2,
  Play,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react"
import type { PlayerProfile } from "@/lib/db/types"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatNumber } from "@/lib/utils"

const BADGE_ICONS: Record<string, LucideIcon> = {
  Play,
  Trophy,
  Flame,
  Gamepad2,
  Star,
  Award,
}

interface PlayerStatsCardProps {
  profile: PlayerProfile | null
}

/**
 * Player stats panel. When no profile exists yet (no DB / new player), renders a
 * helpful empty state instead of fabricated numbers.
 */
export function PlayerStatsCard({ profile }: PlayerStatsCardProps) {
  if (!profile) {
    return (
      <Card className="p-6">
        <h2 className="text-base font-semibold">Your stats</h2>
        <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-background/40 px-4 py-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Gamepad2 className="size-6" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium">No stats yet</p>
          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
            Start playing campaigns to build your profile — earn XP, level up,
            and collect badges.
          </p>
        </div>
      </Card>
    )
  }

  const xpPct = Math.round((profile.xp / Math.max(1, profile.xpToNextLevel)) * 100)

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Your stats</h2>
        <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
          Level {profile.level}
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <span>XP</span>
          <span className="tabular-nums">
            {formatNumber(profile.xp)} / {formatNumber(profile.xpToNextLevel)}
          </span>
        </div>
        <Progress value={xpPct} />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <Stat label="Games played" value={formatNumber(profile.gamesPlayed)} />
        <Stat label="Wins" value={formatNumber(profile.wins)} />
        <Stat
          label="Global rank"
          value={profile.globalRank ? `#${formatNumber(profile.globalRank)}` : "—"}
        />
        <Stat
          label="Rewards won"
          value={formatNumber(profile.totalRewardsWon)}
        />
      </dl>

      <div className="mt-5">
        <h3 className="text-xs font-medium text-muted-foreground">Badges</h3>
        {profile.badges.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            No badges yet — your first win earns one.
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.badges.map((badge) => {
              const Icon = BADGE_ICONS[badge.icon] ?? Award
              return (
                <span
                  key={badge.id}
                  title={badge.description}
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium"
                >
                  <Icon className="size-3.5 text-reward" aria-hidden="true" />
                  {badge.name}
                </span>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background/50 p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-lg font-bold tabular-nums">{value}</dd>
    </div>
  )
}
