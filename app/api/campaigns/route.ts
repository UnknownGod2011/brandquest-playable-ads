import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import type { CampaignFilter, CampaignSort } from "@/lib/db"

/**
 * GET /api/campaigns — list live campaigns with optional filtering/sorting.
 *
 * Read-only and safe with the no-op adapter (returns an empty list). Live data
 * is served once DynamoDB is connected.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const filter: CampaignFilter = {
    category: searchParams.get("category") ?? undefined,
    difficulty: searchParams.get("difficulty") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    sort: (searchParams.get("sort") as CampaignSort) ?? undefined,
    templateKind:
      (searchParams.get("kind") as "template" | "custom" | null) ?? undefined,
  }

  const campaigns = await db.listLiveCampaigns(filter)

  return NextResponse.json({
    ok: true,
    persistent: db.isPersistent,
    count: campaigns.length,
    campaigns,
  })
}
