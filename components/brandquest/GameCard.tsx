import Link from "next/link"
import { BarChart3, Gamepad2, Play, Timer, Users } from "lucide-react"
import type { Campaign } from "@/lib/db/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn, formatNumber, humanize, timeLeft } from "@/lib/utils"
import { RewardBadge } from "./RewardBadge"
import { WinnerRibbon } from "./WinnerRibbon"

interface GameCardProps {
  campaign: Campaign
  won?: boolean
  /** Sample cards are visually marked as previews, not real live campaigns. */
  sample?: boolean
}

const difficultyStyles: Record<string, string> = {
  easy: "text-neon",
  medium: "text-accent",
  hard: "text-reward",
}

export function GameCard({ campaign, won, sample }: GameCardProps) {
  const playHref = `/player/games/${campaign.campaignId}`
  const leaderboardHref = `/player/games/${campaign.campaignId}/leaderboard`

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-all hover:ring-primary/40 hover:glow-primary">
      {won ? <WinnerRibbon /> : null}

      {/* Thumbnail area */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-arcade-grid">
        {campaign.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={campaign.thumbnailUrl || "/placeholder.svg"}
            alt={`${campaign.title} thumbnail`}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Gamepad2 className="size-10 text-primary/50" aria-hidden="true" />
          </div>
        )}

        {/* Title top-left */}
        <div className="absolute left-3 top-3 max-w-[70%]">
          <h3 className="text-pretty text-sm font-bold leading-tight drop-shadow">
            {campaign.title}
          </h3>
        </div>

        {/* Template / custom label */}
        <Badge
          variant="secondary"
          className="absolute right-3 top-3 backdrop-blur"
        >
          {campaign.isCustom ? "Custom" : "Template"}
        </Badge>

        {/* Reward bottom-right */}
        <div className="absolute bottom-3 right-3">
          <RewardBadge reward={campaign.reward} size="sm" className="glow-reward" />
        </div>

        {sample ? (
          <Badge
            variant="outline"
            className="absolute bottom-3 left-3 border-border/60 bg-background/70 backdrop-blur"
          >
            Sample
          </Badge>
        ) : null}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="truncate font-medium text-foreground">
            {campaign.brandName}
          </span>
          <span className="truncate">{humanize(campaign.category)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className={cn("font-semibold", difficultyStyles[campaign.difficulty])}>
            {humanize(campaign.difficulty)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Play className="size-3" aria-hidden="true" />
            {campaign.maxAttemptsPerPlayer} tries
          </span>
          <span className="inline-flex items-center gap-1">
            <Timer className="size-3" aria-hidden="true" />
            {timeLeft(campaign.endDate)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3" aria-hidden="true" />
            {formatNumber(campaign.stats.registeredPlayers)}
          </span>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-1">
          <Button
            render={<Link href={playHref} />}
            size="sm"
            className="flex-1"
          >
            <Play className="size-3.5" aria-hidden="true" />
            Play
          </Button>
          <Button
            render={<Link href={leaderboardHref} />}
            size="sm"
            variant="outline"
          >
            <BarChart3 className="size-3.5" aria-hidden="true" />
            Ranks
          </Button>
        </div>
      </div>
    </article>
  )
}
