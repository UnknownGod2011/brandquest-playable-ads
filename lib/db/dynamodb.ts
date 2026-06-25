/**
 * BrandQuest — Amazon DynamoDB adapter (single-table design)
 *
 * ⚠️  THIS ADAPTER IS DISABLED BY DEFAULT.
 *     It is only instantiated when `USE_DYNAMODB=true` and the AWS env vars are
 *     present (see lib/db/index.ts -> isDynamoEnabled()).
 *
 * ⚠️  NO AWS RESOURCES ARE CREATED BY THIS CODE.
 *     The table and IAM user/role must be created manually and carefully.
 *     See docs/AWS_SETUP_LATER.md and docs/DYNAMODB_MODEL.md.
 *
 * --------------------------------------------------------------------------
 * SINGLE-TABLE DESIGN
 * --------------------------------------------------------------------------
 * Table: process.env.BRANDQUEST_DYNAMODB_TABLE
 *   PK (partition key)  |  SK (sort key)
 *
 *   CAMPAIGN#<id>        |  META
 *   CAMPAIGN#<id>        |  ATTEMPT#<scorePadded>#<attemptId>   (leaderboard)
 *   CAMPAIGN#<id>        |  EVENT#<ts>#<eventId>
 *   CREATOR#<id>         |  CAMPAIGN#<campaignId>
 *   PLAYER#<id>          |  PROFILE
 *   PLAYER#<id>          |  CAMPAIGN#<campaignId>               (participation)
 *   PLAYER#<id>          |  CLAIM#<claimId>
 *   SUBMISSION#<id>      |  META
 *
 * GSIs (see docs/DYNAMODB_MODEL.md for full rationale):
 *   GSI1 (status index):     GSI1PK = STATUS#<campaignStatus>  GSI1SK = <endDate or createdAt>
 *                            -> "list live campaigns", "ending soon", "newest"
 *   GSI2 (submission index): GSI2PK = REVIEW#<status>          GSI2SK = <submittedAt>
 *                            -> "custom submissions by review status"
 *
 * The leaderboard is read as a Query on PK=CAMPAIGN#<id> with SK begins_with
 * "ATTEMPT#"; because scores are zero-padded in the SK, results come back
 * pre-sorted (use ScanIndexForward=false for descending point scores).
 * --------------------------------------------------------------------------
 */

import type { BrandQuestDB, CampaignFilter } from "./index"
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

/**
 * Creates the DynamoDB-backed adapter.
 *
 * The AWS SDK clients are intentionally NOT imported at the top of this file.
 * They are required lazily inside this factory so that the no-AWS path never
 * loads AWS code. Install the SDK before enabling:
 *
 *   pnpm add @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
 *
 * Then uncomment the client wiring below and implement each method against the
 * single-table design documented above.
 */
