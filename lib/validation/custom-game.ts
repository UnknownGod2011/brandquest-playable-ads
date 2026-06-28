/**
 * BrandQuest — Custom game submission schema (Zod)
 *
 * IMPORTANT SECURITY NOTE: A custom game submission is METADATA only. We never
 * accept or execute arbitrary uploaded JavaScript. Approved games are intended
 * to run later inside a sandboxed iframe and must report scores through the
 * secure score API. See docs/SECURITY.md.
 */

import { z } from "zod"
import { campaignCategories } from "./campaign"

const unsafeMetadataPattern = /<script|<\/script|javascript:|data:text\/html|on\w+\s*=/i
const safeImageDataUrlPattern = /^data:image\/(?:png|jpeg|jpg|webp);base64,[a-z0-9+/=]+$/i
const maxThumbnailLength = 280_000
const leaderboardMetrics = ["score", "accuracy", "completionTime", "combo", "submittedAt"] as const

function safeText(min: number, max: number, message: string) {
  return z
    .string()
    .min(min, message)
    .max(max)
    .refine((value) => !unsafeMetadataPattern.test(value), {
      message: "Executable script-like content is not allowed.",
    })
}

function safeImageRef() {
  return z
    .string()
    .max(maxThumbnailLength, "Thumbnail is too large")
    .refine((value) => {
      if (value === "") return true
      if (unsafeMetadataPattern.test(value)) return false
      if (safeImageDataUrlPattern.test(value)) return true
      try {
        const url = new URL(value)
        return url.protocol === "https:"
      } catch {
        return false
      }
    }, "Use a safe HTTPS image URL or a small PNG/JPEG/WebP upload")
}

export const customGameSubmissionSchema = z
  .object({
    gameTitle: safeText(3, 80, "Title must be at least 3 characters"),
    brandName: z.preprocess(
      (value) => (value === "" ? undefined : value),
      safeText(2, 60, "Brand name is required").optional(),
    ),
    description: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z
        .string()
        .max(600)
        .refine((value) => !unsafeMetadataPattern.test(value), {
          message: "Executable script-like content is not allowed.",
        })
        .optional(),
    ),
    category: z.enum(campaignCategories).optional(),
    instructions: safeText(10, 800, "Explain how to play"),
    thumbnailUrl: safeImageRef().optional(),
    expectedScoreMin: z.number().int().min(0),
    expectedScoreMax: z.number().int().min(1).max(1_000_000),
    scoringMethod: z.enum(["points", "time", "accuracy", "combo"]),
    maxPossibleScore: z.number().int().min(1).max(1_000_000),
    timeLimitSeconds: z.number().int().min(5).max(3600),
    reward: safeText(2, 120, "Describe the reward"),
    rewardValue: z.number().min(0).max(1_000_000).optional(),
    // External demo URL or an uploaded-package placeholder. No code is executed.
    externalDemoUrl: z.string().url("Enter a valid URL").or(z.literal("")),
    securityNotes: safeText(
      10,
      800,
      "Describe data captured and any third-party calls",
    ),
    desiredGameStyle: z.preprocess(
      (value) => (value === "" ? undefined : value),
      safeText(2, 80, "Desired game style is too short").optional(),
    ),
    primaryMetric: z.enum(leaderboardMetrics).optional(),
    sortDirection: z.enum(["asc", "desc"]).optional(),
    tieBreakers: z.array(z.enum(leaderboardMetrics)).max(4).optional(),
  })
  .refine((d) => d.expectedScoreMax >= d.expectedScoreMin, {
    message: "Max expected score must be greater than min",
    path: ["expectedScoreMax"],
  })
  .refine((d) => d.maxPossibleScore >= d.expectedScoreMax, {
    message: "Max possible score must be at least the expected max",
    path: ["maxPossibleScore"],
  })

export type CustomGameSubmissionInput = z.infer<typeof customGameSubmissionSchema>

export const reviewCustomGameSchema = z.object({
  submissionId: z.string().min(1),
  action: z.enum(["approved", "rejected", "comment"]),
  note: z.string().max(800).optional().default(""),
})

export type ReviewCustomGameInput = z.infer<typeof reviewCustomGameSchema>
