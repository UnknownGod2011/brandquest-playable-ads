/**
 * BrandQuest — Custom game submission schema (Zod)
 *
 * IMPORTANT SECURITY NOTE: A custom game submission is METADATA only. We never
 * accept or execute arbitrary uploaded JavaScript. Approved games are intended
 * to run later inside a sandboxed iframe and must report scores through the
 * secure score API. See docs/SECURITY.md.
 */

import { z } from "zod"

export const customGameSubmissionSchema = z
  .object({
    gameTitle: z.string().min(3, "Title must be at least 3 characters").max(80),
    instructions: z.string().min(10, "Explain how to play").max(800),
    thumbnailUrl: z.string().optional(),
    expectedScoreMin: z.number().int().min(0),
    expectedScoreMax: z.number().int().min(1).max(1_000_000),
    scoringMethod: z.enum(["points", "time", "accuracy", "combo"]),
    maxPossibleScore: z.number().int().min(1).max(1_000_000),
    timeLimitSeconds: z.number().int().min(5).max(3600),
    reward: z.string().min(2, "Describe the reward").max(120),
    // External demo URL or an uploaded-package placeholder. No code is executed.
    externalDemoUrl: z.string().url("Enter a valid URL").or(z.literal("")),
    securityNotes: z
      .string()
      .min(10, "Describe data captured and any third-party calls")
      .max(800),
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
