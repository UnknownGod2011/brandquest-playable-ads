/**
 * BrandQuest — Analytics event helpers
 *
 * A thin, typed wrapper for recording analytics events through the DB adapter.
 * With the no-op adapter these are safe no-ops; with DynamoDB enabled they are
 * appended to the campaign's event partition (see lib/db/dynamodb.ts).
 */

import { db } from "@/lib/db"
import type { AnalyticsEvent, AnalyticsEventType } from "@/lib/db/types"
import { generateId } from "@/lib/utils"

export const ANALYTICS_EVENT_TYPES: AnalyticsEventType[] = [
  "campaign_created",
  "campaign_published",
  "campaign_viewed",
  "player_registered",
  "game_started",
  "attempt_submitted",
  "score_validated",
  "leaderboard_updated",
  "reward_claimed",
  "custom_game_submitted",
  "custom_game_approved",
  "custom_game_rejected",
  "analytics_viewed",
]

export interface TrackInput {
  type: AnalyticsEventType
  campaignId?: string
  playerId?: string
  creatorId?: string
  metadata?: Record<string, string | number | boolean>
}

export async function track(input: TrackInput): Promise<void> {
  const event: AnalyticsEvent = {
    eventId: generateId("evt"),
    type: input.type,
    campaignId: input.campaignId,
    playerId: input.playerId,
    creatorId: input.creatorId,
    metadata: input.metadata,
    createdAt: new Date().toISOString(),
  }
  try {
    await db.recordEvent(event)
  } catch (err) {
    // Analytics must never break the primary flow.
    console.log("[v0] analytics record failed:", (err as Error).message)
  }
}
