/**
 * BrandQuest — Reward claim schema (Zod)
 */

import { z } from "zod"

export const claimRewardSchema = z.object({
  campaignId: z.string().min(1),
  rewardId: z.string().min(1),
})

export type ClaimRewardInput = z.infer<typeof claimRewardSchema>
