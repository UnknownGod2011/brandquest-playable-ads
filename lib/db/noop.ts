/**
 * BrandQuest — No-op database adapter
 *
 * This is the DEFAULT adapter and the one running whenever DynamoDB is not
 * configured. Every read returns empty data and every write is a safe no-op
 * (the input is echoed back so the UI/optimistic flow stays consistent, but
 * nothing is persisted).
 *
 * Why no fake data? Per the product spec, we never invent fake users or
 * campaigns to masquerade as a real backend. The UI handles these empty
 * results by rendering real empty states. Built-in game *templates* (static
 * product configuration) live in lib/game-engine/templates.ts and are NOT
 * considered backend data.
 */

import type {
  BrandQuestDB,
  CampaignFilter,
} from "./index"
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
  User,
  UserUpsertInput,
  CreatorProfile,
  PlayerParticipation,
} from "./types"

export const noopDB: BrandQuestDB = {
  isPersistent: false,
  name: "noop",

  async getUser(_userId: string): Promise<User | null> {
    return null
  },

  async getUserByEmail(_email: string): Promise<User | null> {
    return null
  },

  async upsertUser(input: UserUpsertInput): Promise<User> {
    const role =
      input.requestedRole === "admin" && !input.allowAdmin
        ? "player"
        : input.requestedRole
    return {
      userId: input.userId,
      email: input.email,
      displayName: input.displayName,
      avatarUrl: input.avatarUrl,
      role,
      createdAt: new Date().toISOString(),
    }
  },

  async getCreatorProfile(_creatorId: string): Promise<CreatorProfile | null> {
    return null
  },

  async listLiveCampaigns(_filter?: CampaignFilter): Promise<Campaign[]> {
    return []
  },

  async getCampaign(_campaignId: string): Promise<Campaign | null> {
    return null
  },

  async getCampaignsByCreator(_creatorId: string): Promise<Campaign[]> {
    return []
  },

  async createCampaign(campaign: Campaign): Promise<Campaign> {
    // No persistence. The server action surfaces a clear message to the user
    // ("Connect DynamoDB to persist campaigns").
    return campaign
  },

  async updateCampaign(
    _campaignId: string,
    _patch: Partial<Campaign>,
  ): Promise<Campaign | null> {
    return null
  },

  async countPlayerAttempts(
    _campaignId: string,
    _playerId: string,
  ): Promise<number> {
    return 0
  },

  async hasAttemptId(_attemptId: string): Promise<boolean> {
    return false
  },

  async submitAttempt(attempt: GameAttempt): Promise<GameAttempt> {
    // Score validation still runs (see lib/game-engine + the API route). We just
    // do not persist the result without a database.
    return attempt
  },

  async getLeaderboard(
    _campaignId: string,
    _limit?: number,
  ): Promise<LeaderboardEntry[]> {
    return []
  },

  async getPlayerProfile(_playerId: string): Promise<PlayerProfile | null> {
    return null
  },

  async getCampaignsPlayed(_playerId: string): Promise<Campaign[]> {
    return []
  },

  async getPlayerParticipations(
    _playerId: string,
  ): Promise<PlayerParticipation[]> {
    return []
  },

  async getPlayerRewardClaims(_playerId: string): Promise<RewardClaim[]> {
    return []
  },

  async getCampaignAnalytics(
    _campaignId: string,
  ): Promise<CampaignAnalytics | null> {
    return null
  },

  async recordEvent(_event: AnalyticsEvent): Promise<void> {
    // Intentionally a no-op. With DynamoDB enabled, events are appended to the
    // analytics partition (see lib/analytics/events.ts).
  },

  async storeRewardClaim(claim: RewardClaim): Promise<RewardClaim> {
    return claim
  },

  async listCustomSubmissions(
    _status?: CustomGameReviewStatus,
  ): Promise<CustomGameSubmission[]> {
    return []
  },

  async getCustomSubmission(
    _submissionId: string,
  ): Promise<CustomGameSubmission | null> {
    return null
  },

  async createCustomSubmission(
    submission: CustomGameSubmission,
  ): Promise<CustomGameSubmission> {
    return submission
  },

  async reviewCustomSubmission(
    _submissionId: string,
    _status: CustomGameReviewStatus,
    _note: AdminReviewNote,
  ): Promise<CustomGameSubmission | null> {
    return null
  },
}
