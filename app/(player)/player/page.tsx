import type { Metadata } from "next"
import { db } from "@/lib/db"
import { PlayerArcade } from "@/components/brandquest/PlayerArcade"

export const metadata: Metadata = {
  title: "Arcade — BrandQuest",
}

export default async function PlayerDashboardPage() {
  const liveCampaigns = await db.listLiveCampaigns()

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Arcade</h1>
        <p className="text-sm text-muted-foreground">
          Discover playable campaigns and compete for real rewards.
        </p>
      </header>
      <PlayerArcade liveCampaigns={liveCampaigns} />
    </div>
  )
}
