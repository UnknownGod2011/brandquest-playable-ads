/**
 * BrandQuest — Scoring helpers
 *
 * Pure functions used by both the client shells (for live feedback) and the
 * server (as a reference when validating). The authoritative score is always
 * re-derivable / bounded server-side; the client value is never trusted blindly
 * (see lib/game-engine/anti-cheat.ts).
 */

import type {
  Campaign,
  GameAttempt,
  LeaderboardMetric,
  ScoringType,
  TemplateConfig,
} from "@/lib/db/types"

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
  if (config.scrambleWords?.length) {
    return config.scrambleWords.length * 150
  }
  if (config.patternRounds) {
    return config.patternRounds * 200
  }
  if (config.runnerDurationSeconds) {
    return Math.max(1, config.runnerDurationSeconds) * 100
  }
  if (config.beatTilesDurationSeconds) {
    return Math.max(1, config.beatTilesDurationSeconds) * 150
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

/** Word Scramble: correct words plus a speed bonus. */
export function scoreWordScramble(
  solvedWords: number,
  totalWords: number,
  durationSeconds: number,
  timeLimitSeconds: number,
): number {
  const base = solvedWords * 100
  const completionBonus = solvedWords === totalWords ? 100 : 0
  const speedBonus = Math.max(
    0,
    Math.round((1 - durationSeconds / Math.max(1, timeLimitSeconds)) * 50),
  )
  return base + completionBonus + speedBonus
}

/** Pattern Recall: rewards longer completed sequences with small mistake penalties. */
export function scorePatternRecall(roundsCompleted: number, mistakes: number): number {
  return Math.max(0, roundsCompleted * 200 - mistakes * 75)
}

/** Brand Rush Runner: tokens, survival time, and avoided obstacles. */
export function scoreBrandRushRunner(
  tokens: number,
  secondsSurvived: number,
  obstaclesAvoided: number,
  tokenValue = 25,
): number {
  return Math.max(
    0,
    tokens * tokenValue + secondsSurvived * 10 + obstaclesAvoided * 15,
  )
}

/** Beat Tiles: timing accuracy plus combo pressure. */
export function scoreBeatTiles({
  perfectHits,
  greatHits,
  misses,
  maxCombo,
}: {
  perfectHits: number
  greatHits: number
  misses: number
  maxCombo: number
}): number {
  return Math.max(
    0,
    perfectHits * 120 + greatHits * 75 + maxCombo * 12 - misses * 35,
  )
}

export function accuracyPercent(hits: number, misses: number): number {
  const total = hits + misses
  if (total <= 0) return 0
  return Math.round((hits / total) * 1000) / 10
}

/** Whether higher or lower values are better for ranking purposes. */
export function isHigherBetter(scoringType: ScoringType): boolean {
  return scoringType !== "time"
}

function metricValue(attempt: GameAttempt, metric: LeaderboardMetric): number {
  switch (metric) {
    case "accuracy":
      return attempt.accuracy ?? 0
    case "completionTime":
      return attempt.durationSeconds
    case "combo":
      return attempt.maxCombo ?? attempt.combo ?? 0
    case "submittedAt":
      return new Date(attempt.submittedAt).getTime()
    case "score":
    default:
      return attempt.score
  }
}

function directionForMetric(
  metric: LeaderboardMetric,
  configuredDirection?: "asc" | "desc",
): "asc" | "desc" {
  if (configuredDirection && metric !== "submittedAt") return configuredDirection
  if (metric === "completionTime" || metric === "submittedAt") return "asc"
  return "desc"
}

export function leaderboardMetricsForCampaign(campaign: Campaign): LeaderboardMetric[] {
  const primary =
    campaign.templateConfig.primaryMetric ??
    (campaign.templateConfig.scoringRule === "time" ? "completionTime" : "score")
  const tieBreakers = campaign.templateConfig.tieBreakers ?? ["submittedAt"]
  return [primary, ...tieBreakers.filter((metric) => metric !== primary)]
}

export function compareAttemptsForCampaign(campaign: Campaign) {
  const metrics = leaderboardMetricsForCampaign(campaign)
  const primary = metrics[0] ?? "score"
  const primaryDirection = campaign.templateConfig.sortDirection

  return (a: GameAttempt, b: GameAttempt): number => {
    for (const metric of metrics) {
      const direction = directionForMetric(
        metric,
        metric === primary ? primaryDirection : undefined,
      )
      const av = metricValue(a, metric)
      const bv = metricValue(b, metric)
      if (av === bv) continue
      return direction === "asc" ? av - bv : bv - av
    }
    return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  }
}
