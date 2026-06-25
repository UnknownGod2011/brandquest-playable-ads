import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Gamepad2 } from "lucide-react"
import { db } from "@/lib/db"
import { getSampleCampaign } from "@/lib/game-engine/sample-campaigns"
import { LeaderboardTable } from "@/components/brandquest/LeaderboardTable"
import { RewardBadge } from "@/components/brandquest/RewardBadge"
import { Button } from "@/components/ui/button"
import type { Campaign } from "@/lib/db/types"

export default async function GameLeaderboardPage({
  params,
}: {
  params: Promise<{ campaignId: string }>
}) {
  const { campaignId } = await params

  let campaign: Campaign | null = await db.getCampaign(campaignId)
  if (!campaign) campaign = getSampleCampaign(campaignId) ?? null
  if (!campaign) notFound()

  // Real leaderboard reads through the adapter; empty until DynamoDB is wired.
  const entries = await db.getLeaderboard(campaignId, 100)

  return (
    <div>
      <Link
        href={`/player/games/${campaignId}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to game
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-accent">{campaign.brandName}</p>
          <h1 className="text-balance text-2xl font-bold tracking-tight">
            {campaign.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Leaderboard · top {campaign.numberOfWinners} win the reward
          </p>
        </div>
        <RewardBadge reward={campaign.reward} />
      </div>

      <LeaderboardTable entries={entries} />

      <div className="mt-8 flex justify-center">
        <Button render={<Link href={`/player/games/${campaignId}`} />}>
          <Gamepad2 className="size-4" aria-hidden="true" />
          Play to climb the ranks
        </Button>
      </div>
    </div>
  )
}
