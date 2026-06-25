"use server"

/**
 * BrandQuest — Admin review server actions
 *
 * Only admins can approve/reject/comment on custom-game submissions. Every call
 * is authorized server-side; the client UI is never the security boundary.
 */

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/current-user"
import { canReviewCustomGames } from "@/lib/security/permissions"
import { reviewCustomGameSchema } from "@/lib/validation/custom-game"
import { track } from "@/lib/analytics/events"
import { generateId } from "@/lib/utils"
import type {
  AdminReviewNote,
  CustomGameReviewStatus,
  AnalyticsEventType,
} from "@/lib/db/types"
import type { ActionResult } from "@/lib/campaigns/actions"

const ACTION_TO_STATUS: Record<string, CustomGameReviewStatus> = {
  approved: "approved",
  rejected: "rejected",
  comment: "pending",
}

const ACTION_TO_EVENT: Record<string, AnalyticsEventType | null> = {
  approved: "custom_game_approved",
  rejected: "custom_game_rejected",
  comment: null,
}

export async function reviewSubmission(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!canReviewCustomGames(user) || !user) {
    return { ok: false, message: "Only admins can review submissions." }
  }

  const parsed = reviewCustomGameSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid review payload.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }
  const { submissionId, action, note } = parsed.data

  if ((action === "approved" || action === "rejected") && note.trim().length < 3) {
    return {
      ok: false,
      message: "Add a short note explaining your decision.",
      fieldErrors: { note: ["A decision note is required."] },
    }
  }

  const reviewNote: AdminReviewNote = {
    noteId: generateId("note"),
    reviewerId: user.userId,
    reviewerName: user.displayName,
    note: note.trim(),
    action,
    createdAt: new Date().toISOString(),
  }

  await db.reviewCustomSubmission(submissionId, ACTION_TO_STATUS[action], reviewNote)

  const eventType = ACTION_TO_EVENT[action]
  if (eventType) {
    await track({ type: eventType, metadata: { submissionId } })
  }

  revalidatePath("/admin/review")
  revalidatePath("/creator/custom-games")

  return {
    ok: true,
    persisted: db.isPersistent,
    message: db.isPersistent
      ? action === "comment"
        ? "Comment added."
        : `Submission ${action}.`
      : "Connect DynamoDB to persist review decisions.",
  }
}
