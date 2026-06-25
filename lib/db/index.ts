/**
 * BrandQuest — Database adapter entry point
 *
 * The app talks to a single `db` object that implements `BrandQuestDB`. There
 * are two implementations:
 *
 *   - noopDB:     the default. Returns empty data / safe no-ops so the app runs
 *                 fully without any AWS credentials or resources.
 *   - dynamoDB:   a real Amazon DynamoDB adapter, only used when
 *                 `USE_DYNAMODB=true` AND the required AWS env vars are present.
 *
 * The selection is made once, server-side, based on environment variables. AWS
 * is NEVER contacted unless explicitly enabled. See lib/db/dynamodb.ts for the
 * documented access patterns and key design.
 */

import type {
  Campaign,
  CampaignAnalytics,
  CustomGameSubmission,
  CustomGameReviewStatus,
  GameAttempt,
  LeaderboardEntry,
  PlayerProfile,
  RewardClaim,
  AnalyticsEvent,
  AdminReviewNote,
} from "./types"
import { noopDB } from "./noop"

/* -------------------------------------------------------------------------- */
/*  Query option shapes                                                       */
/* -------------------------------------------------------------------------- */

export type CampaignSort =
  | "newest"
  | "ending_soon"
  | "most_played"
  | "highest_reward"

export interface CampaignFilter {
  category?: string
  difficulty?: string
  templateKind?: "template" | "custom"
  search?: string
  sort?: CampaignSort
}

export interface SubmitAttemptInput {
  campaignId: string
  playerId: string
  playerName: string
  score: number
  durationSeconds: number
  attemptId: string
}

/* -------------------------------------------------------------------------- */
/*  Adapter contract                                                          */
/* -------------------------------------------------------------------------- */

export interface BrandQuestDB {
  /** True when this adapter is backed by a real persistence layer. */
  readonly isPersistent: boolean
  readonly name: string

  // Campaigns
  listLiveCampaigns(filter?: CampaignFilter): Promise<Campaign[]>
  getCampaign(campaignId: string): Promise<Campaign | null>
  getCampaignsByCreator(creatorId: string): Promise<Campaign[]>
  createCampaign(campaign: Campaign): Promise<Campaign>
  updateCampaign(
    campaignId: string,
    patch: Partial<Campaign>,
  ): Promise<Campaign | null>

  // Attempts & leaderboards
  countPlayerAttempts(campaignId: string, playerId: string): Promise<number>
  hasAttemptId(attemptId: string): Promise<boolean>
  submitAttempt(attempt: GameAttempt): Promise<GameAttempt>
  getLeaderboard(campaignId: string, limit?: number): Promise<LeaderboardEntry[]>

  // Players
  getPlayerProfile(playerId: string): Promise<PlayerProfile | null>
  getCampaignsPlayed(playerId: string): Promise<Campaign[]>

  // Analytics
  getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics | null>
  recordEvent(event: AnalyticsEvent): Promise<void>

  // Rewards
  storeRewardClaim(claim: RewardClaim): Promise<RewardClaim>

  // Custom games / admin
  listCustomSubmissions(
    status?: CustomGameReviewStatus,
  ): Promise<CustomGameSubmission[]>
  getCustomSubmission(
    submissionId: string,
  ): Promise<CustomGameSubmission | null>
  createCustomSubmission(
    submission: CustomGameSubmission,
  ): Promise<CustomGameSubmission>
  reviewCustomSubmission(
    submissionId: string,
    status: CustomGameReviewStatus,
    note: AdminReviewNote,
  ): Promise<CustomGameSubmission | null>
}

/* -------------------------------------------------------------------------- */
/*  Adapter selection                                                         */
/* -------------------------------------------------------------------------- */

export function isDynamoEnabled(): boolean {
  return (
    process.env.USE_DYNAMODB === "true" &&
    Boolean(process.env.AWS_REGION) &&
    Boolean(process.env.BRANDQUEST_DYNAMODB_TABLE)
  )
}

let cached: BrandQuestDB | null = null

export function getDB(): BrandQuestDB {
  if (cached) return cached

  if (isDynamoEnabled()) {
    // Lazy import so the AWS SDK is never bundled/loaded unless explicitly
    // enabled. This keeps the no-AWS path completely free of AWS code paths.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createDynamoDB } = require("./dynamodb") as typeof import("./dynamodb")
    cached = createDynamoDB()
  } else {
    cached = noopDB
  }

  return cached
}

export const db = getDB()
