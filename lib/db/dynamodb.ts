import "server-only"

import type { BrandQuestDB, CampaignFilter } from "./index"
import type {
  AdminReviewNote,
  AnalyticsEvent,
  Campaign,
  CampaignAnalytics,
  CreatorProfile,
  CustomGameReviewStatus,
  CustomGameSubmission,
  GameAttempt,
  LeaderboardEntry,
  PlayerParticipation,
  PlayerProfile,
  RewardClaim,
  User,
  UserRole,
  UserUpsertInput,
} from "./types"
import { computeAnalytics } from "@/lib/analytics/calculations"
import { BADGE_RULES, resolveLevel, xpForAttempt } from "@/lib/game-engine/progression"
import { compareAttemptsForCampaign } from "@/lib/game-engine/scoring"

type DynamoItem = Record<string, unknown>

const REVIEW_STATUSES: CustomGameReviewStatus[] = ["pending", "approved", "rejected"]

function isDefined<T>(value: T | null | undefined): value is T {
  return value != null
}

function tableName(): string {
  const table = process.env.BRANDQUEST_DYNAMODB_TABLE
  if (!table) {
    throw new Error("[brandquest] BRANDQUEST_DYNAMODB_TABLE is not configured.")
  }
  return table
}

function campaignPk(campaignId: string) {
  return `CAMPAIGN#${campaignId}`
}

function playerPk(playerId: string) {
  return `PLAYER#${playerId}`
}

function creatorPk(creatorId: string) {
  return `CREATOR#${creatorId}`
}

function statusPk(status: Campaign["status"]) {
  return `CAMPAIGNS#STATUS#${status}`
}

function statusSk(campaign: Campaign) {
  return `${campaign.endDate}#${campaign.createdAt}#${campaign.campaignId}`
}

function reviewPk(status: CustomGameReviewStatus) {
  return `CUSTOM_REVIEW#${status}`
}

function submissionPk(submissionId: string) {
  return `SUBMISSION#${submissionId}`
}

function emailPk(email: string) {
  return `EMAIL#${email.trim().toLowerCase()}`
}

function scoreSort(score: number) {
  return String(999_999_999 - Math.max(0, Math.floor(score))).padStart(9, "0")
}

function runtimeForSubmission(submission: CustomGameSubmission): "beat_tiles" | "brand_rush_runner" {
  const style = submission.desiredGameStyle?.toLowerCase() ?? ""
  const title = submission.gameTitle.toLowerCase()
  if (style.includes("beat") || style.includes("music tile") || title.includes("beat")) {
    return "beat_tiles"
  }
  return "brand_rush_runner"
}

function itemCampaign(item: DynamoItem | undefined): Campaign | null {
  if (!item) return null
  if (item.campaign) return item.campaign as Campaign
  const { pk: _pk, sk: _sk, entity: _entity, ...campaign } = item
  return campaign as unknown as Campaign
}

function itemSubmission(item: DynamoItem | undefined): CustomGameSubmission | null {
  if (!item) return null
  if (item.submission) return item.submission as CustomGameSubmission
  const { pk: _pk, sk: _sk, entity: _entity, ...submission } = item
  return submission as unknown as CustomGameSubmission
}

function itemAttempt(item: DynamoItem | undefined): GameAttempt | null {
  if (!item) return null
  if (item.attempt) return item.attempt as GameAttempt
  const { pk: _pk, sk: _sk, entity: _entity, ...attempt } = item
  return attempt as unknown as GameAttempt
}

function campaignMetaItem(campaign: Campaign) {
  return {
    pk: campaignPk(campaign.campaignId),
    sk: "META",
    entity: "Campaign",
    ...campaign,
  }
}

function creatorCampaignItem(campaign: Campaign) {
  return {
    pk: creatorPk(campaign.creatorId),
    sk: `CAMPAIGN#${campaign.campaignId}`,
    entity: "CreatorCampaign",
    campaign,
  }
}

function campaignStatusItem(campaign: Campaign) {
  return {
    pk: statusPk(campaign.status),
    sk: statusSk(campaign),
    entity: "CampaignStatus",
    campaignId: campaign.campaignId,
    campaign,
  }
}

function defaultStats() {
  return {
    registeredPlayers: 0,
    totalAttempts: 0,
    completions: 0,
    topScore: 0,
    suspiciousAttempts: 0,
    rewardClaims: 0,
  }
}

