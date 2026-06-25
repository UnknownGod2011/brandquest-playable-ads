import type { Metadata } from "next"
import Link from "next/link"
import { Megaphone, Plus, Sparkles, Target, Trophy, Users } from "lucide-react"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/current-user"
import { Button } from "@/components/ui/button"
import { StatGrid } from "@/components/brandquest/StatGrid"
import { EmptyState } from "@/components/brandquest/EmptyState"
import { CreatorCampaignList } from "@/components/brandquest/CreatorCampaignList"
import { formatNumber } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Creator dashboard — BrandQuest",
}

export default async function CreatorDashboardPage() {
  const user = await getCurrentUser()
  const campaigns = user ? await db.getCampaignsByCreator(user.userId) : []

  const totals = campaigns.reduce(
    (acc, c) => {
      acc.players += c.stats.registeredPlayers
      acc.attempts += c.stats.totalAttempts
      acc.live += c.status === "live" ? 1 : 0
      return acc
    },
    { players: 0, attempts: 0, live: 0 },
  )

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Creator dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Launch playable ad campaigns and track engagement.
          </p>
        </div>
        <div className="flex gap-2">
          <Button render={<Link href="/creator/custom-games" />} variant="outline">
            <Sparkles className="size-4" aria-hidden="true" />
            Custom games
          </Button>
          <Button render={<Link href="/creator/campaigns/new" />}>
            <Plus className="size-4" aria-hidden="true" />
            New campaign
          </Button>
        </div>
      </header>

      <StatGrid
        columns={4}
        stats={[
          { label: "Campaigns", value: formatNumber(campaigns.length), icon: Megaphone, accent: "primary" },
          { label: "Live now", value: formatNumber(totals.live), icon: Target, accent: "neon" },
          { label: "Total players", value: formatNumber(totals.players), icon: Users, accent: "accent" },
          { label: "Total attempts", value: formatNumber(totals.attempts), icon: Trophy, accent: "reward" },
        ]}
      />

      {campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No campaigns yet"
          description="Create your first playable ad campaign from a game template, or submit a custom game for review. Connect DynamoDB to persist and go live."
          action={
            <Button render={<Link href="/creator/campaigns/new" />}>
              <Plus className="size-4" aria-hidden="true" />
              Create a campaign
            </Button>
          }
        />
      ) : (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Your campaigns</h2>
          <CreatorCampaignList campaigns={campaigns} />
        </section>
      )}
    </div>
  )
}
