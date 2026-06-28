"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import {
  BarChart3,
  CheckCircle2,
  CircleDashed,
  Clock,
  MoreHorizontal,
  Pencil,
  Play,
  Square,
} from "lucide-react"
import type { Campaign, CampaignStatus } from "@/lib/db/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RewardBadge } from "./RewardBadge"
import { updateCampaignStatus } from "@/lib/campaigns/actions"
import { cn, formatDate, formatNumber, humanize, timeLeft } from "@/lib/utils"
import { toast } from "sonner"

const statusMeta: Record<
  CampaignStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  draft: { label: "Draft", icon: CircleDashed, className: "text-muted-foreground" },
  pending_review: { label: "Pending review", icon: Clock, className: "text-accent" },
  live: { label: "Live", icon: Play, className: "text-neon" },
  ended: { label: "Ended", icon: Square, className: "text-muted-foreground" },
}

export function CreatorCampaignList({ campaigns }: { campaigns: Campaign[] }) {
  const [filter, setFilter] = useState<CampaignStatus | "all">("all")
  const filtered =
    filter === "all" ? campaigns : campaigns.filter((c) => c.status === filter)

  const counts = campaigns.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          All ({campaigns.length})
        </FilterChip>
        {(["live", "draft", "ended"] as CampaignStatus[]).map((s) => (
          <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
            {statusMeta[s].label} ({counts[s] ?? 0})
          </FilterChip>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Players</TableHead>
              <TableHead className="text-right">Attempts</TableHead>
              <TableHead>Ends</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <CampaignRow key={c.campaignId} campaign={c} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function CampaignRow({ campaign }: { campaign: Campaign }) {
  const meta = statusMeta[campaign.status]
  const Icon = meta.icon
  const [isPending, startTransition] = useTransition()

  function changeStatus(status: CampaignStatus) {
    startTransition(async () => {
      const res = await updateCampaignStatus(campaign.campaignId, status)
      if (res.ok) toast.success(res.message)
      else toast.error(res.message)
    })
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span className="font-medium">{campaign.title}</span>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            {campaign.brandName} · {humanize(campaign.category)}
            <RewardBadge reward={campaign.reward} size="sm" />
          </span>
        </div>
      </TableCell>
      <TableCell>
        <span className={cn("inline-flex items-center gap-1.5 text-sm", meta.className)}>
          <Icon className="size-3.5" aria-hidden="true" />
          {meta.label}
        </span>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatNumber(campaign.stats.registeredPlayers)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatNumber(campaign.stats.totalAttempts)}
      </TableCell>
      <TableCell className="text-muted-foreground">
        <div className="flex flex-col">
          <span>{formatDate(campaign.endDate)}</span>
          <span className="text-xs">{timeLeft(campaign.endDate)}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <Button
            render={<Link href={`/creator/analytics/${campaign.campaignId}`} />}
            variant="ghost"
            size="sm"
          >
            <BarChart3 className="size-3.5" aria-hidden="true" />
            <span className="hidden lg:inline">Analytics</span>
          </Button>
          {campaign.status === "draft" ? (
            <Button size="sm" disabled={isPending} onClick={() => changeStatus("live")}>
              <Play className="size-3.5" aria-hidden="true" />
              Publish
            </Button>
          ) : campaign.status === "live" ? (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => changeStatus("ended")}
            >
              <Square className="size-3.5" aria-hidden="true" />
              End
            </Button>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}
