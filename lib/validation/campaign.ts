/**
 * BrandQuest — Campaign validation schemas (Zod)
 *
 * Used by the create-campaign form (client-side) and the /api/campaigns route
 * (server-side). Validating in both places means the UI gives instant feedback
 * AND the server never trusts unvalidated input.
 */

import { z } from "zod"

export const campaignCategories = [
  "food_beverage",
  "fashion",
  "tech",
  "gaming",
  "finance",
  "travel",
  "entertainment",
  "automotive",
  "other",
] as const

export const difficulties = ["easy", "medium", "hard"] as const

export const templateTypes = [
  "brand_quiz",
  "memory_match",
  "reaction_tap",
  "custom",
  "word_scramble",
  "logo_puzzle",
  "spot_the_difference",
  "code_hunt",
  "maze_sprint",
  "pattern_recall",
  "typing_race",
  "trivia_ladder",
  "product_hunt_puzzle",
  "puzzle_grid",
  "guess_the_sound",
  "timeline_sort",
  "tap_the_product",
  "find_the_hidden_logo",
  "price_guess",
  "brand_trivia_ladder",
] as const

export const quizQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string().min(3, "Question is too short").max(280),
  options: z
    .array(z.string().min(1, "Option cannot be empty").max(120))
    .min(2, "At least 2 options")
    .max(6, "At most 6 options"),
  correctIndex: z.number().int().min(0),
})

export const templateConfigSchema = z.object({
  instructions: z.string().max(500).optional(),
  timeLimitSeconds: z.number().int().min(5).max(600).optional(),
  scoringRule: z.enum(["points", "time", "accuracy", "combo"]).optional(),
  maxPossibleScore: z.number().int().min(1).max(1_000_000).optional(),
  successMessage: z.string().max(280).optional(),
  rewardMessage: z.string().max(280).optional(),
  brandColor: z.string().max(32).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  minDurationSeconds: z.number().int().min(0).max(600).optional(),
  maxScorePerSecond: z.number().min(0).max(100_000).optional(),
  questions: z.array(quizQuestionSchema).optional(),
  memoryPairs: z.number().int().min(2).max(12).optional(),
  memoryCards: z.array(z.string()).optional(),
  reactionTargets: z.number().int().min(3).max(50).optional(),
  externalDemoUrl: z.string().url().optional().or(z.literal("")),
})

export const createCampaignSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters").max(80),
    brandName: z.string().min(2, "Brand name is required").max(60),
    description: z.string().min(10, "Add a longer description").max(600),
    category: z.enum(campaignCategories),
    difficulty: z.enum(difficulties),
    reward: z.string().min(2, "Describe the reward").max(120),
    rewardValue: z.number().min(0, "Must be 0 or more").max(1_000_000),
    numberOfWinners: z.number().int().min(1, "At least 1 winner").max(10_000),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    maxAttemptsPerPlayer: z.number().int().min(1).max(100),
    eligibilityRules: z.string().max(600).optional().default(""),
    brandLink: z.string().url("Enter a valid URL").or(z.literal("")),
    thumbnailUrl: z.string().optional(),
    templateType: z.enum(templateTypes),
    isCustom: z.boolean().default(false),
    customSubmissionId: z.string().optional(),
    templateConfig: templateConfigSchema.default({}),
  })
  .refine(
    (data) => new Date(data.endDate).getTime() > new Date(data.startDate).getTime(),
    { message: "End date must be after the start date", path: ["endDate"] },
  )

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>
