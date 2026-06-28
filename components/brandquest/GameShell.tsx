"use client"

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
  scoreBrandRushRunner,
  scoreMemoryMatch,
  scorePatternRecall,
  scoreReactionTap,
  scoreWordScramble,
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
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "game_started", campaignId: campaign.campaignId }),
    }).catch(() => undefined)
  }, [campaign.campaignId])

  if (phase === "intro") return <IntroCard campaign={campaign} onStart={start} />

  if (phase === "submitting") {
    return (
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <Loader2 className="size-7 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          Validating your score server-side...
        </p>
      </Card>
    )
  }

  if (phase === "result" && result) {
    return <ResultCard result={result} onRetry={start} campaign={campaign} />
  }

  return (
    <Card className="p-6">
      <ActiveGame campaign={campaign} onFinish={submit} />
    </Card>
  )
}

function IntroCard({ campaign, onStart }: { campaign: Campaign; onStart: () => void }) {
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
          {result.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>

        {!result.persisted ? (
          <div className="mt-2 flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-left text-xs leading-relaxed text-muted-foreground">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>
              This score was validated, but it was not persisted by the current
              storage mode.
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
    case "word_scramble":
      return <WordScrambleGame campaign={campaign} onFinish={onFinish} />
    case "pattern_recall":
      return <PatternRecallGame campaign={campaign} onFinish={onFinish} />
    case "custom":
      return <BrandRushRunnerGame campaign={campaign} onFinish={onFinish} />
    default:
      return <ComingSoonGame />
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
    case "word_scramble":
      return "Unscramble each brand word before the timer pressure catches up."
    case "pattern_recall":
      return "Watch the sequence, then repeat it from memory."
    case "custom":
      return "Move between lanes, collect brand tokens, and avoid blockers."
    default:
      return "This template is not playable yet."
  }
}

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

const SYMBOL_POOL = ["BQ", "XP", "AD", "WIN", "GO", "VIP", "PRO", "MAX", "NEW", "TRY", "PLAY", "GIFT"]

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
    const symbols = SYMBOL_POOL.slice(0, pairs)
    const cards = [...symbols, ...symbols].map((symbol, i) => ({ id: i, symbol }))
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
        <span>
          Pairs: {matched.length / 2} / {pairs}
        </span>
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
                "flex aspect-square items-center justify-center rounded-xl text-sm font-bold transition-all",
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

function WordScrambleGame({
  campaign,
  onFinish,
}: {
  campaign: Campaign
  onFinish: (score: number) => void
}) {
  const words = useMemo(() => {
    const configured = campaign.templateConfig.scrambleWords?.filter(Boolean)
    const fallback = [campaign.brandName, "reward", "quest"].filter(Boolean)
    return (configured?.length ? configured : fallback).slice(0, 8).map((word) => word.toUpperCase())
  }, [campaign.brandName, campaign.templateConfig.scrambleWords])
  const timeLimit = campaign.templateConfig.timeLimitSeconds ?? 60
  const startedAt = useRef(Date.now())
  const [index, setIndex] = useState(0)
  const [solved, setSolved] = useState(0)
  const [answer, setAnswer] = useState("")
  const [feedback, setFeedback] = useState("")

  const scrambled = useMemo(() => scramble(words[index] ?? ""), [words, index])

  function submitWord() {
    const correct = answer.trim().toUpperCase() === words[index]
    const nextSolved = solved + (correct ? 1 : 0)
    setFeedback(correct ? "Correct" : `Answer: ${words[index]}`)
    setSolved(nextSolved)
    setAnswer("")
    setTimeout(() => {
      if (index + 1 >= words.length) {
        const duration = Math.max(1, (Date.now() - startedAt.current) / 1000)
        onFinish(scoreWordScramble(nextSolved, words.length, duration, timeLimit))
      } else {
        setFeedback("")
        setIndex((current) => current + 1)
      }
    }, 650)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Word {index + 1} / {words.length}
        </span>
        <span>Solved: {solved}</span>
      </div>
      <div className="rounded-xl bg-secondary/60 p-6 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Unscramble</p>
        <p className="mt-2 text-3xl font-black tracking-[0.3em] text-primary">
          {scrambled}
        </p>
      </div>
      <div className="mt-4 flex gap-2">
        <input
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && answer.trim()) submitWord()
          }}
          className="min-h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Type the word"
        />
        <Button onClick={submitWord} disabled={!answer.trim()}>
          Submit
        </Button>
      </div>
      {feedback ? <p className="mt-2 text-sm text-muted-foreground">{feedback}</p> : null}
    </div>
  )
}