function defaultPlayerProfile(user: User): PlayerProfile & { totalXp: number } {
  const level = resolveLevel(0)
  return {
    playerId: user.userId,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    level: level.level,
    xp: level.xpIntoLevel,
    xpToNextLevel: level.xpToNextLevel,
    totalXp: 0,
    gamesPlayed: 0,
    totalAttempts: 0,
    wins: 0,
    bestRank: null,
    totalRewardsWon: 0,
    badges: [],
    globalRank: null,
    createdAt: new Date().toISOString(),
  }
}

function withBadges(profile: PlayerProfile & { totalXp?: number }): PlayerProfile & { totalXp?: number } {
  const earned = new Set(profile.badges.map((badge) => badge.id))
  const stats = {
    gamesPlayed: profile.gamesPlayed,
    wins: profile.wins,
    totalAttempts: profile.totalAttempts,
    level: profile.level,
  }
  const now = new Date().toISOString()
  const badges = [...profile.badges]
  for (const rule of BADGE_RULES) {
    if (!earned.has(rule.id) && rule.earned(stats)) {
      badges.push({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        icon: rule.icon,
        earnedAt: now,
      })
    }
  }
  return { ...profile, badges }
}

function roleForUpsert(
  existing: User | null,
  requested: UserRole,
  allowAdmin = false,
): UserRole {
  if (existing?.role === "admin") return "admin"
  if (requested === "admin" && allowAdmin) return "admin"
  if (requested === "creator") return "creator"
  return "player"
}

function applyCampaignFilter(campaigns: Campaign[], filter?: CampaignFilter): Campaign[] {
  let list = [...campaigns]
  if (filter?.category) list = list.filter((c) => c.category === filter.category)
  if (filter?.difficulty) list = list.filter((c) => c.difficulty === filter.difficulty)
  if (filter?.templateKind) {
    list = list.filter((c) => (filter.templateKind === "custom" ? c.isCustom : !c.isCustom))
  }
  if (filter?.search?.trim()) {
    const query = filter.search.trim().toLowerCase()
    list = list.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.brandName.toLowerCase().includes(query) ||
        c.reward.toLowerCase().includes(query),
    )
  }

  switch (filter?.sort) {
    case "highest_reward":
      list.sort((a, b) => b.rewardValue - a.rewardValue)
      break
    case "most_played":
      list.sort((a, b) => b.stats.totalAttempts - a.stats.totalAttempts)
      break
    case "ending_soon":
      list.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
      break
    case "newest":
    default:
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      break
  }
  return list
}

