import type { Metadata } from "next"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/current-user"
import { SAMPLE_CAMPAIGNS } from "@/lib/game-engine/sample-campaigns"
import { PlayerArcade } from "@/components/brandquest/PlayerArcade"
import { PlayerStatsCard } from "@/components/brandquest/PlayerStatsCard"

export const metadata: Metadata = {
  title: "Arcade — BrandQuest",
}

export default async function PlayerDashboardPage() {
  const user = await getCurrentUser()
  // Real reads through the adapter. Empty until DynamoDB is connected.
  const [liveCampaigns, profile] = await Promise.all([
    db.listLiveCampaigns(),
    user ? db.getPlayerProfile(user.userId) : Promise.resolve(null),
  ])

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div className="order-2 lg:order-1">
        <header className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight">Arcade</h1>
          <p className="text-sm text-muted-foreground">
            Discover playable campaigns and compete for real rewards.
          </p>
        </header>
        <PlayerArcade
          liveCampaigns={liveCampaigns}
          sampleCampaigns={SAMPLE_CAMPAIGNS}
        />
      </div>

      <aside className="order-1 lg:order-2">
        <PlayerStatsCard profile={profile} />
      </aside>
    </div>
  )
}
