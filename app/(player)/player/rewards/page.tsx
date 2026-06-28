import type { Metadata } from "next"
import Link from "next/link"
import { Award } from "lucide-react"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/current-user"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/brandquest/EmptyState"
import { formatDate } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Rewards / Badges - BrandQuest",
}

export default async function RewardsPage() {
  const user = await getCurrentUser()
  const profile = user ? await db.getPlayerProfile(user.userId) : null
  const badges = profile?.badges ?? []

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Rewards / Badges</h1>
        <p className="text-sm text-muted-foreground">
          Reward achievements and badges earned from real campaign play.
        </p>
      </header>

      {badges.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No rewards or badges yet"
          description="Win campaigns and hit milestones to unlock badges and reward achievements."
          action={<Button render={<Link href="/player" />}>Find games to play</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge) => (
            <Card key={badge.id} className="flex flex-row items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-reward/15 text-reward">
                <Award className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium">{badge.name}</p>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Earned {formatDate(badge.earnedAt)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
