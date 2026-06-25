/**
 * BrandQuest — Sample (demo) campaigns
 *
 * These are STATIC product/demo configuration, NOT backend data. They are only
 * ever shown behind an explicit "Preview sample campaigns" toggle so judges can
 * see how a populated arcade looks before DynamoDB is connected. They are never
 * persisted and never presented as real live campaigns.
 *
 * Each sample maps to a playable template shell so the demo flow works end to
 * end (play -> submit score -> see validation result).
 */

import type { Campaign } from "@/lib/db/types"

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString()
}

const base = {
  creatorId: "sample-creator",
  startDate: daysFromNow(-3),
  status: "live" as const,
  isCustom: false,
  createdAt: daysFromNow(-3),
  updatedAt: daysFromNow(-1),
}

export const SAMPLE_CAMPAIGNS: Campaign[] = [
  {
    ...base,
    campaignId: "sample-quiz",
    title: "Hydra Energy Brand IQ",
    brandName: "Hydra Energy",
    description:
      "Test your knowledge of Hydra Energy flavors and win a year of free drinks. Five quick questions, one shot at glory.",
    category: "food_beverage",
    difficulty: "easy",
    reward: "1yr Free Supply",
    rewardValue: 1200,
    numberOfWinners: 5,
    endDate: daysFromNow(6),
    maxAttemptsPerPlayer: 2,
    eligibilityRules: "Open to players 18+. One reward per winner.",
    brandLink: "https://example.com",
    thumbnailUrl: "/images/samples/quiz.png",
    templateType: "brand_quiz",
    templateConfig: {
      timeLimitSeconds: 60,
      successMessage: "Nice! You know your Hydra.",
      rewardMessage: "Top 5 scores win a year of free Hydra Energy.",
      questions: [
        {
          id: "q1",
          prompt: "What is Hydra Energy's signature flavor?",
          options: ["Citrus Surge", "Berry Blast", "Cola Classic", "Mint Chill"],
          correctIndex: 0,
        },
        {
          id: "q2",
          prompt: "How many calories in a Hydra Zero can?",
          options: ["120", "60", "0", "200"],
          correctIndex: 2,
        },
        {
          id: "q3",
          prompt: "Which year was Hydra Energy founded?",
          options: ["2009", "2015", "2021", "1998"],
          correctIndex: 1,
        },
        {
          id: "q4",
          prompt: "Hydra's main active ingredient is?",
          options: ["Taurine", "Guarana", "Ginseng", "All of these"],
          correctIndex: 3,
        },
        {
          id: "q5",
          prompt: "Hydra's tagline is 'Fuel your ___'?",
          options: ["Day", "Quest", "Game", "Hustle"],
          correctIndex: 1,
        },
      ],
    },
    stats: {
      registeredPlayers: 0,
      totalAttempts: 0,
      completions: 0,
      topScore: 0,
      suspiciousAttempts: 0,
      rewardClaims: 0,
    },
  },
  {
    ...base,
    campaignId: "sample-memory",
    title: "Nimbus Sneakers Memory Drop",
    brandName: "Nimbus",
    description:
      "Match the new Nimbus drop colorways before time runs out. Fastest clean runs win early access.",
    category: "fashion",
    difficulty: "medium",
    reward: "Early Access Pass",
    rewardValue: 250,
    numberOfWinners: 25,
    endDate: daysFromNow(2),
    maxAttemptsPerPlayer: 3,
    eligibilityRules: "Limited to first 25 qualifying scores.",
    brandLink: "https://example.com",
    thumbnailUrl: "/images/samples/memory.png",
    templateType: "memory_match",
    templateConfig: {
      timeLimitSeconds: 90,
      memoryPairs: 6,
      successMessage: "Clean run! You've got the eye.",
      rewardMessage: "Top fastest clean runs unlock early access.",
    },
    stats: {
      registeredPlayers: 0,
      totalAttempts: 0,
      completions: 0,
      topScore: 0,
      suspiciousAttempts: 0,
      rewardClaims: 0,
    },
  },
  {
    ...base,
    campaignId: "sample-reaction",
    title: "Volt Bank Quick Draw",
    brandName: "Volt Bank",
    description:
      "How fast can you tap? Volt Bank rewards the quickest reflexes with cash-back boosts.",
    category: "finance",
    difficulty: "easy",
    reward: "$50 Cash Boost",
    rewardValue: 50,
    numberOfWinners: 100,
    endDate: daysFromNow(10),
    maxAttemptsPerPlayer: 5,
    eligibilityRules: "Volt Bank customers only for reward fulfilment.",
    brandLink: "https://example.com",
    thumbnailUrl: "/images/samples/reaction.png",
    templateType: "reaction_tap",
    templateConfig: {
      timeLimitSeconds: 30,
      reactionTargets: 15,
      successMessage: "Lightning fast!",
      rewardMessage: "Top 100 scores earn a $50 cash boost.",
    },
    stats: {
      registeredPlayers: 0,
      totalAttempts: 0,
      completions: 0,
      topScore: 0,
      suspiciousAttempts: 0,
      rewardClaims: 0,
    },
  },
  {
    ...base,
    campaignId: "sample-custom",
    title: "Pixel Quest by Arcadia (Approved Custom)",
    brandName: "Arcadia Studios",
    description:
      "An approved custom game running in a secure sandbox. Scores are reported through BrandQuest's secure score API.",
    category: "gaming",
    difficulty: "medium",
    reward: "Limited NFT Skin",
    rewardValue: 300,
    numberOfWinners: 10,
    endDate: daysFromNow(8),
    maxAttemptsPerPlayer: 3,
    eligibilityRules: "Approved custom game. Demo only.",
    brandLink: "https://example.com",
    thumbnailUrl: "/images/samples/custom.png",
    templateType: "custom",
    isCustom: true,
    customSubmissionId: "sample-submission",
    templateConfig: {
      timeLimitSeconds: 45,
      maxPossibleScore: 1000,
      instructions: "Click the glowing core as many times as you can in 10s.",
      successMessage: "Run complete!",
      rewardMessage: "Top 10 scores win a limited skin.",
    },
    stats: {
      registeredPlayers: 0,
      totalAttempts: 0,
      completions: 0,
      topScore: 0,
      suspiciousAttempts: 0,
      rewardClaims: 0,
    },
  },
]

export function getSampleCampaign(campaignId: string): Campaign | undefined {
  return SAMPLE_CAMPAIGNS.find((c) => c.campaignId === campaignId)
}