export function createDynamoDB(): BrandQuestDB {
  // TODO(aws): Uncomment once @aws-sdk/* packages are installed and the table
  // exists. Credentials come from the standard AWS provider chain (env vars on
  // Vercel). NEVER hard-code credentials here.
  //
  // const { DynamoDBClient } = require("@aws-sdk/client-dynamodb")
  // const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb")
  // const client = DynamoDBClient ? new DynamoDBClient({ region: process.env.AWS_REGION }) : null
  // const doc = client ? DynamoDBDocumentClient.from(client) : null
  // const TABLE = process.env.BRANDQUEST_DYNAMODB_TABLE!

  const notImplemented = (method: string): never => {
    // This makes misconfiguration obvious in logs instead of silently faking
    // persistence. If you see this, finish wiring the method below.
    throw new Error(
      `[brandquest] DynamoDB adapter method "${method}" is not implemented yet. ` +
        `See lib/db/dynamodb.ts and docs/DYNAMODB_MODEL.md.`,
    )
  }

  return {
    isPersistent: true,
    name: "dynamodb",

    // --- Campaigns ---------------------------------------------------------
    async listLiveCampaigns(_filter?: CampaignFilter): Promise<Campaign[]> {
      // TODO(aws): Query GSI1 where GSI1PK = "STATUS#live".
      // Apply filter.sort:
      //   - ending_soon    -> ScanIndexForward=true on endDate
      //   - newest         -> ScanIndexForward=false on createdAt
      //   - highest_reward -> sort client-side by rewardValue
      //   - most_played    -> sort client-side by stats.totalAttempts
      // Apply category/difficulty/templateKind/search as FilterExpressions or
      // client-side narrowing.
      return notImplemented("listLiveCampaigns")
    },

    async getCampaign(_campaignId: string): Promise<Campaign | null> {
      // TODO(aws): GetItem PK=CAMPAIGN#<id>, SK=META
      return notImplemented("getCampaign")
    },

    async getCampaignsByCreator(_creatorId: string): Promise<Campaign[]> {
      // TODO(aws): Query PK=CREATOR#<id>, SK begins_with "CAMPAIGN#"
      return notImplemented("getCampaignsByCreator")
    },

    async createCampaign(_campaign: Campaign): Promise<Campaign> {
      // TODO(aws): TransactWrite — put CAMPAIGN#<id>/META, CREATOR#<id>/CAMPAIGN#<id>,
      // and the GSI1 status projection attributes.
      return notImplemented("createCampaign")
    },

    async updateCampaign(
      _campaignId: string,
      _patch: Partial<Campaign>,
    ): Promise<Campaign | null> {
      // TODO(aws): UpdateItem PK=CAMPAIGN#<id>, SK=META
      return notImplemented("updateCampaign")
    },

    // --- Attempts & leaderboards ------------------------------------------
    async countPlayerAttempts(
      _campaignId: string,
      _playerId: string,
    ): Promise<number> {
      // TODO(aws): Query PK=CAMPAIGN#<id>, SK begins_with "ATTEMPT#",
      // FilterExpression playerId = :p — or maintain a counter item.
      return notImplemented("countPlayerAttempts")
    },

    async hasAttemptId(_attemptId: string): Promise<boolean> {
      // TODO(aws): GetItem / conditional check for duplicate attempt IDs.
      return notImplemented("hasAttemptId")
    },

    async submitAttempt(_attempt: GameAttempt): Promise<GameAttempt> {
      // TODO(aws): PutItem with ConditionExpression attribute_not_exists to
      // reject duplicate attemptIds. Zero-pad score in the SK for ordering.
      return notImplemented("submitAttempt")
    },

    async getLeaderboard(
      _campaignId: string,
      _limit = 100,
    ): Promise<LeaderboardEntry[]> {
      // TODO(aws): Query PK=CAMPAIGN#<id>, SK begins_with "ATTEMPT#",
      // ScanIndexForward=false, Limit=_limit. Map to LeaderboardEntry + rank.
      return notImplemented("getLeaderboard")
    },

    // --- Players -----------------------------------------------------------
    async getPlayerProfile(_playerId: string): Promise<PlayerProfile | null> {
      // TODO(aws): GetItem PK=PLAYER#<id>, SK=PROFILE
      return notImplemented("getPlayerProfile")
    },

    async getCampaignsPlayed(_playerId: string): Promise<Campaign[]> {
      // TODO(aws): Query PK=PLAYER#<id>, SK begins_with "CAMPAIGN#",
      // then BatchGet the campaign META items.
      return notImplemented("getCampaignsPlayed")
    },

    // --- Analytics ---------------------------------------------------------
    async getCampaignAnalytics(
      _campaignId: string,
    ): Promise<CampaignAnalytics | null> {
      // TODO(aws): Query PK=CAMPAIGN#<id>, SK begins_with "EVENT#" and aggregate,
      // or read a maintained rollup item.
      return notImplemented("getCampaignAnalytics")
    },

    async recordEvent(_event: AnalyticsEvent): Promise<void> {
      // TODO(aws): PutItem EVENT#<ts>#<eventId> under the relevant campaign PK.
      return notImplemented("recordEvent")
    },

    // --- Rewards -----------------------------------------------------------
    async storeRewardClaim(_claim: RewardClaim): Promise<RewardClaim> {
      // TODO(aws): PutItem PK=PLAYER#<id>, SK=CLAIM#<claimId>
      return notImplemented("storeRewardClaim")
    },

    // --- Custom games / admin ---------------------------------------------
    async listCustomSubmissions(
      _status?: CustomGameReviewStatus,
    ): Promise<CustomGameSubmission[]> {
      // TODO(aws): Query GSI2 where GSI2PK = "REVIEW#<status>"
      return notImplemented("listCustomSubmissions")
    },

    async getCustomSubmission(
      _submissionId: string,
    ): Promise<CustomGameSubmission | null> {
      // TODO(aws): GetItem PK=SUBMISSION#<id>, SK=META
      return notImplemented("getCustomSubmission")
    },

    async createCustomSubmission(
      _submission: CustomGameSubmission,
    ): Promise<CustomGameSubmission> {
      // TODO(aws): PutItem PK=SUBMISSION#<id>, SK=META + GSI2 projection.
      return notImplemented("createCustomSubmission")
    },

    async reviewCustomSubmission(
      _submissionId: string,
      _status: CustomGameReviewStatus,
      _note: AdminReviewNote,
    ): Promise<CustomGameSubmission | null> {
      // TODO(aws): UpdateItem status + append review note; update GSI2PK.
      return notImplemented("reviewCustomSubmission")
    },
  }
}
