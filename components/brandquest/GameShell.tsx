"use client"

/**
 * BrandQuest — GameShell
 *
 * Renders a playable shell for the core templates and submits the resulting
 * score to the server (/api/attempts), which is the ONLY place a score becomes
 * authoritative. The client never decides whether a score "counts" — it just
 * plays the game and reports a number; the server validates it.
 *
 * Playable shells: brand_quiz, memory_match, reaction_tap, custom (demo).
 * Other templates render a "coming soon" shell with a safe demo score path.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Flag,
  Loader2,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import type { Campaign } from "@/lib/db/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn, generateId } from "@/lib/utils"
import {
  scoreBrandQuiz,
  scoreMemoryMatch,
  scoreReactionTap,
} from "@/lib/game-engine/scoring"

interface SubmitResponse {
  ok: boolean
  status: "validated" | "flagged" | "rejected"
  reasons: string[]
  score: number
  persisted: boolean
  error?: string
}

type Phase = "intro" | "playing" | "submitting" | "result"

export function GameShell({ campaign }: { campaign: Campaign }) {
  const [phase, setPhase] = useState<Phase>("intro")
  const [result, setResult] = useState<SubmitResponse | null>(null)
  const startedAt = useRef<number>(0)

  const submit = useCallback(
    async (score: number) => {
      const durationSeconds = Math.max(
        1,
        Math.round((Date.now() - startedAt.current) / 1000),
      )
      setPhase("submitting")
      try {
        const res = await fetch("/api/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId: campaign.campaignId,
            attemptId: generateId("att"),
            score,
            durationSeconds,
          }),
        })
        const data = (await res.json()) as SubmitResponse
        setResult(data)
      } catch {
        setResult({
          ok: false,
          status: "rejected",
          reasons: ["Network error submitting score. Please try again."],
          score,
          persisted: false,
        })
      } finally {
        setPhase("result")
      }
    },
    [campaign.campaignId],
  )

  const start = useCallback(() => {
    startedAt.current = Date.now()
    setResult(null)
    setPhase("playing")
  }, [])

  if (phase === "intro") {
    return <IntroCard campaign={campaign} onStart={start} />
  }

  if (phase === "submitting") {
    return (
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <Loader2 className="size-7 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          Validating your score server-side…
        </p>
      </Card>
    )
  }

  if (phase === "result" && result) {
    return <ResultCard result={result} onRetry={start} campaign={campaign} />
  }

  // phase === "playing"
  return (
    <Card className="p-6">
      <ActiveGame campaign={campaign} onFinish={submit} />
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  Intro & result                                                            */
/* -------------------------------------------------------------------------- */

function IntroCard({
  campaign,
  onStart,
}: {
  campaign: Campaign
  onStart: () => void
}) {
  const cfg = campaign.templateConfig
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">How to play</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {cfg.instructions ?? defaultInstructions(campaign.templateType)}
      </p>
      <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
        <li>Time limit: {cfg.timeLimitSeconds ?? 60}s</li>
        <li>Attempts allowed: {campaign.maxAttemptsPerPlayer}</li>
        <li>Reward: {campaign.reward}</li>
      </ul>
      <Button className="mt-6" onClick={onStart}>
        Start game
      </Button>
    </Card>
  )
}

