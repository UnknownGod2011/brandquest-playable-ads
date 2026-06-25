"use server"

/**
 * BrandQuest — Campaign & custom-game server actions
 *
 * All mutations are authorized server-side (permissions.ts) and validated with
 * Zod before touching the adapter. With the no-op adapter nothing is persisted,
 * so each action returns a clear `persisted` flag the UI uses to tell the user
 * to connect DynamoDB.
 */

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/current-user"
import { canCreateCampaign } from "@/lib/security/permissions"
import {
  createCampaignSchema,
  type CreateCampaignInput,
} from "@/lib/validation/campaign"
import { customGameSubmissionSchema } from "@/lib/validation/custom-game"
import { track } from "@/lib/analytics/events"
import { generateId } from "@/lib/utils"
import type { Campaign, CustomGameSubmission } from "@/lib/db/types"

export interface ActionResult<T = undefined> {
  ok: boolean
  persisted?: boolean
  message: string
  fieldErrors?: Record<string, string[]>
  data?: T
}

/**
 * Creates a campaign. `publish` decides whether it goes live immediately or is
 * saved as a draft. Custom-game campaigns must reference an approved submission.
 */
export async function createCampaign(
  input: CreateCampaignInput,
  publish: boolean,
): Promise<ActionResult<{ campaignId: string }>> {
  const user = await getCurrentUser()
  if (!canCreateCampaign(user) || !user) {
    return { ok: false, message: "Only creators can create campaigns." }
  }

  const parsed = createCampaignSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }
  const value = parsed.data
  const now = new Date().toISOString()

  const campaign: Campaign = {
    campaignId: generateId("camp"),
    creatorId: user.userId,
    title: value.title,
    brandName: value.brandName,
    description: value.description,
    category: value.category,
    difficulty: value.difficulty,
    reward: value.reward,
    rewardValue: value.rewardValue,
    numberOfWinners: value.numberOfWinners,
    startDate: value.startDate,
    endDate: value.endDate,
    maxAttemptsPerPlayer: value.maxAttemptsPerPlayer,
    eligibilityRules: value.eligibilityRules ?? "",
    brandLink: value.brandLink,
    thumbnailUrl: value.thumbnailUrl,
    status: publish ? "live" : "draft",
    templateType: value.templateType,
    isCustom: value.isCustom,
    customSubmissionId: value.customSubmissionId,
    templateConfig: value.templateConfig,
    stats: {
      registeredPlayers: 0,
      totalAttempts: 0,
      completions: 0,
      topScore: 0,
      suspiciousAttempts: 0,
      rewardClaims: 0,
    },
    createdAt: now,
    updatedAt: now,
  }

  await db.createCampaign(campaign)
  await track({
    type: publish ? "campaign_published" : "campaign_created",
    campaignId: campaign.campaignId,
    creatorId: user.userId,
  })

  revalidatePath("/creator")

  return {
    ok: true,
    persisted: db.isPersistent,
    message: db.isPersistent
      ? publish
        ? "Campaign published and live."
        : "Draft saved."
      : "Validated. Connect DynamoDB to persist this campaign.",
    data: { campaignId: campaign.campaignId },
  }
}

/** Updates a campaign's status (e.g. publish a draft, end a live campaign). */
export async function updateCampaignStatus(
  campaignId: string,
  status: Campaign["status"],
): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!canCreateCampaign(user) || !user) {
    return { ok: false, message: "Not authorized." }
  }
  await db.updateCampaign(campaignId, { status, updatedAt: new Date().toISOString() })
  revalidatePath("/creator")
  return {
    ok: true,
    persisted: db.isPersistent,
    message: db.isPersistent ? "Campaign updated." : "Connect DynamoDB to persist this change.",
  }
}

/** Submits a custom game for admin review (metadata only — no code executed). */
export async function submitCustomGame(
  input: unknown,
): Promise<ActionResult<{ submissionId: string }>> {
  const user = await getCurrentUser()
  if (!canCreateCampaign(user) || !user) {
    return { ok: false, message: "Only creators can submit custom games." }
  }

  const parsed = customGameSubmissionSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }
  const value = parsed.data
  const now = new Date().toISOString()

  const submission: CustomGameSubmission = {
    submissionId: generateId("sub"),
    creatorId: user.userId,
    creatorName: user.displayName,
    gameTitle: value.gameTitle,
    instructions: value.instructions,
    thumbnailUrl: value.thumbnailUrl,
    expectedScoreMin: value.expectedScoreMin,
    expectedScoreMax: value.expectedScoreMax,
    scoringMethod: value.scoringMethod,
    maxPossibleScore: value.maxPossibleScore,
    timeLimitSeconds: value.timeLimitSeconds,
    reward: value.reward,
    externalDemoUrl: value.externalDemoUrl,
    securityNotes: value.securityNotes,
    status: "pending",
    reviewNotes: [],
    submittedAt: now,
    updatedAt: now,
  }

  await db.createCustomSubmission(submission)
  await track({
    type: "custom_game_submitted",
    creatorId: user.userId,
    metadata: { submissionId: submission.submissionId },
  })

  revalidatePath("/creator/custom-games")
  revalidatePath("/admin/review")

  return {
    ok: true,
    persisted: db.isPersistent,
    message: db.isPersistent
      ? "Submitted for admin review."
      : "Validated. Connect DynamoDB to submit for review.",
    data: { submissionId: submission.submissionId },
  }
}
