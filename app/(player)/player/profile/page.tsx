import type { Metadata } from "next"
import Link from "next/link"
import { Gamepad2, Target, Trophy, Award, Medal } from "lucide-react"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/current-user"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { StatGrid } from "@/components/brandquest/StatGrid"
import { GameCard } from "@/components/brandquest/GameCard"
import { EmptyState } from "@/components/brandquest/EmptyState"
import { formatNumber } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Profile — BrandQuest",
}

export default async function PlayerProfilePage() {
  const user = await getCurrentUser()
  const [profile, played] = await Promise.all([
    user ? db.getPlayerProfile(user.userId) : Promise.resolve(null),
    user ? db.getCampaignsPlayed(user.userId) : Promise.resolve([]),
  ])

  if (!profile) {
    return (
      <div className="space-y-6">
        <ProfileHeader name={user?.displayName ?? "Player"} />
        <EmptyState
          icon={Gamepad2}
          title="Start playing to build your profile"
          description="Play campaigns to earn XP, level up, win rewards, and collect badges. Your stats and won games will appear here."
          action={
            <Button render={<Link href="/player" />}>Browse the arcade</Button>
          }
        />
      </div>
    )
  }

  const xpPct = Math.round((profile.xp / Math.max(1, profile.xpToNextLevel)) * 100)

  return (
    <div className="space-y-8">
      <ProfileHeader name={profile.displayName} level={profile.level} />

      <Card className="p-6">
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="font-medium">Level {profile.level}</span>
          <span className="tabular-nums text-muted-foreground">
            {formatNumber(profile.xp)} / {formatNumber(profile.xpToNextLevel)} XP
          </span>
        </div>
        <Progress value={xpPct} />
      </Card>

      <StatGrid
        columns={4}
        stats={[
          { label: "Games played", value: formatNumber(profile.gamesPlayed), icon: Gamepad2, accent: "primary" },
          { label: "Total attempts", value: formatNumber(profile.totalAttempts), icon: Target },
          { label: "Wins", value: formatNumber(profile.wins), icon: Trophy, accent: "reward" },
          { label: "Best rank", value: profile.bestRank ? `#${profile.bestRank}` : "—", icon: Medal, accent: "accent" },
        ]}
      />

      <section>
        <h2 className="mb-3 text-lg font-semibold">Badge collection</h2>
        {profile.badges.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No badges yet"
            description="Win campaigns and hit milestones to start your badge collection."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {profile.badges.map((b) => (
              <Card key={b.id} className="flex flex-row items-center gap-3 p-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-reward/15 text-reward">
                  <Award className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.description}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Games played</h2>
        {played.length === 0 ? (
          <EmptyState
            icon={Gamepad2}
            title="No games played yet"
            description="Campaigns you participate in will show here, with a WINNER ribbon on the ones you win."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {played.map((c) => (
              <GameCard key={c.campaignId} campaign={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function ProfileHeader({ name, level }: { name: string; level?: number }) {
  return (
    <header className="flex items-center gap-4">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-xl font-bold text-primary">
        {name.charAt(0).toUpperCase()}
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
        <p className="text-sm text-muted-foreground">
          {level ? `Level ${level} player` : "New player"}
        </p>
      </div>
    </header>
  )
}
