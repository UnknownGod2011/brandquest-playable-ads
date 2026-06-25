import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"

/**
 * GET /api/leaderboard/[campaignId] — public, validated leaderboard.
 *
 * Only server-validated scores appear here (see /api/attempts + anti-cheat).
 * Safe with the no-op adapter (returns an empty array).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const { campaignId } = await params
  const { searchParams } = new URL(req.url)
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit") ?? 50), 1),
    200,
  )

  const entries = await db.getLeaderboard(campaignId, limit)

  return NextResponse.json({
    ok: true,
    persistent: db.isPersistent,
    campaignId,
    count: entries.length,
    entries,
  })
}
