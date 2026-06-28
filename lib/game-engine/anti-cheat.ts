/**
 * BrandQuest - Server-side anti-cheat and score validation.
 *
 * The client can play a game and report a score, but this module decides
 * whether the score is plausible before persistence and leaderboard placement.
 */

import type {
  AttemptValidationStatus,
  Campaign,
  SuspicionFlag,
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
  reasons: string[]
  rewardEligible: boolean
}

const ABSOLUTE_MIN_DURATION_SECONDS = 1

export function validateAttempt(ctx: ValidationContext): ValidationResult {
  const { campaign, score, durationSeconds, existingAttemptCount, isDuplicateAttemptId } =
    ctx
  const now = ctx.now ?? new Date()
  const flags: SuspicionFlag[] = []
  const reasons: string[] = []

  if (isDuplicateAttemptId) {
    flags.push("duplicate_submission")
    reasons.push("Duplicate attempt ID. This attempt was already submitted.")
    return reject(flags, reasons)
  }

  if (campaign.status !== "live") {
    reasons.push("Campaign is not live.")
    return reject(flags, reasons)
  }

  if (new Date(campaign.startDate).getTime() > now.getTime()) {
    flags.push("before_campaign_start")
    reasons.push("Campaign has not started yet.")
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
    reasons.push(`Score is outside the plausible range (0-${maxScore}).`)
    return reject(flags, reasons)
  }

  const minDuration =
    campaign.templateConfig.minDurationSeconds ?? ABSOLUTE_MIN_DURATION_SECONDS
  if (!Number.isFinite(durationSeconds) || durationSeconds < minDuration) {
    flags.push("impossible_duration")
    reasons.push("Completed faster than humanly possible.")
  }

  const maxScorePerSecond =
    campaign.templateConfig.maxScorePerSecond ?? maxScore
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
