import { CheckCircle2, Flag, ShieldCheck, Trophy, XCircle } from "lucide-react"
import type { AttemptValidationStatus, LeaderboardEntry } from "@/lib/db/types"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "./EmptyState"
import { formatDate } from "@/lib/utils"

const statusMeta: Record<
  AttemptValidationStatus,
  { label: string; icon: typeof CheckCircle2; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  validated: { label: "Validated", icon: CheckCircle2, variant: "secondary" },
  flagged: { label: "Flagged", icon: Flag, variant: "outline" },
  rejected: { label: "Rejected", icon: XCircle, variant: "destructive" },
  pending: { label: "Pending", icon: ShieldCheck, variant: "outline" },
}

const podiumColors = ["text-reward", "text-muted-foreground", "text-accent"]

export function LeaderboardTable({
  entries,
}: {
  entries: LeaderboardEntry[]
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="No validated scores yet"
        description="Be the first to play this campaign. Scores are validated server-side before leaderboard placement."
      />
    )
  }

  const podium = entries.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Top 3 podium */}
      <div className="grid gap-3 sm:grid-cols-3">
        {podium.map((entry, i) => (
          <div
            key={entry.playerId + entry.submittedAt}
            className="flex flex-col items-center gap-2 rounded-2xl bg-card p-5 text-center ring-1 ring-foreground/10"
          >
            <Trophy className={`size-7 ${podiumColors[i]}`} aria-hidden="true" />
            <span className="text-xs font-semibold text-muted-foreground">
              Rank #{entry.rank}
            </span>
            <span className="font-bold">{entry.playerName}</span>
            <span className="text-2xl font-bold tabular-nums text-primary">
              {entry.score.toLocaleString()}
            </span>
            {entry.rewardEligible ? (
              <Badge className="bg-reward text-reward-foreground">
                Reward zone
              </Badge>
            ) : null}
          </div>
        ))}
      </div>

      {/* Full table */}
      <div className="rounded-2xl bg-card p-2 ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-right">Time</TableHead>
              <TableHead className="text-right">Tries</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Reward</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const meta = statusMeta[entry.validationStatus]
              const Icon = meta.icon
              return (
                <TableRow key={entry.playerId + entry.submittedAt}>
                  <TableCell className="font-semibold tabular-nums">
                    {entry.rank}
                  </TableCell>
                  <TableCell className="font-medium">{entry.playerName}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {entry.score.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {entry.durationSeconds}s
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {entry.attemptsUsed}
                  </TableCell>
                  <TableCell>
                    <Badge variant={meta.variant} className="gap-1">
                      <Icon className="size-3" aria-hidden="true" />
                      {meta.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(entry.submittedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.rewardEligible ? (
                      <span className="text-xs font-semibold text-reward">
                        Eligible
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5" aria-hidden="true" />
        Scores are validated server-side before leaderboard placement.
      </p>
    </div>
  )
}
