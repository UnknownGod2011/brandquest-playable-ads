import type { Metadata } from "next"
import Link from "next/link"
import { Trophy } from "lucide-react"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/brandquest/EmptyState"
import { RewardBadge } from "@/components/brandquest/RewardBadge"
import { formatNumber, timeLeft } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Leaderboards - BrandQuest",
}

export default async function PlayerLeaderboardsPage() {
  const campaigns = await db.listLiveCampaigns()

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Leaderboards</h1>
        <p className="text-sm text-muted-foreground">
          Open campaign leaderboards and climb validated score rankings.
        </p>
      </header>

      {campaigns.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No active leaderboards"
          description="Live campaign leaderboards will appear here after creators publish games."
          action={<Button render={<Link href="/player" />}>Back to arcade</Button>}
        />
      ) : (
        <div className="grid gap-3">
          {campaigns.map((campaign) => (
            <Card
              key={campaign.campaignId}
              className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium">{campaign.title}</p>
                <p className="text-xs text-muted-foreground">
                  {campaign.brandName} - {formatNumber(campaign.stats.registeredPlayers)} players - {timeLeft(campaign.endDate)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <RewardBadge reward={campaign.reward} size="sm" />
                <Button
                  render={<Link href={`/player/games/${campaign.campaignId}/leaderboard`} />}
                  size="sm"
                  variant="outline"
                >
                  View board
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
