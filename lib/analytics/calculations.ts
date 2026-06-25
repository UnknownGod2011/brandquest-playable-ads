/**
 * BrandQuest — Analytics calculations
 *
 * Pure functions that turn raw attempts/events into the metrics shown on the
 * creator analytics page. When DynamoDB is connected, these run over real query
 * results; with the no-op adapter the analytics page renders empty states.
 */

import type {
  CampaignAnalytics,
  ConversionFunnel,
  GameAttempt,
} from "@/lib/db/types"

export function emptyAnalytics(campaignId: string): CampaignAnalytics {
  return {
    campaignId,
    uniquePlayers: 0,
    registeredPlayers: 0,
    totalAttempts: 0,
    completionRate: 0,
    averageAttemptsPerPlayer: 0,
    repeatPlayRate: 0,
    averageScore: 0,
    topScore: 0,
    rewardClaims: 0,
    suspiciousAttempts: 0,
    brandClickThroughs: 0,
    engagementOverTime: [],
    attemptDistribution: [],
    funnel: {
      viewedCampaign: 0,
      startedGame: 0,
      submittedAttempt: 0,
      reachedLeaderboard: 0,
      claimedReward: 0,
    },
  }
}

/** Builds analytics from a set of attempts (used once DynamoDB is connected). */
export function computeAnalytics(
  campaignId: string,
  attempts: GameAttempt[],
  funnel: ConversionFunnel,
  rewardClaims: number,
  brandClickThroughs: number,
): CampaignAnalytics {
  if (attempts.length === 0) {
    return { ...emptyAnalytics(campaignId), funnel, rewardClaims, brandClickThroughs }
  }

  const players = new Set(attempts.map((a) => a.playerId))
  const validated = attempts.filter((a) => a.validationStatus === "validated")
  const suspicious = attempts.filter((a) => a.validationStatus === "flagged").length
  const totalScore = validated.reduce((sum, a) => sum + a.score, 0)
  const topScore = attempts.reduce((max, a) => Math.max(max, a.score), 0)

  const attemptsByPlayer = new Map<string, number>()
  for (const a of attempts) {
    attemptsByPlayer.set(a.playerId, (attemptsByPlayer.get(a.playerId) ?? 0) + 1)
  }
  const repeatPlayers = [...attemptsByPlayer.values()].filter((n) => n > 1).length

  return {
    campaignId,
    uniquePlayers: players.size,
    registeredPlayers: players.size,
    totalAttempts: attempts.length,
    completionRate: round((validated.length / attempts.length) * 100),
    averageAttemptsPerPlayer: round(attempts.length / players.size),
    repeatPlayRate: round((repeatPlayers / players.size) * 100),
    averageScore: round(validated.length ? totalScore / validated.length : 0),
    topScore,
    rewardClaims,
    suspiciousAttempts: suspicious,
    brandClickThroughs,
    engagementOverTime: buildTimeSeries(attempts),
    attemptDistribution: buildDistribution(attemptsByPlayer),
    funnel,
  }
}

function buildTimeSeries(attempts: GameAttempt[]) {
  const byDay = new Map<string, number>()
  for (const a of attempts) {
    const day = a.submittedAt.slice(0, 10)
    byDay.set(day, (byDay.get(day) ?? 0) + 1)
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({ label, value }))
}

function buildDistribution(attemptsByPlayer: Map<string, number>) {
  const buckets = { "1": 0, "2-3": 0, "4-5": 0, "6+": 0 }
  for (const n of attemptsByPlayer.values()) {
    if (n === 1) buckets["1"]++
    else if (n <= 3) buckets["2-3"]++
    else if (n <= 5) buckets["4-5"]++
    else buckets["6+"]++
  }
  return Object.entries(buckets).map(([bucket, count]) => ({ bucket, count }))
}

function round(n: number): number {
  return Math.round(n * 10) / 10
}