function PatternRecallGame({
  campaign,
  onFinish,
}: {
  campaign: Campaign
  onFinish: (score: number) => void
}) {
  const patternLength = campaign.templateConfig.patternLength ?? 4
  const rounds = campaign.templateConfig.patternRounds ?? 5
  const [round, setRound] = useState(1)
  const [sequence, setSequence] = useState<number[]>(() => makeSequence(patternLength, 1))
  const [input, setInput] = useState<number[]>([])
  const [showing, setShowing] = useState(true)
  const [mistakes, setMistakes] = useState(0)

  useEffect(() => {
    setShowing(true)
    const timeout = setTimeout(() => {
      setShowing(false)
      setInput([])
    }, 900 + sequence.length * 250)
    return () => clearTimeout(timeout)
  }, [sequence])

  function press(tile: number) {
    if (showing) return
    const next = [...input, tile]
    setInput(next)
    const expected = sequence[next.length - 1]
    if (tile !== expected) {
      onFinish(scorePatternRecall(round - 1, mistakes + 1))
      return
    }
    if (next.length === sequence.length) {
      if (round >= rounds) {
        onFinish(scorePatternRecall(rounds, mistakes))
      } else {
        const nextRound = round + 1
        setRound(nextRound)
        setSequence(makeSequence(patternLength, nextRound))
      }
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Round {round} / {rounds}
        </span>
        <span>{showing ? "Memorize the sequence" : "Repeat it"}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((tile) => {
          const active = showing && sequence.includes(tile)
          return (
            <button
              key={tile}
              onClick={() => press(tile)}
              className={cn(
                "h-24 rounded-xl border border-border bg-secondary text-lg font-bold transition",
                active && "bg-primary text-primary-foreground glow-primary",
                !showing && "hover:bg-primary/20",
              )}
            >
              {tile + 1}
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Progress: {input.length} / {sequence.length}
      </p>
    </div>
  )
}

function BrandRushRunnerGame({
  campaign,
  onFinish,
}: {
  campaign: Campaign
  onFinish: (score: number) => void
}) {
  const duration = campaign.templateConfig.runnerDurationSeconds ?? 30
  const tokenValue = campaign.templateConfig.runnerTokenValue ?? 25
  const [lane, setLane] = useState(1)
  const [timeLeft, setTimeLeft] = useState(duration)
  const [tokens, setTokens] = useState(0)
  const [avoided, setAvoided] = useState(0)
  const [hit, setHit] = useState(false)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") setLane((value) => Math.max(0, value - 1))
      if (event.key === "ArrowRight") setLane((value) => Math.min(2, value + 1))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (timeLeft <= 0 || hit) {
      const survived = duration - Math.max(0, timeLeft)
      onFinish(scoreBrandRushRunner(tokens, survived, avoided, tokenValue))
      return
    }
    const tick = setTimeout(() => {
      setTimeLeft((value) => value - 1)
      setTokens((value) => value + (Math.random() > 0.35 ? 1 : 0))
      setAvoided((value) => value + 1)
      if (Math.random() < 0.08 && lane === 1) setHit(true)
    }, 1000)
    return () => clearTimeout(tick)
  }, [avoided, duration, hit, lane, onFinish, timeLeft, tokenValue, tokens])

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Tokens: {tokens}</span>
        <span>Time left: {Math.max(0, timeLeft)}s</span>
      </div>
      <div className="relative h-72 overflow-hidden rounded-xl bg-arcade-grid p-4">
        <div className="absolute inset-x-6 bottom-5 grid grid-cols-3 gap-3">
          {[0, 1, 2].map((value) => (
            <button
              key={value}
              onClick={() => setLane(value)}
              className={cn(
                "h-44 rounded-xl border border-border/70 bg-background/50",
                value === lane && "bg-primary/25 ring-2 ring-primary",
              )}
              aria-label={`Move to lane ${value + 1}`}
            >
              {value === lane ? (
                <span className="mx-auto block size-10 rounded-full bg-neon glow-primary" />
              ) : null}
            </button>
          ))}
        </div>
        <div className="absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-reward px-3 py-1 text-xs font-bold text-background">
          {hit ? "Obstacle hit" : "Collect tokens"}
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-2">
        <Button variant="outline" onClick={() => setLane((value) => Math.max(0, value - 1))}>
          Left
        </Button>
        <Button variant="outline" onClick={() => setLane((value) => Math.min(2, value + 1))}>
          Right
        </Button>
      </div>
    </div>
  )
}

function ComingSoonGame() {
  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground">
        This template is in the catalog, but its playable shell is not enabled
        yet. Choose a playable template for score submission.
      </p>
    </div>
  )
}

function scramble(word: string): string {
  const letters = word.split("")
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[letters[i], letters[j]] = [letters[j], letters[i]]
  }
  const value = letters.join("")
  return value === word && word.length > 1 ? `${word.slice(1)}${word[0]}` : value
}

function makeSequence(patternLength: number, round: number): number[] {
  return Array.from({ length: patternLength + round - 1 }, () =>
    Math.floor(Math.random() * 4),
  )
}
