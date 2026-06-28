/**
 * BrandQuest — Core domain types
 *
 * These interfaces are the single source of truth for the entire app. They are
 * shared by the UI, the validation layer (Zod), the game engine, and the
 * DynamoDB adapter. When the DynamoDB adapter is enabled later, items read from
 * the table are mapped into these shapes (see lib/db/dynamodb.ts).
 */

/* -------------------------------------------------------------------------- */
/*  Users & roles                                                             */
/* -------------------------------------------------------------------------- */

export type UserRole = "player" | "creator" | "admin"

export interface User {
  userId: string
  email: string
  displayName: string
  role: UserRole
  avatarUrl?: string
  createdAt: string // ISO timestamp
}

export interface PlayerProfile {
  playerId: string
  displayName: string
  avatarUrl?: string
  level: number
  xp: number
  xpToNextLevel: number
  gamesPlayed: number
  totalAttempts: number
  wins: number
  bestRank: number | null
  totalRewardsWon: number
  badges: Badge[]
  globalRank: number | null
  createdAt: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string // lucide icon name
  earnedAt: string
}

export interface CreatorProfile {
  creatorId: string
  brandName: string
  displayName: string
  avatarUrl?: string
  websiteUrl?: string
  createdAt: string
}

export interface UserUpsertInput {
  userId: string
  email: string
  displayName: string
  avatarUrl?: string
  requestedRole: UserRole
  allowAdmin?: boolean
}

/* -------------------------------------------------------------------------- */
/*  Campaigns                                                                  */
/* -------------------------------------------------------------------------- */

export type CampaignStatus = "draft" | "pending_review" | "live" | "ended"

export type CampaignCategory =
  | "food_beverage"
  | "fashion"
  | "tech"
  | "gaming"
  | "finance"
  | "travel"
  | "entertainment"
  | "automotive"
  | "other"

export type Difficulty = "easy" | "medium" | "hard"

export interface Campaign {
  campaignId: string
  creatorId: string
  title: string
  previewTitle?: string
  previewText?: string
  brandName: string
  description: string
  category: CampaignCategory
  difficulty: Difficulty
  reward: string
  rewardValue: number // numeric estimate used for "highest reward" sorting
  numberOfWinners: number
  startDate: string // ISO
  endDate: string // ISO
  maxAttemptsPerPlayer: number
  eligibilityRules: string
  brandLink: string
  thumbnailUrl?: string
  status: CampaignStatus
  templateType: GameTemplateType
  isCustom: boolean
  customSubmissionId?: string
  templateConfig: TemplateConfig
  // Denormalized stats kept on the campaign item for fast reads.
  stats: CampaignStats
  createdAt: string
  updatedAt: string
}

export interface CampaignStats {
  registeredPlayers: number
  totalAttempts: number
  completions: number
  topScore: number
  suspiciousAttempts: number
  rewardClaims: number
}

/* -------------------------------------------------------------------------- */
/*  Game templates                                                            */
/* -------------------------------------------------------------------------- */

export type GameTemplateType =
  | "brand_quiz"
  | "memory_match"
  | "reaction_tap"
  | "custom"
  | "beat_tiles"
  | "word_scramble"
  | "logo_puzzle"
  | "spot_the_difference"
  | "code_hunt"
  | "maze_sprint"
  | "pattern_recall"
  | "typing_race"
  | "trivia_ladder"
  | "product_hunt_puzzle"
  | "puzzle_grid"
  | "guess_the_sound"
  | "timeline_sort"
  | "tap_the_product"
  | "find_the_hidden_logo"
  | "price_guess"
  | "brand_trivia_ladder"

export type ScoringType =
  | "points"
  | "time" // lower time = better
  | "accuracy"
  | "combo"

export type LeaderboardMetric =
  | "score"
  | "accuracy"
  | "completionTime"
  | "combo"
  | "submittedAt"

export type SortDirection = "asc" | "desc"

export interface GameTemplate {
  type: GameTemplateType
  name: string
  description: string
  bestUseCase: string
  estimatedPlayTime: string
  scoringType: ScoringType
  difficulty: Difficulty
  dataCaptured: string[]
  customizationOptions: string[]
  /** Whether a playable shell exists for this template in v1. */
  playable: boolean
}

/**
 * TemplateConfig is the customization payload created in the campaign builder.
 * It is intentionally a union-friendly bag of optional fields so a single
 * Campaign item can carry config for any template type.
 */
export interface TemplateConfig {
  instructions?: string
  timeLimitSeconds?: number
  scoringRule?: ScoringType
  maxPossibleScore?: number
  successMessage?: string
  rewardMessage?: string
  brandColor?: string
  logoUrl?: string
  // Anti-cheat limits surfaced to the validation layer.
  minDurationSeconds?: number
  maxScorePerSecond?: number
  // Brand Quiz
  questions?: QuizQuestion[]
  // Memory Match
  memoryPairs?: number
  memoryCards?: string[]
  // Reaction Tap
  reactionTargets?: number
  // Custom game
  externalDemoUrl?: string
  // Word Scramble
  scrambleWords?: string[]
  // Logo Puzzle / Pattern Recall
  puzzleTiles?: number
  patternLength?: number
  patternRounds?: number
  // Typing Race / copy challenges
  typingText?: string
  // Price Guess
  targetPrice?: number
  priceTolerance?: number
  // Runner-style first-party custom game
  customRuntime?: "brand_rush_runner" | "beat_tiles"
  runnerDurationSeconds?: number
  runnerTokenValue?: number
  // Beat Tiles / rhythm scoring
  beatTilesDurationSeconds?: number
  beatTilesSpawnMs?: number
  beatTilesPerfectWindow?: number
  beatTilesGreatWindow?: number
  primaryMetric?: LeaderboardMetric
  sortDirection?: SortDirection
  tieBreakers?: LeaderboardMetric[]
}

