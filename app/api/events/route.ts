import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/lib/auth/current-user"
import { track, ANALYTICS_EVENT_TYPES } from "@/lib/analytics/events"
import { rateLimit } from "@/lib/security/rate-limit"
import type { AnalyticsEventType } from "@/lib/db/types"

const clientEventSchema = z.object({
  type: z.enum(ANALYTICS_EVENT_TYPES as [AnalyticsEventType, ...AnalyticsEventType[]]),
  campaignId: z.string().min(1).max(120).optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
})

const CLIENT_ALLOWED_EVENTS: AnalyticsEventType[] = ["game_started"]

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 })
  }

  const limit = rateLimit(`event:${user.userId}`, 60, 60_000)
  if (!limit.allowed) {
    return NextResponse.json({ ok: false, error: "Too many events." }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = clientEventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid event payload." }, { status: 400 })
  }

  if (!CLIENT_ALLOWED_EVENTS.includes(parsed.data.type)) {
    return NextResponse.json({ ok: false, error: "Event is not client-writeable." }, { status: 403 })
  }

  await track({
    type: parsed.data.type,
    campaignId: parsed.data.campaignId,
    playerId: user.role === "player" ? user.userId : undefined,
    creatorId: user.role === "creator" ? user.userId : undefined,
    metadata: parsed.data.metadata,
  })

  return NextResponse.json({ ok: true })
}