function ResultCard({
  result,
  onRetry,
  campaign,
}: {
  result: SubmitResponse
  onRetry: () => void
  campaign: Campaign
}) {
  const meta = {
    validated: {
      icon: CheckCircle2,
      color: "text-neon",
      title: "Score validated!",
    },
    flagged: {
      icon: Flag,
      color: "text-reward",
      title: "Score flagged for review",
    },
    rejected: { icon: XCircle, color: "text-destructive", title: "Score rejected" },
  }[result.status]
  const Icon = meta.icon

  return (
    <Card className="p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <Icon className={cn("size-10", meta.color)} aria-hidden="true" />
        <h2 className="text-xl font-bold">{meta.title}</h2>
        <p className="text-3xl font-bold tabular-nums text-primary">
          {result.score.toLocaleString()}
        </p>
        {result.status === "validated" && campaign.templateConfig.successMessage ? (
          <p className="text-sm text-muted-foreground">
            {campaign.templateConfig.successMessage}
          </p>
        ) : null}
        <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
          {result.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>

        {!result.persisted ? (
          <div className="mt-2 flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-left text-xs leading-relaxed text-muted-foreground">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>
              Score validation ready. Connect DynamoDB to persist attempts and
              update the leaderboard.
            </span>
          </div>
        ) : null}

        <div className="mt-4 flex items-center gap-2">
          <Button onClick={onRetry} variant="outline">
            <RotateCcw className="size-4" aria-hidden="true" />
            Play again
          </Button>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Validated server-side before any leaderboard placement.
        </p>
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  Active game switch                                                        */
/* -------------------------------------------------------------------------- */

function ActiveGame({
  campaign,
  onFinish,
}: {
  campaign: Campaign
  onFinish: (score: number) => void
}) {
  switch (campaign.templateType) {
    case "brand_quiz":
      return <BrandQuizGame campaign={campaign} onFinish={onFinish} />
    case "memory_match":
      return <MemoryMatchGame campaign={campaign} onFinish={onFinish} />
    case "reaction_tap":
      return <ReactionTapGame campaign={campaign} onFinish={onFinish} />
    case "custom":
      return <CustomClickerGame campaign={campaign} onFinish={onFinish} />
    default:
      return <ComingSoonGame onFinish={onFinish} />
  }
}

function defaultInstructions(type: string): string {
  switch (type) {
    case "brand_quiz":
      return "Answer each question correctly and quickly to score points."
    case "memory_match":
      return "Flip cards to find all matching pairs with as few flips as possible."
    case "reaction_tap":
      return "Tap each target as fast as it appears. Speed is everything."
    case "custom":
      return "Tap the glowing core as many times as you can before time runs out."
    default:
      return "Play through the challenge to earn your score."
  }
}

/* -------------------------------------------------------------------------- */
/*  Brand Quiz                                                                */
/* -------------------------------------------------------------------------- */

function BrandQuizGame({
  campaign,
  onFinish,
}: {
  campaign: Campaign
  onFinish: (score: number) => void
}) {
  const questions = campaign.templateConfig.questions ?? []
  const timeLimit = campaign.templateConfig.timeLimitSeconds ?? 60
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const startedAt = useRef(Date.now())

  if (questions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This quiz has no questions configured yet.
      </p>
    )
  }

  const q = questions[index]

  function answer(optionIndex: number) {
    const isCorrect = optionIndex === q.correctIndex
    const nextCorrect = correct + (isCorrect ? 1 : 0)
    setCorrect(nextCorrect)
    if (index + 1 >= questions.length) {
      const duration = Math.max(1, (Date.now() - startedAt.current) / 1000)
      onFinish(scoreBrandQuiz(nextCorrect, duration, timeLimit))
    } else {
      setIndex(index + 1)
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Question {index + 1} / {questions.length}
        </span>
        <span>Correct: {correct}</span>
      </div>
      <h3 className="text-lg font-semibold text-balance">{q.prompt}</h3>
      <div className="mt-4 grid gap-2">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => answer(i)}
            className="rounded-xl bg-secondary px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-primary/20"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Reaction Tap                                                              */
/* -------------------------------------------------------------------------- */

function ReactionTapGame({
  campaign,
  onFinish,
}: {
  campaign: Campaign
  onFinish: (score: number) => void
}) {
  const targets = campaign.templateConfig.reactionTargets ?? 15
  const [hits, setHits] = useState(0)
  const [pos, setPos] = useState({ x: 50, y: 50 })
  const misses = useRef(0)

  const moveTarget = useCallback(() => {
    setPos({
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
    })
  }, [])

  function hit() {
    const next = hits + 1
    setHits(next)
    if (next >= targets) {
      onFinish(scoreReactionTap(next, misses.current))
    } else {
      moveTarget()
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Hits: {hits} / {targets}
        </span>
        <span>Tap the glowing target</span>
      </div>
      <div
        className="relative h-72 w-full overflow-hidden rounded-xl bg-arcade-grid"
        onClick={() => {
          misses.current += 1
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            hit()
          }}
          aria-label="Tap target"
          className="absolute size-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon glow-primary transition-all"
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Memory Match                                                              */
/* -------------------------------------------------------------------------- */

const EMOJI_POOL = ["🔥", "⚡", "⭐", "🎯", "🏆", "💎", "🚀", "🎮", "🎁", "👾", "🛡️", "🍀"]

function MemoryMatchGame({
  campaign,
  onFinish,
}: {
  campaign: Campaign
  onFinish: (score: number) => void
}) {
  const pairs = campaign.templateConfig.memoryPairs ?? 6
  const startedAt = useRef(Date.now())
  const flipsRef = useRef(0)

  const deck = useMemo(() => {
    const symbols = EMOJI_POOL.slice(0, pairs)
    const cards = [...symbols, ...symbols].map((symbol, i) => ({
      id: i,
      symbol,
    }))
    // Shuffle (Fisher–Yates)
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[cards[i], cards[j]] = [cards[j], cards[i]]
    }
    return cards
  }, [pairs])

  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [busy, setBusy] = useState(false)

  function flip(id: number) {
    if (busy || flipped.includes(id) || matched.includes(id)) return
    const next = [...flipped, id]
    flipsRef.current += 1
    setFlipped(next)
    if (next.length === 2) {
      setBusy(true)
      const [a, b] = next
      const isMatch = deck[a].symbol === deck[b].symbol
      setTimeout(() => {
        if (isMatch) {
          const nextMatched = [...matched, a, b]
          setMatched(nextMatched)
          if (nextMatched.length === deck.length) {
            const duration = Math.max(1, (Date.now() - startedAt.current) / 1000)
            onFinish(scoreMemoryMatch(pairs, flipsRef.current, duration))
          }
        }
        setFlipped([])
        setBusy(false)
      }, 650)
    }
  }

  const cols = pairs <= 6 ? "grid-cols-4" : "grid-cols-6"

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Pairs: {matched.length / 2} / {pairs}</span>
        <span>Flips: {flipsRef.current}</span>
      </div>
      <div className={cn("grid gap-2", cols)}>
        {deck.map((card, id) => {
          const isUp = flipped.includes(id) || matched.includes(id)
          return (
            <button
              key={card.id}
              onClick={() => flip(id)}
              aria-label={isUp ? card.symbol : "Hidden card"}
              className={cn(
                "flex aspect-square items-center justify-center rounded-xl text-2xl transition-all",
                isUp
                  ? "bg-primary/20 ring-1 ring-primary/40"
                  : "bg-secondary hover:bg-secondary/70",
                matched.includes(id) && "opacity-60",
              )}
            >
              {isUp ? card.symbol : ""}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Custom clicker demo (stands in for an approved sandboxed custom game)     */
/* -------------------------------------------------------------------------- */

function CustomClickerGame({
  campaign,
  onFinish,
}: {
  campaign: Campaign
  onFinish: (score: number) => void
}) {
  const duration = 10
  const [count, setCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(duration)

  useEffect(() => {
    if (timeLeft <= 0) {
      onFinish(count * 10)
      return
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  return (
    <div className="text-center">
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Approved custom game (sandbox demo)</span>
        <span>Time left: {timeLeft}s</span>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        {campaign.templateConfig.instructions ??
          "Tap the core as many times as you can!"}
      </p>
      <button
        onClick={() => setCount((c) => c + 1)}
        disabled={timeLeft <= 0}
        aria-label="Tap the core"
        className="mx-auto flex size-40 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground glow-primary transition-transform active:scale-95 disabled:opacity-50"
      >
        {count}
      </button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Coming soon (catalog templates without a shell yet)                       */
/* -------------------------------------------------------------------------- */

function ComingSoonGame({ onFinish }: { onFinish: (score: number) => void }) {
  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground">
        A playable shell for this template is on the roadmap. You can still run
        the score validation flow with a demo score.
      </p>
      <Button className="mt-4" onClick={() => onFinish(100)}>
        Submit demo score
      </Button>
    </div>
  )
}