export interface QuizQuestion {
  id: string
  prompt: string
  options: string[]
  correctIndex: number
}

/* -------------------------------------------------------------------------- */
/*  Attempts, leaderboards, rewards                                           */
/* -------------------------------------------------------------------------- */

export type AttemptValidationStatus =
  | "validated"
  | "rejected"
  | "flagged"
  | "pending"

export interface GameAttempt {
  attemptId: string
  campaignId: string
  playerId: string
  playerName: string
  score: number
  durationSeconds: number
  accuracy?: number
  combo?: number
  maxCombo?: number
  hits?: number
  misses?: number
  attemptNumber: number
  validationStatus: AttemptValidationStatus
  flags: SuspicionFlag[]
  submittedAt: string
}

export type SuspicionFlag =
  | "impossible_score"
  | "impossible_duration"
  | "too_many_attempts"
  | "duplicate_submission"
  | "before_campaign_start"
  | "after_campaign_end"

export interface LeaderboardEntry {
  rank: number
  playerId: string
  playerName: string
  avatarUrl?: string
  score: number
  durationSeconds: number
  accuracy?: number
  maxCombo?: number
  hits?: number
  misses?: number
  attemptsUsed: number
  validationStatus: AttemptValidationStatus
  submittedAt: string
  rewardEligible: boolean
}

export interface Reward {
  rewardId: string
  campaignId: string
  title: string
  description: string
  value: number
}

export type RewardClaimStatus = "pending" | "fulfilled" | "expired"

export interface RewardClaim {
  claimId: string
  campaignId: string
  rewardId: string
  playerId: string
  playerName: string
  status: RewardClaimStatus
  claimedAt: string
}

export interface PlayerParticipation {
  campaignId: string
  playerId: string
  title: string
  brandName: string
  reward: string
  thumbnailUrl?: string
  attemptsUsed: number
  bestScore: number
  bestRank: number | null
  lastPlayedAt: string
  won: boolean
  status: CampaignStatus
}

/* -------------------------------------------------------------------------- */
/*  Analytics                                                                  */
/* -------------------------------------------------------------------------- */

export type AnalyticsEventType =
  | "campaign_created"
  | "campaign_published"
  | "campaign_viewed"
  | "player_registered"
  | "game_started"
  | "attempt_submitted"
  | "score_validated"
  | "leaderboard_updated"
  | "reward_claimed"
  | "custom_game_submitted"
  | "custom_game_approved"
  | "custom_game_rejected"
  | "analytics_viewed"

export interface AnalyticsEvent {
  eventId: string
  type: AnalyticsEventType
  campaignId?: string
  playerId?: string
  creatorId?: string
  metadata?: Record<string, string | number | boolean>
  createdAt: string
}

export interface CampaignAnalytics {
  campaignId: string
  uniquePlayers: number
  registeredPlayers: number
  totalAttempts: number
  completionRate: number
  averageAttemptsPerPlayer: number
  repeatPlayRate: number
  averageScore: number
  topScore: number
  rewardClaims: number
  suspiciousAttempts: number
  brandClickThroughs: number
  engagementOverTime: TimeSeriesPoint[]
  attemptDistribution: DistributionBucket[]
  funnel: ConversionFunnel
}

export interface TimeSeriesPoint {
  label: string
  value: number
}

export interface DistributionBucket {
  bucket: string
  count: number
}

export interface ConversionFunnel {
  viewedCampaign: number
  startedGame: number
  submittedAttempt: number
  reachedLeaderboard: number
  claimedReward: number
}

/* -------------------------------------------------------------------------- */
/*  Custom game submissions & admin review                                    */
/* -------------------------------------------------------------------------- */

export type CustomGameReviewStatus =
  | "pending"
  | "approved"
  | "rejected"

export interface CustomGameSubmission {
  submissionId: string
  creatorId: string
  creatorName: string
  gameTitle: string
  brandName: string
  description: string
  category: CampaignCategory
  instructions: string
  thumbnailUrl?: string
  expectedScoreMin: number
  expectedScoreMax: number
  scoringMethod: ScoringType
  maxPossibleScore: number
  timeLimitSeconds: number
  reward: string
  rewardValue: number
  externalDemoUrl?: string
  securityNotes: string
  desiredGameStyle?: string
  primaryMetric?: LeaderboardMetric
  sortDirection?: SortDirection
  tieBreakers?: LeaderboardMetric[]
  approvedCampaignId?: string
  status: CustomGameReviewStatus
  reviewNotes: AdminReviewNote[]
  submittedAt: string
  updatedAt: string
}

export interface AdminReviewNote {
  noteId: string
  reviewerId: string
  reviewerName: string
  note: string
  action: "comment" | "approved" | "rejected"
  createdAt: string
}
