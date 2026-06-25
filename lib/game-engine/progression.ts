/**
 * BrandQuest — Player progression (XP, levels, badges)
 *
 * Pure functions for computing player progression. Persistence of the resulting
 * profile happens through the DB adapter; these helpers just define the rules.
 */

import type { AttemptValidationStatus } from "@/lib/db/types"

/** XP required to reach the *next* level from the given level. */
export function xpForLevel(level: number): number {
  // Smooth curve: 100, 250, 450, 700, ...
  return 100 + (level - 1) * 150
}

export interface LevelState {
  level: number
  xpIntoLevel: number
  xpToNextLevel: number
}

/** Resolves a total XP figure into a level + progress breakdown. */
export function resolveLevel(totalXp: number): LevelState {
  let level = 1
  let remaining = Math.max(0, totalXp)
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level)
    level += 1
  }
  return {
    level,
    xpIntoLevel: remaining,
    xpToNextLevel: xpForLevel(level),
  }
}

/** XP awarded for a single attempt, based on validation outcome and score. */
export function xpForAttempt(
  status: AttemptValidationStatus,
  score: number,
  isWin: boolean,
): number {
  if (status === "rejected") return 0
  const base = status === "validated" ? 25 : 10 // flagged earns less
  const scoreBonus = Math.round(Math.min(score, 1000) / 20)
  const winBonus = isWin ? 100 : 0
  return base + scoreBonus + winBonus
}

export interface BadgeRule {
  id: string
  name: string
  description: string
  icon: string
  earned: (stats: ProgressionStats) => boolean
}

export interface ProgressionStats {
  gamesPlayed: number
  wins: number
  totalAttempts: number
  level: number
}

/** Static badge definitions evaluated against a player's stats. */
export const BADGE_RULES: BadgeRule[] = [
  {
    id: "first_play",
    name: "First Quest",
    description: "Played your first campaign.",
    icon: "Play",
    earned: (s) => s.gamesPlayed >= 1,
  },
  {
    id: "first_win",
    name: "Champion",
    description: "Won your first campaign.",
    icon: "Trophy",
    earned: (s) => s.wins >= 1,
  },
  {
    id: "five_wins",
    name: "Streak Master",
    description: "Won 5 campaigns.",
    icon: "Flame",
    earned: (s) => s.wins >= 5,
  },
  {
    id: "ten_games",
    name: "Regular",
    description: "Played 10 campaigns.",
    icon: "Gamepad2",
    earned: (s) => s.gamesPlayed >= 10,
  },
  {
    id: "level_10",
    name: "Veteran",
    description: "Reached level 10.",
    icon: "Star",
    earned: (s) => s.level >= 10,
  },
]
