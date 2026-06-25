/**
 * BrandQuest — Attempt submission schema (Zod)
 *
 * The client submits a minimal, untrusted payload. The server attaches identity
 * + runs anti-cheat (lib/game-engine/anti-cheat.ts) before anything is stored.
 */

import { z } from "zod"

export const submitAttemptSchema = z.object({
  campaignId: z.string().min(1, "campaignId is required"),
  // attemptId is generated client-side (idempotency key) and checked for
  // duplicates server-side.
  attemptId: z.string().min(8, "attemptId is required"),
  score: z.number().finite("Score must be a number").min(0),
  durationSeconds: z.number().finite().min(0).max(3600),
})

export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>
