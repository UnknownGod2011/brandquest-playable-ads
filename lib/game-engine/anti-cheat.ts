/**
 * BrandQuest — Server-side anti-cheat & score validation
 *
 * This module is the heart of "scores are validated server-side". It is called
 * exclusively from server code (the /api/attempts route + server actions). The
 * client NEVER decides whether a score counts.
 *
 * Validation rules enforced here:
 *   - Reject attempts submitted after the campaign end date.
 *   - Reject attempts beyond maxAttemptsPerPlayer.
 *   - Reject duplicate attempt IDs.
 *   - Reject impossible scores (above the template's max plausible score).
 *   - Flag impossible duration (too fast to be human / negative).
 *   - Flag suspiciously high score-per-second rates.
 */

import type {
  Campaign,
  SuspicionFlag,
  AttemptValidationStatus,
} from "@/lib/db/types"
import { maxPlausibleScore } from "./scoring"

export interface ValidationContext {
  campaign: Campaign
  score: number
  durationSeconds: number
  existingAttemptCount: number
  isDuplicateAttemptId: boolean
  now?: Date
}

export interface ValidationResult {
  status: AttemptValidationStatus
  flags: SuspicionFlag[]
  /** Human-readable reasons, safe to surface to the client. */
  reasons: string[]
  rewardEligible: boolean
}

const ABSOLUTE_MIN_DURATION_SECONDS = 1

export function validateAttempt(ctx: ValidationContext): ValidationResult {
  const { campaign, score, durationSeconds, existingAttemptCount, isDuplicateAttemptId } = ctx
  const now = ctx.now ?? new Date()
  const flags: SuspicionFlag[] = []
  const reasons: string[] = []

  // --- Hard rejections ---------------------------------------------------
  if (isDuplicateAttemptId) {
    flags.push("duplicate_submission")
    reasons.push("Duplicate attempt ID — this attempt was already submitted.")
    return reject(flags, reasons)
  }

  if (new Date(campaign.endDate).getTime() < now.getTime()) {
    flags.push("after_campaign_end")
    reasons.push("Campaign has already ended.")
    return reject(flags, reasons)
  }

  if (existingAttemptCount >= campaign.maxAttemptsPerPlayer) {
    flags.push("too_many_attempts")
    reasons.push(
      `Maximum of ${campaign.maxAttemptsPerPlayer} attempt(s) per player reached.`,
    )
    return reject(flags, reasons)
  }

  const maxScore = maxPlausibleScore(campaign.templateConfig)
  if (!Number.isFinite(score) || score < 0 || score > maxScore) {
    flags.push("impossible_score")
    reasons.push(`Score is outside the plausible range (0–${maxScore}).`)
    return reject(flags, reasons)
  }

  // --- Soft flags (accepted but marked suspicious) -----------------------
  const minDuration =
    campaign.templateConfig.minDurationSeconds ?? ABSOLUTE_MIN_DURATION_SECONDS
  if (!Number.isFinite(durationSeconds) || durationSeconds < minDuration) {
    flags.push("impossible_duration")
    reasons.push("Completed faster than humanly possible.")
  }

  const maxScorePerSecond =
    campaign.templateConfig.maxScorePerSecond ?? maxScore // permissive default
  if (durationSeconds > 0 && score / durationSeconds > maxScorePerSecond) {
    flags.push("impossible_score")
    reasons.push("Score accumulated faster than the game allows.")
  }

  if (flags.length > 0) {
    return {
      status: "flagged",
      flags,
      reasons,
      rewardEligible: false,
    }
  }

  return {
    status: "validated",
    flags: [],
    reasons: ["Score validated."],
    rewardEligible: true,
  }
}

function reject(flags: SuspicionFlag[], reasons: string[]): ValidationResult {
  return { status: "rejected", flags, reasons, rewardEligible: false }
}
