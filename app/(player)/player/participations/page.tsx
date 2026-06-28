import type { Metadata } from "next"
import Link from "next/link"
import { Gamepad2 } from "lucide-react"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/current-user"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/brandquest/EmptyState"
import { GameCard } from "@/components/brandquest/GameCard"

export const metadata: Metadata = {
  title: "Participated Games - BrandQuest",
}

export default async function ParticipatedGamesPage() {
  const user = await getCurrentUser()
  const campaigns = user ? await db.getCampaignsPlayed(user.userId) : []

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Participated Games</h1>
        <p className="text-sm text-muted-foreground">
          Campaigns you have played will appear here with your history.
        </p>
      </header>

      {campaigns.length === 0 ? (
        <EmptyState
          icon={Gamepad2}
          title="No participated games yet"
          description="Play a live campaign to start building your participation history."
          action={<Button render={<Link href="/player" />}>Browse the arcade</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <GameCard key={campaign.campaignId} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  )
}
