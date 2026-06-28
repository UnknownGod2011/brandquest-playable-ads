import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/current-user"
import { submitAttemptSchema } from "@/lib/validation/attempt"
import { validateAttempt } from "@/lib/game-engine/anti-cheat"
import { isPlayable } from "@/lib/game-engine/templates"
import { rateLimit } from "@/lib/security/rate-limit"
import { canSubmitAttempt } from "@/lib/security/permissions"
import { track } from "@/lib/analytics/events"
import type { Campaign, GameAttempt } from "@/lib/db/types"

/**
 * POST /api/attempts — the ONLY authoritative scoring endpoint.
 *
 * The client plays the game and reports a number. The server re-validates the
 * score against the template's plausible max, runs anti-cheat heuristics
 * (lib/game-engine/anti-cheat.ts), persists the attempt, and only then is the
 * score eligible for the leaderboard. A score never "counts" client-side.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { ok: false, status: "rejected", reasons: ["You must be signed in to play."], score: 0, persisted: false },
      { status: 401 },
    )
  }
  if (!canSubmitAttempt(user)) {
    return NextResponse.json(
      { ok: false, status: "rejected", reasons: ["You do not have permission to submit scores."], score: 0, persisted: false },
      { status: 403 },
    )
  }

  // Per-user rate limit to blunt automated submission floods.
  const limit = rateLimit(`attempt:${user.userId}`, 30, 60_000)
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, status: "rejected", reasons: ["Too many attempts. Please slow down."], score: 0, persisted: false },
      { status: 429 },
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = submitAttemptSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, status: "rejected", reasons: ["Invalid attempt payload."], score: 0, persisted: false },
      { status: 400 },
    )
  }

  const input = parsed.data

  const campaign: Campaign | null = await db.getCampaign(input.campaignId)
  if (!campaign) {
    return NextResponse.json(
      { ok: false, status: "rejected", reasons: ["Campaign not found."], score: 0, persisted: false },
      { status: 404 },
    )
  }
  if (campaign.status !== "live") {
    return NextResponse.json(
      { ok: false, status: "rejected", reasons: ["Campaign is not live."], score: 0, persisted: false },
      { status: 400 },
    )
  }
  if (!isPlayable(campaign.templateType)) {
    return NextResponse.json(
      { ok: false, status: "rejected", reasons: ["Campaign template is not playable."], score: 0, persisted: false },
      { status: 400 },
    )
  }

  // Gather server-side context for validation.
  const [existingAttemptCount, isDuplicateAttemptId] = await Promise.all([
    db.countPlayerAttempts(campaign.campaignId, user.userId),
    db.hasAttemptId(input.attemptId),
  ])

  // Authoritative validation + anti-cheat.
  const verdict = validateAttempt({
    campaign,
    score: input.score,
    durationSeconds: input.durationSeconds,
    existingAttemptCount,
    isDuplicateAttemptId,
  })

  const attempt: GameAttempt = {
    attemptId: input.attemptId,
    campaignId: campaign.campaignId,
    playerId: user.userId,
    playerName: user.displayName,
    score: input.score,
    durationSeconds: input.durationSeconds,
    attemptNumber: existingAttemptCount + 1,
    validationStatus: verdict.status,
    flags: verdict.flags,
    submittedAt: new Date().toISOString(),
  }

  let persisted = false
  if (verdict.status !== "rejected") {
    try {
      await db.submitAttempt(attempt)
      persisted = db.isPersistent
      await track({
        type: "attempt_submitted",
        campaignId: campaign.campaignId,
        playerId: user.userId,
        metadata: { status: verdict.status, score: input.score },
      })
      if (verdict.status === "validated") {
        await track({
          type: "score_validated",
          campaignId: campaign.campaignId,
          playerId: user.userId,
          metadata: { score: input.score },
        })
      }
      await track({
        type: "leaderboard_updated",
        campaignId: campaign.campaignId,
        playerId: user.userId,
        metadata: { score: input.score },
      })
    } catch {
      return NextResponse.json(
        { ok: false, status: "rejected", reasons: ["Could not persist this attempt."], score: input.score, persisted: false },
        { status: 500 },
      )
    }
  }

  return NextResponse.json({
    ok: true,
    status: verdict.status,
    reasons: verdict.reasons,
    score: input.score,
    persisted,
  })
}
