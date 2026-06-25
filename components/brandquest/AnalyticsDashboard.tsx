"use client"

import {
  Activity,
  MousePointerClick,
  ShieldAlert,
  Target,
  Trophy,
  Users,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import type { CampaignAnalytics } from "@/lib/db/types"
import { Card } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { StatGrid } from "./StatGrid"
import { formatNumber } from "@/lib/utils"

const engagementConfig: ChartConfig = {
  value: { label: "Attempts", color: "var(--chart-1)" },
}
const distributionConfig: ChartConfig = {
  count: { label: "Players", color: "var(--chart-2)" },
}

const FUNNEL_STEPS: { key: keyof CampaignAnalytics["funnel"]; label: string }[] = [
  { key: "viewedCampaign", label: "Viewed campaign" },
  { key: "startedGame", label: "Started game" },
  { key: "submittedAttempt", label: "Submitted attempt" },
  { key: "reachedLeaderboard", label: "Reached leaderboard" },
  { key: "claimedReward", label: "Claimed reward" },
]

export function AnalyticsDashboard({
  analytics,
}: {
  analytics: CampaignAnalytics
}) {
  const hasData = analytics.totalAttempts > 0
  const topFunnel = Math.max(1, analytics.funnel.viewedCampaign)

  return (
    <div className="space-y-6">
      <StatGrid
        columns={4}
        stats={[
          { label: "Unique players", value: formatNumber(analytics.uniquePlayers), icon: Users, accent: "primary" },
          { label: "Total attempts", value: formatNumber(analytics.totalAttempts), icon: Target, accent: "accent" },
          { label: "Completion rate", value: `${analytics.completionRate}%`, icon: Activity, accent: "neon" },
          { label: "Top score", value: formatNumber(analytics.topScore), icon: Trophy, accent: "reward" },
        ]}
      />
      <StatGrid
        columns={4}
        stats={[
          { label: "Avg attempts/player", value: analytics.averageAttemptsPerPlayer, icon: Target },
          { label: "Repeat play rate", value: `${analytics.repeatPlayRate}%`, icon: Activity },
          { label: "Brand click-throughs", value: formatNumber(analytics.brandClickThroughs), icon: MousePointerClick, accent: "primary" },
          { label: "Suspicious attempts", value: formatNumber(analytics.suspiciousAttempts), icon: ShieldAlert, accent: "destructive" },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-4 p-5">
          <h3 className="font-semibold">Engagement over time</h3>
          {hasData && analytics.engagementOverTime.length > 0 ? (
            <ChartContainer config={engagementConfig} className="h-64 w-full">
              <AreaChart data={analytics.engagementOverTime}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <defs>
                  <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area
                  dataKey="value"
                  type="monotone"
                  stroke="var(--color-value)"
                  fill="url(#fillValue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <ChartEmpty />
          )}
        </Card>

        <Card className="gap-4 p-5">
          <h3 className="font-semibold">Attempts per player</h3>
          {hasData && analytics.attemptDistribution.length > 0 ? (
            <ChartContainer config={distributionConfig} className="h-64 w-full">
              <BarChart data={analytics.attemptDistribution}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <ChartEmpty />
          )}
        </Card>
      </div>

      <Card className="gap-4 p-5">
        <h3 className="font-semibold">Conversion funnel</h3>
        {hasData ? (
          <div className="space-y-3">
            {FUNNEL_STEPS.map((step) => {
              const value = analytics.funnel[step.key]
              const pct = Math.round((value / topFunnel) * 100)
              return (
                <div key={step.key}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{step.label}</span>
                    <span className="font-medium tabular-nums">
                      {formatNumber(value)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <ChartEmpty />
        )}
      </Card>
    </div>
  )
}

function ChartEmpty() {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg bg-secondary/30 text-center">
      <Activity className="size-6 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">No data yet</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        Metrics populate as players engage. Connect DynamoDB to capture and
        display live analytics.
      </p>
    </div>
  )
}
