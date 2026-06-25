import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, BarChart3, Clock, Trophy } from "lucide-react"
import { db } from "@/lib/db"
import { getSampleCampaign } from "@/lib/game-engine/sample-campaigns"
import { getTemplate } from "@/lib/game-engine/templates"
import { GameShell } from "@/components/brandquest/GameShell"
import { RewardBadge } from "@/components/brandquest/RewardBadge"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { timeLeft, humanize } from "@/lib/utils"
import type { Campaign } from "@/lib/db/types"

export default async function GamePlayPage({
  params,
}: {
  params: Promise<{ campaignId: string }>
}) {
  const { campaignId } = await params

  // Live campaigns (through the adapter) take priority; fall back to the bundled
  // demo catalog so the play experience is always explorable before DynamoDB is
  // connected. Sample plays still run the full server-side validation flow.
  let campaign: Campaign | null = await db.getCampaign(campaignId)
  if (!campaign) campaign = getSampleCampaign(campaignId) ?? null
  if (!campaign) notFound()

  const template = getTemplate(campaign.templateType)
  const isSample = !db.isPersistent || campaign.creatorId === "sample-creator"

  return (
    <div>
      <Link
        href="/player"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to arcade
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-accent">{campaign.brandName}</span>
            <span className="text-muted-foreground">
              · {template?.name ?? humanize(campaign.templateType)}
            </span>
            {isSample ? (
              <Badge variant="outline" className="border-border/60">
                Sample
              </Badge>
            ) : null}
          </div>
          <h1 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
            {campaign.title}
          </h1>
          <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
            {campaign.description}
          </p>
        </div>
        <RewardBadge reward={campaign.reward} />
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" aria-hidden="true" />
          {timeLeft(campaign.endDate)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Trophy className="size-3.5 text-reward" aria-hidden="true" />
          {campaign.numberOfWinners} winner
          {campaign.numberOfWinners === 1 ? "" : "s"}
        </span>
        <Button
          render={<Link href={`/player/games/${campaign.campaignId}/leaderboard`} />}
          variant="ghost"
          size="sm"
          className="ml-auto"
        >
          <BarChart3 className="size-3.5" aria-hidden="true" />
          Leaderboard
        </Button>
      </div>

      <div className="mx-auto max-w-2xl">
        <GameShell campaign={campaign} />
      </div>
    </div>
  )
}
