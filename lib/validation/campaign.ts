/**
 * BrandQuest — Campaign validation schemas (Zod)
 *
 * Used by the create-campaign form (client-side) and the /api/campaigns route
 * (server-side). Validating in both places means the UI gives instant feedback
 * AND the server never trusts unvalidated input.
 */

import { z } from "zod"

const unsafeCampaignPattern = /<script|<\/script|javascript:|data:text\/html|on\w+\s*=/i
const safeImageDataUrlPattern = /^data:image\/(?:png|jpeg|jpg|webp);base64,[a-z0-9+/=]+$/i
const maxThumbnailLength = 280_000

function safeText(min: number, max: number, message: string) {
  return z
    .string()
    .min(min, message)
    .max(max)
    .refine((value) => !unsafeCampaignPattern.test(value), {
      message: "Executable script-like content is not allowed.",
    })
}

function safeOptionalText(max: number) {
  return z
    .string()
    .max(max)
    .refine((value) => !unsafeCampaignPattern.test(value), {
      message: "Executable script-like content is not allowed.",
    })
    .optional()
}

function safeImageRef() {
  return z
    .string()
    .max(maxThumbnailLength, "Thumbnail is too large")
    .refine((value) => {
      if (value === "") return true
      if (unsafeCampaignPattern.test(value)) return false
      if (safeImageDataUrlPattern.test(value)) return true
      try {
        const url = new URL(value)
        return url.protocol === "https:"
      } catch {
        return false
      }
    }, "Use a safe HTTPS image URL or a small PNG/JPEG/WebP upload")
}

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
  prompt: safeText(3, 280, "Question is too short"),
  options: z
    .array(safeText(1, 120, "Option cannot be empty"))
    .min(2, "At least 2 options")
    .max(6, "At most 6 options"),
  correctIndex: z.number().int().min(0),
})

export const templateConfigSchema = z.object({
  instructions: safeOptionalText(500),
  timeLimitSeconds: z.number().int().min(5).max(600).optional(),
  scoringRule: z.enum(["points", "time", "accuracy", "combo"]).optional(),
  maxPossibleScore: z.number().int().min(1).max(1_000_000).optional(),
  successMessage: safeOptionalText(280),
  rewardMessage: safeOptionalText(280),
  brandColor: z.string().max(32).optional(),
  logoUrl: safeImageRef().optional(),
  minDurationSeconds: z.number().int().min(0).max(600).optional(),
  maxScorePerSecond: z.number().min(0).max(100_000).optional(),
  questions: z.array(quizQuestionSchema).optional(),
  memoryPairs: z.number().int().min(2).max(12).optional(),
  memoryCards: z.array(z.string()).optional(),
  reactionTargets: z.number().int().min(3).max(50).optional(),
  externalDemoUrl: z.string().url().optional().or(z.literal("")),
  scrambleWords: z.array(safeText(2, 40, "Word is too short")).max(12).optional(),
  puzzleTiles: z.number().int().min(4).max(16).optional(),
  patternLength: z.number().int().min(3).max(8).optional(),
  patternRounds: z.number().int().min(2).max(12).optional(),
  typingText: safeOptionalText(500),
  targetPrice: z.number().min(0).max(1_000_000).optional(),
  priceTolerance: z.number().min(0).max(1_000_000).optional(),
  runnerDurationSeconds: z.number().int().min(10).max(120).optional(),
  runnerTokenValue: z.number().int().min(1).max(1000).optional(),
})

export const createCampaignSchema = z
  .object({
    title: safeText(3, 80, "Title must be at least 3 characters"),
    previewTitle: safeOptionalText(80),
    previewText: safeOptionalText(180),
    brandName: safeText(2, 60, "Brand name is required"),
    description: safeText(10, 600, "Add a longer description"),
    category: z.enum(campaignCategories),
    difficulty: z.enum(difficulties),
    reward: safeText(2, 120, "Describe the reward"),
    rewardValue: z.number().min(0, "Must be 0 or more").max(1_000_000),
    numberOfWinners: z.number().int().min(1, "At least 1 winner").max(10_000),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    maxAttemptsPerPlayer: z.number().int().min(1).max(100),
    eligibilityRules: safeOptionalText(600).default(""),
    brandLink: z.string().url("Enter a valid URL").or(z.literal("")),
    thumbnailUrl: safeImageRef().optional(),
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
