import type { Metadata } from "next"
import Link from "next/link"
import { Gamepad2, Medal, Target, Trophy } from "lucide-react"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/current-user"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { StatGrid } from "@/components/brandquest/StatGrid"
import { EmptyState } from "@/components/brandquest/EmptyState"
import { formatNumber } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Profile / My Stats - BrandQuest",
}

export default async function PlayerProfilePage() {
  const user = await getCurrentUser()
  const profile = user ? await db.getPlayerProfile(user.userId) : null

  if (!profile) {
    return (
      <div className="space-y-6">
        <ProfileHeader name={user?.displayName ?? "Player"} />
        <EmptyState
          icon={Gamepad2}
          title="Start playing to build your stats"
          description="Play live campaigns to earn XP, level up, improve your rank, and unlock reward achievements."
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
          { label: "Best rank", value: profile.bestRank ? `#${profile.bestRank}` : "-", icon: Medal, accent: "accent" },
        ]}
      />
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
