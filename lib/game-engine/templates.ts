/**
 * BrandQuest — Built-in game template catalog
 *
 * This is STATIC PRODUCT CONFIGURATION, not backend data. It defines the menu
 * of game templates a creator can pick from. Only a subset have a playable
 * shell implemented in v1 (`playable: true`); the rest are catalog entries that
 * communicate the product roadmap and let creators plan campaigns.
 */

import type { GameTemplate, GameTemplateType } from "@/lib/db/types"

export const GAME_TEMPLATES: GameTemplate[] = [
  /* ----------------------------- Core playable ---------------------------- */
  {
    type: "brand_quiz",
    name: "Brand Quiz Challenge",
    description:
      "Multiple-choice questions about a brand, product, or campaign. Players race to answer correctly for points.",
    bestUseCase: "Product education and brand awareness drives.",
    estimatedPlayTime: "60–90s",
    scoringType: "points",
    difficulty: "easy",
    dataCaptured: ["answers", "accuracy", "time per question"],
    customizationOptions: ["questions", "answer options", "correct answers", "time limit"],
    playable: true,
  },
  {
    type: "memory_match",
    name: "Memory Match Challenge",
    description:
      "Flip cards to find matching brand pairs. Fewer flips and faster times score higher.",
    bestUseCase: "Showcasing product lines and visual brand assets.",
    estimatedPlayTime: "45–120s",
    scoringType: "combo",
    difficulty: "medium",
    dataCaptured: ["flips", "matches", "completion time"],
    customizationOptions: ["memory cards", "pairs", "time limit", "brand colors"],
    playable: true,
  },
  {
    type: "reaction_tap",
    name: "Reaction Tap Challenge",
    description:
      "Tap targets as fast as they appear. Pure skill, pure speed — perfect for quick engagement.",
    bestUseCase: "High-volume, low-friction engagement spikes.",
    estimatedPlayTime: "20–40s",
    scoringType: "points",
    difficulty: "easy",
    dataCaptured: ["reaction times", "hits", "misses"],
    customizationOptions: ["reaction targets", "time limit", "brand colors"],
    playable: true,
  },
  {
    type: "custom",
    name: "Approved Custom Game Demo",
    description:
      "A creator-submitted game that has passed admin review. Runs in a sandboxed iframe and reports scores through the secure score API.",
    bestUseCase: "Bespoke branded experiences that go beyond templates.",
    estimatedPlayTime: "Varies",
    scoringType: "points",
    difficulty: "medium",
    dataCaptured: ["score", "duration", "completion"],
    customizationOptions: ["instructions", "scoring method", "time limit", "reward"],
    playable: true,
  },

  /* --------------------------- Catalog (roadmap) -------------------------- */
  catalog("word_scramble", "Word Scramble", "Unscramble brand words against the clock.", "Tagline and product-name recall.", "30–60s", "time", "easy"),
  catalog("logo_puzzle", "Logo Puzzle", "Reassemble a brand logo from shuffled tiles.", "Logo recognition and brand recall.", "45–90s", "time", "medium"),
  catalog("spot_the_difference", "Spot the Difference", "Find differences between two product images.", "Product detail and attention campaigns.", "60–120s", "accuracy", "medium"),
  catalog("code_hunt", "Code Hunt", "Search a branded scene for hidden promo codes.", "Coupon drops and treasure-hunt promos.", "60–120s", "points", "medium"),
  catalog("maze_sprint", "Maze Sprint", "Navigate a branded maze to the prize.", "Playful, immersive brand worlds.", "45–90s", "time", "hard"),
  catalog("pattern_recall", "Pattern Recall", "Repeat an expanding sequence of brand cues.", "Memory-driven engagement and retention.", "30–90s", "combo", "medium"),
  catalog("typing_race", "Typing Race", "Type brand slogans accurately and fast.", "Slogan reinforcement campaigns.", "30–60s", "accuracy", "easy"),
  catalog("trivia_ladder", "Trivia Ladder", "Climb a ladder of increasingly hard trivia.", "Deep brand knowledge and superfans.", "90–180s", "points", "hard"),
  catalog("product_hunt_puzzle", "Product Hunt Puzzle", "Solve puzzles to reveal a new product.", "Product launches and teasers.", "60–120s", "points", "medium"),
  catalog("puzzle_grid", "Puzzle Grid", "Slide tiles to complete a branded image.", "Visual brand asset showcases.", "60–120s", "time", "medium"),
  catalog("guess_the_sound", "Guess the Sound", "Identify brand jingles and sound logos.", "Audio branding and sonic identity.", "30–60s", "accuracy", "easy"),
  catalog("timeline_sort", "Timeline Sort", "Order brand milestones chronologically.", "Heritage and brand-story campaigns.", "60–90s", "accuracy", "medium"),
  catalog("tap_the_product", "Tap the Product", "Tap the correct product among decoys.", "Product discovery and SKU awareness.", "20–40s", "points", "easy"),
  catalog("find_the_hidden_logo", "Find the Hidden Logo", "Locate the brand logo hidden in a scene.", "Subtle brand placement campaigns.", "30–60s", "time", "easy"),
  catalog("price_guess", "Price Guess Challenge", "Guess product prices as close as possible.", "Pricing perception and value messaging.", "30–60s", "accuracy", "easy"),
  catalog("brand_trivia_ladder", "Brand Trivia Ladder", "Progressive brand trivia with rising stakes.", "Loyalty programs and superfan rewards.", "90–180s", "points", "hard"),
]

function catalog(
  type: GameTemplateType,
  name: string,
  description: string,
  bestUseCase: string,
  estimatedPlayTime: string,
  scoringType: GameTemplate["scoringType"],
  difficulty: GameTemplate["difficulty"],
): GameTemplate {
  return {
    type,
    name,
    description,
    bestUseCase,
    estimatedPlayTime,
    scoringType,
    difficulty,
    dataCaptured: ["score", "duration", "completion"],
    customizationOptions: ["instructions", "time limit", "brand colors", "success message"],
    playable: false,
  }
}

export const PLAYABLE_TEMPLATE_TYPES: GameTemplateType[] = GAME_TEMPLATES.filter(
  (t) => t.playable,
).map((t) => t.type)

export function getTemplate(type: GameTemplateType): GameTemplate | undefined {
  return GAME_TEMPLATES.find((t) => t.type === type)
}

export function isPlayable(type: GameTemplateType): boolean {
  return PLAYABLE_TEMPLATE_TYPES.includes(type)
}
