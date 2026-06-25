/**
 * BrandQuest — Scoring helpers
 *
 * Pure functions used by both the client shells (for live feedback) and the
 * server (as a reference when validating). The authoritative score is always
 * re-derivable / bounded server-side; the client value is never trusted blindly
 * (see lib/game-engine/anti-cheat.ts).
 */

import type { ScoringType, TemplateConfig } from "@/lib/db/types"

export interface NormalizedScoreInput {
  raw: number
  durationSeconds: number
  scoringType: ScoringType
  config: TemplateConfig
}

/**
 * Returns the maximum plausible score for a config. Used to reject impossible
 * scores. Falls back to a generous default when not specified.
 */
export function maxPlausibleScore(config: TemplateConfig): number {
  if (typeof config.maxPossibleScore === "number" && config.maxPossibleScore > 0) {
    return config.maxPossibleScore
  }
  if (config.questions?.length) {
    return config.questions.length * 100
  }
  if (config.reactionTargets) {
    return config.reactionTargets * 100
  }
  if (config.memoryPairs) {
    return config.memoryPairs * 100
  }
  return 10_000
}

/** Brand Quiz: 100 points per correct answer, small speed bonus. */
export function scoreBrandQuiz(
  correctCount: number,
  durationSeconds: number,
  timeLimitSeconds: number,
): number {
  const base = correctCount * 100
  const speedBonus = Math.max(
    0,
    Math.round((1 - durationSeconds / Math.max(1, timeLimitSeconds)) * 50),
  )
  return base + speedBonus
}

/** Reaction Tap: each hit is worth points scaled by reaction speed. */
export function scoreReactionTap(hits: number, misses: number): number {
  return Math.max(0, hits * 100 - misses * 25)
}

/** Memory Match: rewards completion with fewer flips and faster time. */
export function scoreMemoryMatch(
  pairs: number,
  flips: number,
  durationSeconds: number,
): number {
  const perfectFlips = pairs * 2
  const efficiency = Math.min(1, perfectFlips / Math.max(perfectFlips, flips))
  const timePenalty = Math.min(0.5, durationSeconds / 600)
  return Math.round(pairs * 100 * efficiency * (1 - timePenalty))
}

/** Whether higher or lower values are better for ranking purposes. */
export function isHigherBetter(scoringType: ScoringType): boolean {
  return scoringType !== "time"
}
