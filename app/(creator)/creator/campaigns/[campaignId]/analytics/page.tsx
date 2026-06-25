import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/current-user"
import { canEditCampaign } from "@/lib/security/permissions"
import { emptyAnalytics } from "@/lib/analytics/calculations"
import { AnalyticsDashboard } from "@/components/brandquest/AnalyticsDashboard"
import { RewardBadge } from "@/components/brandquest/RewardBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { humanize } from "@/lib/utils"

export default async function CampaignAnalyticsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>
}) {
  const { campaignId } = await params
  const user = await getCurrentUser()
  const campaign = await db.getCampaign(campaignId)

  // Without a database the campaign read is empty; show a clear empty-state
  // analytics view rather than a hard 404 so the page is explorable.
  if (campaign && !canEditCampaign(user, campaign)) notFound()

  const analytics =
    (campaign ? await db.getCampaignAnalytics(campaignId) : null) ??
    emptyAnalytics(campaignId)

  return (
    <div className="space-y-6">
      <Link
        href="/creator"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to dashboard
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-balance text-2xl font-bold tracking-tight">
            {campaign ? campaign.title : "Campaign analytics"}
          </h1>
          {campaign ? (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{campaign.brandName}</span>
              <Badge variant="secondary">{humanize(campaign.category)}</Badge>
              <Badge variant="outline" className="capitalize">
                {humanize(campaign.status)}
              </Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Connect DynamoDB to load this campaign and its live metrics.
            </p>
          )}
        </div>
        {campaign ? (
          <div className="flex items-center gap-2">
            <RewardBadge reward={campaign.reward} />
            <Button
              render={<Link href={`/player/games/${campaign.campaignId}/leaderboard`} />}
              variant="outline"
              size="sm"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
              Leaderboard
            </Button>
          </div>
        ) : null}
      </header>

      <AnalyticsDashboard analytics={analytics} />
    </div>
  )
}