export function createDynamoDB(): BrandQuestDB {
  const { DynamoDBClient } =
    require("@aws-sdk/client-dynamodb") as typeof import("@aws-sdk/client-dynamodb")
  const {
    BatchGetCommand,
    DeleteCommand,
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
    QueryCommand,
    TransactWriteCommand,
  } = require("@aws-sdk/lib-dynamodb") as typeof import("@aws-sdk/lib-dynamodb")

  const client = new DynamoDBClient({ region: process.env.AWS_REGION })
  const doc = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  })
  const TABLE = tableName()

  async function getItem(key: { pk: string; sk: string }): Promise<DynamoItem | undefined> {
    const res = await doc.send(new GetCommand({ TableName: TABLE, Key: key }))
    return res.Item as DynamoItem | undefined
  }

  async function queryAll(input: Record<string, unknown>): Promise<DynamoItem[]> {
    const items: DynamoItem[] = []
    let ExclusiveStartKey: Record<string, unknown> | undefined
    do {
      const res = await doc.send(
        new QueryCommand({
          TableName: TABLE,
          ...input,
          ExclusiveStartKey,
        }),
      )
      items.push(...((res.Items ?? []) as DynamoItem[]))
      ExclusiveStartKey = res.LastEvaluatedKey as Record<string, unknown> | undefined
    } while (ExclusiveStartKey)
    return items
  }

  async function queryBegins(pk: string, prefix: string): Promise<DynamoItem[]> {
    return queryAll({
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: { ":pk": pk, ":prefix": prefix },
    })
  }

  async function getAttemptsForCampaign(campaignId: string): Promise<GameAttempt[]> {
    const items = await queryBegins(campaignPk(campaignId), "ATTEMPT#")
    return items.map(itemAttempt).filter(Boolean) as GameAttempt[]
  }

  async function getEventsForCampaign(campaignId: string): Promise<AnalyticsEvent[]> {
    const items = await queryBegins(campaignPk(campaignId), "EVENT#")
    return items.map((item) => item.event as AnalyticsEvent).filter(Boolean)
  }

  async function putCampaignIndexes(campaign: Campaign) {
    await doc.send(
      new TransactWriteCommand({
        TransactItems: [
          { Put: { TableName: TABLE, Item: campaignMetaItem(campaign) } },
          { Put: { TableName: TABLE, Item: creatorCampaignItem(campaign) } },
          { Put: { TableName: TABLE, Item: campaignStatusItem(campaign) } },
        ],
      }),
    )
  }

  return {
    isPersistent: true,
    name: "dynamodb",

    async getUser(userId: string): Promise<User | null> {
      const item = await getItem({ pk: `USER#${userId}`, sk: "PROFILE" })
      return (item?.user as User | undefined) ?? null
    },

    async getUserByEmail(email: string): Promise<User | null> {
      const item = await getItem({ pk: emailPk(email), sk: "USER" })
      const userId = item?.userId
      if (typeof userId !== "string") return null
      return this.getUser(userId)
    },

    async upsertUser(input: UserUpsertInput): Promise<User> {
      const existing = await this.getUserByEmail(input.email)
      const now = new Date().toISOString()
      const user: User = {
        userId: existing?.userId ?? input.userId,
        email: input.email.trim().toLowerCase(),
        displayName: input.displayName || existing?.displayName || input.email,
        avatarUrl: input.avatarUrl ?? existing?.avatarUrl,
        role: roleForUpsert(existing, input.requestedRole, input.allowAdmin),
        createdAt: existing?.createdAt ?? now,
      }

      const writes: Record<string, unknown>[] = [
        {
          Put: {
            TableName: TABLE,
            Item: { pk: `USER#${user.userId}`, sk: "PROFILE", entity: "User", user },
          },
        },
        {
          Put: {
            TableName: TABLE,
            Item: { pk: emailPk(user.email), sk: "USER", entity: "EmailUser", userId: user.userId },
          },
        },
      ]

      if (user.role === "player") {
        const existingProfile = await this.getPlayerProfile(user.userId)
        writes.push({
          Put: {
            TableName: TABLE,
            Item: {
              pk: playerPk(user.userId),
              sk: "PROFILE",
              entity: "PlayerProfile",
              profile: existingProfile ?? defaultPlayerProfile(user),
            },
          },
        })
      }

      if (user.role === "creator") {
        const existingProfile = await this.getCreatorProfile(user.userId)
        const profile: CreatorProfile = existingProfile ?? {
          creatorId: user.userId,
          brandName: user.displayName,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          createdAt: now,
        }
        writes.push({
          Put: {
            TableName: TABLE,
            Item: { pk: creatorPk(user.userId), sk: "PROFILE", entity: "CreatorProfile", profile },
          },
        })
      }

      await doc.send(new TransactWriteCommand({ TransactItems: writes }))
      return user
    },

    async getCreatorProfile(creatorId: string): Promise<CreatorProfile | null> {
      const item = await getItem({ pk: creatorPk(creatorId), sk: "PROFILE" })
      return (item?.profile as CreatorProfile | undefined) ?? null
    },

    async listLiveCampaigns(filter?: CampaignFilter): Promise<Campaign[]> {
      const items = await queryAll({
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: { ":pk": statusPk("live") },
      })
      return applyCampaignFilter(items.map(itemCampaign).filter(Boolean) as Campaign[], filter)
    },

    async getCampaign(campaignId: string): Promise<Campaign | null> {
      return itemCampaign(await getItem({ pk: campaignPk(campaignId), sk: "META" }))
    },

    async getCampaignsByCreator(creatorId: string): Promise<Campaign[]> {
      const items = await queryBegins(creatorPk(creatorId), "CAMPAIGN#")
      return items.map(itemCampaign).filter(Boolean) as Campaign[]
    },

    async createCampaign(campaign: Campaign): Promise<Campaign> {
      await doc.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Put: {
                TableName: TABLE,
                Item: campaignMetaItem(campaign),
                ConditionExpression: "attribute_not_exists(pk)",
              },
            },
            { Put: { TableName: TABLE, Item: creatorCampaignItem(campaign) } },
            { Put: { TableName: TABLE, Item: campaignStatusItem(campaign) } },
          ],
        }),
      )
      return campaign
    },

    async updateCampaign(campaignId: string, patch: Partial<Campaign>): Promise<Campaign | null> {
      const existing = await this.getCampaign(campaignId)
      if (!existing) return null

      const updated: Campaign = {
        ...existing,
        ...patch,
        stats: { ...existing.stats, ...(patch.stats ?? {}) },
        templateConfig: { ...existing.templateConfig, ...(patch.templateConfig ?? {}) },
        updatedAt: patch.updatedAt ?? new Date().toISOString(),
      }

      const transactItems: Record<string, unknown>[] = [
        { Put: { TableName: TABLE, Item: campaignMetaItem(updated) } },
        { Put: { TableName: TABLE, Item: creatorCampaignItem(updated) } },
        { Put: { TableName: TABLE, Item: campaignStatusItem(updated) } },
      ]

      if (existing.status !== updated.status || statusSk(existing) !== statusSk(updated)) {
        transactItems.push({
          Delete: {
            TableName: TABLE,
            Key: { pk: statusPk(existing.status), sk: statusSk(existing) },
          },
        })
      }

      await doc.send(new TransactWriteCommand({ TransactItems: transactItems }))
      return updated
    },

    async countPlayerAttempts(campaignId: string, playerId: string): Promise<number> {
      const items = await queryBegins(playerPk(playerId), `ATTEMPT#${campaignId}#`)
      return items.length
    },

    async hasAttemptId(attemptId: string): Promise<boolean> {
      const item = await getItem({ pk: `ATTEMPT#${attemptId}`, sk: "META" })
      return Boolean(item)
    },

    async submitAttempt(attempt: GameAttempt): Promise<GameAttempt> {
      const campaign = await this.getCampaign(attempt.campaignId)
      if (!campaign) throw new Error("Campaign not found.")

      const existingParticipation =
        (await getItem({
          pk: playerPk(attempt.playerId),
          sk: `CAMPAIGN#${attempt.campaignId}`,
        }))?.participation as PlayerParticipation | undefined

      const previousAttempts = await getAttemptsForCampaign(attempt.campaignId)
      const ranked = [...previousAttempts, attempt]
        .filter((a) => a.validationStatus === "validated")
        .sort(compareAttemptsForCampaign(campaign))
      const rank = ranked.findIndex((a) => a.attemptId === attempt.attemptId) + 1
      const isWin = rank > 0 && rank <= campaign.numberOfWinners

      const stats = {
        ...defaultStats(),
        ...campaign.stats,
        registeredPlayers: campaign.stats.registeredPlayers + (existingParticipation ? 0 : 1),
        totalAttempts: campaign.stats.totalAttempts + 1,
        completions:
          campaign.stats.completions + (attempt.validationStatus === "validated" ? 1 : 0),
        topScore: Math.max(campaign.stats.topScore, attempt.score),
        suspiciousAttempts:
          campaign.stats.suspiciousAttempts + (attempt.validationStatus === "flagged" ? 1 : 0),
      }
      const updatedCampaign: Campaign = {
        ...campaign,
        stats,
        updatedAt: new Date().toISOString(),
      }

      const profileItem = await getItem({ pk: playerPk(attempt.playerId), sk: "PROFILE" })
      const fallbackUser: User = {
        userId: attempt.playerId,
        email: "",
        displayName: attempt.playerName,
        role: "player",
        createdAt: attempt.submittedAt,
      }
      const currentProfile =
        (profileItem?.profile as (PlayerProfile & { totalXp?: number }) | undefined) ??
        defaultPlayerProfile(fallbackUser)
      const earnedXp = xpForAttempt(attempt.validationStatus, attempt.score, isWin)
      const totalXp = (currentProfile.totalXp ?? currentProfile.xp) + earnedXp
      const level = resolveLevel(totalXp)
      const updatedProfile = withBadges({
        ...currentProfile,
        displayName: attempt.playerName,
        level: level.level,
        xp: level.xpIntoLevel,
        xpToNextLevel: level.xpToNextLevel,
        totalXp,
        gamesPlayed: currentProfile.gamesPlayed + (existingParticipation ? 0 : 1),
        totalAttempts: currentProfile.totalAttempts + 1,
        wins: currentProfile.wins + (isWin && !existingParticipation?.won ? 1 : 0),
        bestRank:
          rank > 0
            ? currentProfile.bestRank
              ? Math.min(currentProfile.bestRank, rank)
              : rank
            : currentProfile.bestRank,
      })

      const participation: PlayerParticipation = {
        campaignId: campaign.campaignId,
        playerId: attempt.playerId,
        title: campaign.title,
        brandName: campaign.brandName,
        reward: campaign.reward,
        thumbnailUrl: campaign.thumbnailUrl,
        attemptsUsed: (existingParticipation?.attemptsUsed ?? 0) + 1,
        bestScore: Math.max(existingParticipation?.bestScore ?? 0, attempt.score),
        bestRank:
          rank > 0
            ? existingParticipation?.bestRank
              ? Math.min(existingParticipation.bestRank, rank)
              : rank
            : existingParticipation?.bestRank ?? null,
        lastPlayedAt: attempt.submittedAt,
        won: Boolean(existingParticipation?.won || isWin),
        status: campaign.status,
      }

      await doc.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Put: {
                TableName: TABLE,
                Item: { pk: `ATTEMPT#${attempt.attemptId}`, sk: "META", entity: "AttemptId", attemptId: attempt.attemptId },
                ConditionExpression: "attribute_not_exists(pk)",
              },
            },
            {
              Put: {
                TableName: TABLE,
                Item: {
                  pk: campaignPk(attempt.campaignId),
                  sk: `ATTEMPT#${scoreSort(attempt.score)}#${attempt.submittedAt}#${attempt.attemptId}`,
                  entity: "GameAttempt",
                  attempt,
                },
              },
            },
            {
              Put: {
                TableName: TABLE,
                Item: {
                  pk: playerPk(attempt.playerId),
                  sk: `ATTEMPT#${attempt.campaignId}#${attempt.submittedAt}#${attempt.attemptId}`,
                  entity: "PlayerAttempt",
                  attempt,
                },
              },
            },
            {
              Put: {
                TableName: TABLE,
                Item: {
                  pk: playerPk(attempt.playerId),
                  sk: `CAMPAIGN#${attempt.campaignId}`,
                  entity: "PlayerParticipation",
                  participation,
                },
              },
            },
            {
              Put: {
                TableName: TABLE,
                Item: {
                  pk: playerPk(attempt.playerId),
                  sk: "PROFILE",
                  entity: "PlayerProfile",
                  profile: updatedProfile,
                },
              },
            },
            { Put: { TableName: TABLE, Item: campaignMetaItem(updatedCampaign) } },
            { Put: { TableName: TABLE, Item: creatorCampaignItem(updatedCampaign) } },
            { Put: { TableName: TABLE, Item: campaignStatusItem(updatedCampaign) } },
          ],
        }),
      )

      return attempt
    },

    async getLeaderboard(campaignId: string, limit = 100): Promise<LeaderboardEntry[]> {
      const campaign = await this.getCampaign(campaignId)
      const attempts = (await getAttemptsForCampaign(campaignId))
        .filter((attempt) => attempt.validationStatus === "validated")
        .sort(campaign ? compareAttemptsForCampaign(campaign) : (a, b) => b.score - a.score || a.durationSeconds - b.durationSeconds)
        .slice(0, limit)

      return attempts.map((attempt, index) => ({
        rank: index + 1,
        playerId: attempt.playerId,
        playerName: attempt.playerName,
        score: attempt.score,
        durationSeconds: attempt.durationSeconds,
        accuracy: attempt.accuracy,
        maxCombo: attempt.maxCombo,
        hits: attempt.hits,
        misses: attempt.misses,
        attemptsUsed: attempt.attemptNumber,
        validationStatus: attempt.validationStatus,
        submittedAt: attempt.submittedAt,
        rewardEligible: campaign ? index < campaign.numberOfWinners : false,
      }))
    },

    async getPlayerProfile(playerId: string): Promise<PlayerProfile | null> {
      const item = await getItem({ pk: playerPk(playerId), sk: "PROFILE" })
      return (item?.profile as PlayerProfile | undefined) ?? null
    },

    async getCampaignsPlayed(playerId: string): Promise<Campaign[]> {
      const participations = await this.getPlayerParticipations(playerId)
      if (participations.length === 0) return []
      const res = await doc.send(
        new BatchGetCommand({
          RequestItems: {
            [TABLE]: {
              Keys: participations.map((p) => ({ pk: campaignPk(p.campaignId), sk: "META" })),
            },
          },
        }),
      )
      return ((res.Responses?.[TABLE] ?? []) as DynamoItem[])
        .map(itemCampaign)
        .filter(Boolean) as Campaign[]
    },

    async getPlayerParticipations(playerId: string): Promise<PlayerParticipation[]> {
      const items = await queryBegins(playerPk(playerId), "CAMPAIGN#")
      return items
        .map((item) => item.participation as PlayerParticipation | undefined)
        .filter(isDefined)
        .sort((a, b) => new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime()) as PlayerParticipation[]
    },

    async getPlayerRewardClaims(playerId: string): Promise<RewardClaim[]> {
      const items = await queryBegins(playerPk(playerId), "CLAIM#")
      return items
        .map((item) => item.claim as RewardClaim | undefined)
        .filter(isDefined)
        .sort((a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime()) as RewardClaim[]
    },

    async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics | null> {
      const [attempts, events] = await Promise.all([
        getAttemptsForCampaign(campaignId),
        getEventsForCampaign(campaignId),
      ])
      const countEvents = (type: AnalyticsEvent["type"]) =>
        events.filter((event) => event.type === type).length
      return computeAnalytics(
        campaignId,
        attempts,
        {
          viewedCampaign: countEvents("campaign_viewed"),
          startedGame: countEvents("game_started"),
          submittedAttempt: countEvents("attempt_submitted"),
          reachedLeaderboard: countEvents("leaderboard_updated"),
          claimedReward: countEvents("reward_claimed"),
        },
        countEvents("reward_claimed"),
        Number(events.filter((event) => event.metadata?.brandClickThrough).length),
      )
    },

    async recordEvent(event: AnalyticsEvent): Promise<void> {
      const pk = event.campaignId
        ? campaignPk(event.campaignId)
        : event.creatorId
          ? creatorPk(event.creatorId)
          : "ANALYTICS#GLOBAL"
      await doc.send(
        new PutCommand({
          TableName: TABLE,
          Item: {
            pk,
            sk: `EVENT#${event.createdAt}#${event.eventId}`,
            entity: "AnalyticsEvent",
            event,
          },
        }),
      )
    },

    async storeRewardClaim(claim: RewardClaim): Promise<RewardClaim> {
      await doc.send(
        new PutCommand({
          TableName: TABLE,
          Item: {
            pk: playerPk(claim.playerId),
            sk: `CLAIM#${claim.claimId}`,
            entity: "RewardClaim",
            claim,
          },
          ConditionExpression: "attribute_not_exists(pk)",
        }),
      )
      return claim
    },

    async listCustomSubmissions(status?: CustomGameReviewStatus): Promise<CustomGameSubmission[]> {
      const statuses = status ? [status] : REVIEW_STATUSES
      const groups = await Promise.all(
        statuses.map((reviewStatus) =>
          queryAll({
            KeyConditionExpression: "pk = :pk",
            ExpressionAttributeValues: { ":pk": reviewPk(reviewStatus) },
          }),
        ),
      )
      return groups
        .flat()
        .map(itemSubmission)
        .filter(isDefined)
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()) as CustomGameSubmission[]
    },

    async getCustomSubmission(submissionId: string): Promise<CustomGameSubmission | null> {
      return itemSubmission(await getItem({ pk: submissionPk(submissionId), sk: "META" }))
    },

    async createCustomSubmission(submission: CustomGameSubmission): Promise<CustomGameSubmission> {
      await doc.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Put: {
                TableName: TABLE,
                Item: {
                  pk: submissionPk(submission.submissionId),
                  sk: "META",
                  entity: "CustomGameSubmission",
                  ...submission,
                },
                ConditionExpression: "attribute_not_exists(pk)",
              },
            },
            {
              Put: {
                TableName: TABLE,
                Item: {
                  pk: reviewPk(submission.status),
                  sk: `${submission.submittedAt}#${submission.submissionId}`,
                  entity: "CustomGameReviewIndex",
                  submission,
                },
              },
            },
          ],
        }),
      )
      return submission
    },

    async reviewCustomSubmission(
      submissionId: string,
      status: CustomGameReviewStatus,
      note: AdminReviewNote,
    ): Promise<CustomGameSubmission | null> {
      const existing = await this.getCustomSubmission(submissionId)
      if (!existing) return null
      const updated: CustomGameSubmission = {
        ...existing,
        status,
        approvedCampaignId:
          status === "approved"
            ? `custom_${existing.submissionId}`
            : existing.approvedCampaignId,
        reviewNotes: [...existing.reviewNotes, note],
        updatedAt: new Date().toISOString(),
      }
      const transactItems: Record<string, unknown>[] = [
        {
          Put: {
            TableName: TABLE,
            Item: {
              pk: submissionPk(updated.submissionId),
              sk: "META",
              entity: "CustomGameSubmission",
              ...updated,
            },
          },
        },
        {
          Put: {
            TableName: TABLE,
            Item: {
              pk: reviewPk(updated.status),
              sk: `${updated.submittedAt}#${updated.submissionId}`,
              entity: "CustomGameReviewIndex",
              submission: updated,
            },
          },
        },
      ]
      if (existing.status !== updated.status) {
        transactItems.push({
          Delete: {
            TableName: TABLE,
            Key: { pk: reviewPk(existing.status), sk: `${existing.submittedAt}#${existing.submissionId}` },
          },
        })
      }
      if (updated.status === "approved") {
        const now = new Date().toISOString()
        const runtime = runtimeForSubmission(updated)
        const campaignId = `custom_${updated.submissionId}`
        const isBeatTiles = runtime === "beat_tiles"
        const scoringRule = isBeatTiles ? "combo" : updated.scoringMethod
        const campaign: Campaign = {
          campaignId,
          creatorId: updated.creatorId,
          title: updated.gameTitle,
          previewTitle: updated.gameTitle,
          previewText: updated.description,
          brandName: updated.brandName,
          description: updated.description,
          category: updated.category,
          difficulty: "medium",
          reward: updated.reward,
          rewardValue: updated.rewardValue,
          numberOfWinners: 1,
          startDate: now,
          endDate: new Date(Date.now() + 14 * 86_400_000).toISOString(),
          maxAttemptsPerPlayer: 3,
          eligibilityRules: "Approved custom game metadata. No uploaded code is executed by BrandQuest.",
          brandLink: updated.externalDemoUrl ?? "",
          thumbnailUrl: updated.thumbnailUrl,
          status: "live",
          templateType: "custom",
          isCustom: true,
          customSubmissionId: updated.submissionId,
          templateConfig: {
            instructions: updated.instructions,
            timeLimitSeconds: Math.min(120, Math.max(10, updated.timeLimitSeconds)),
            scoringRule,
            maxPossibleScore: updated.maxPossibleScore,
            externalDemoUrl: updated.externalDemoUrl,
            customRuntime: runtime,
            primaryMetric: updated.primaryMetric ?? "score",
            sortDirection: updated.sortDirection ?? "desc",
            tieBreakers:
              updated.tieBreakers ??
              (isBeatTiles
                ? ["accuracy", "combo", "submittedAt"]
                : ["submittedAt"]),
            beatTilesDurationSeconds: Math.min(120, Math.max(15, updated.timeLimitSeconds)),
            beatTilesSpawnMs: 650,
            beatTilesPerfectWindow: 0.07,
            beatTilesGreatWindow: 0.16,
            runnerDurationSeconds: Math.min(120, Math.max(10, updated.timeLimitSeconds)),
            runnerTokenValue: 25,
            minDurationSeconds: 1,
            maxScorePerSecond: Math.max(1, Math.ceil(updated.maxPossibleScore / Math.max(1, updated.timeLimitSeconds))),
          },
          stats: defaultStats(),
          createdAt: now,
          updatedAt: now,
        }
        transactItems.push(
          { Put: { TableName: TABLE, Item: campaignMetaItem(campaign) } },
          { Put: { TableName: TABLE, Item: creatorCampaignItem(campaign) } },
          { Put: { TableName: TABLE, Item: campaignStatusItem(campaign) } },
        )
      }
      await doc.send(new TransactWriteCommand({ TransactItems: transactItems }))
      return updated
    },
  }
}
