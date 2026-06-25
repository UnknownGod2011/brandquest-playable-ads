"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, Sparkles } from "lucide-react"
import { toast } from "sonner"
import type { ScoringType } from "@/lib/db/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { submitCustomGame } from "@/lib/campaigns/actions"

const scoringMethods: ScoringType[] = ["points", "time", "accuracy", "combo"]

interface FormState {
  gameTitle: string
  instructions: string
  expectedScoreMin: number
  expectedScoreMax: number
  scoringMethod: ScoringType
  maxPossibleScore: number
  timeLimitSeconds: number
  reward: string
  externalDemoUrl: string
  securityNotes: string
}

const initial: FormState = {
  gameTitle: "",
  instructions: "",
  expectedScoreMin: 0,
  expectedScoreMax: 1000,
  scoringMethod: "points",
  maxPossibleScore: 1000,
  timeLimitSeconds: 60,
  reward: "",
  externalDemoUrl: "",
  securityNotes: "",
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null
  return <p className="mt-1 text-xs text-destructive">{errors[0]}</p>
}

export function CustomGameForm() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(initial)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isPending, startTransition] = useTransition()

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function submit() {
    startTransition(async () => {
      const res = await submitCustomGame(form)
      if (!res.ok) {
        if (res.fieldErrors) setErrors(res.fieldErrors)
        toast.error(res.message)
        return
      }
      setErrors({})
      if (res.persisted) toast.success(res.message)
      else toast.message("Validated", { description: res.message })
      router.push("/creator/custom-games")
    })
  }

  return (
    <Card className="gap-5 p-6">
      <div className="flex items-start gap-3 rounded-xl bg-primary/10 p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="text-sm">
          <p className="font-medium">Security-first review</p>
          <p className="text-muted-foreground">
            Submissions are metadata only — no arbitrary code is uploaded or
            executed. Approved games run in a sandboxed iframe and report scores
            through the secure score API. An admin reviews every submission.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="title">Game title</Label>
          <Input
            id="title"
            value={form.gameTitle}
            onChange={(e) => update("gameTitle", e.target.value)}
            placeholder="e.g. Pixel Quest by Arcadia"
          />
          <FieldError errors={errors.gameTitle} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="instructions">How to play</Label>
          <Textarea
            id="instructions"
            value={form.instructions}
            onChange={(e) => update("instructions", e.target.value)}
            rows={3}
            placeholder="Describe the gameplay and objective."
          />
          <FieldError errors={errors.instructions} />
        </div>

        <div>
          <Label>Scoring method</Label>
          <Select
            value={form.scoringMethod}
            onValueChange={(v) => update("scoringMethod", (v ?? "points") as ScoringType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scoringMethods.map((m) => (
                <SelectItem key={m} value={m}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="timeLimit">Time limit (seconds)</Label>
          <Input
            id="timeLimit"
            type="number"
            value={form.timeLimitSeconds}
            onChange={(e) => update("timeLimitSeconds", Number(e.target.value))}
          />
          <FieldError errors={errors.timeLimitSeconds} />
        </div>

        <div>
          <Label htmlFor="min">Expected score (min)</Label>
          <Input
            id="min"
            type="number"
            value={form.expectedScoreMin}
            onChange={(e) => update("expectedScoreMin", Number(e.target.value))}
          />
          <FieldError errors={errors.expectedScoreMin} />
        </div>
        <div>
          <Label htmlFor="max">Expected score (max)</Label>
          <Input
            id="max"
            type="number"
            value={form.expectedScoreMax}
            onChange={(e) => update("expectedScoreMax", Number(e.target.value))}
          />
          <FieldError errors={errors.expectedScoreMax} />
        </div>
        <div>
          <Label htmlFor="maxScore">Max possible score</Label>
          <Input
            id="maxScore"
            type="number"
            value={form.maxPossibleScore}
            onChange={(e) => update("maxPossibleScore", Number(e.target.value))}
          />
          <FieldError errors={errors.maxPossibleScore} />
          <p className="mt-1 text-xs text-muted-foreground">
            Used server-side to reject impossible scores.
          </p>
        </div>
        <div>
          <Label htmlFor="reward">Reward</Label>
          <Input
            id="reward"
            value={form.reward}
            onChange={(e) => update("reward", e.target.value)}
            placeholder="e.g. Limited skin"
          />
          <FieldError errors={errors.reward} />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="demo">Demo URL</Label>
          <Input
            id="demo"
            value={form.externalDemoUrl}
            onChange={(e) => update("externalDemoUrl", e.target.value)}
            placeholder="https://your-demo.example.com"
          />
          <FieldError errors={errors.externalDemoUrl} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="security">Security notes</Label>
          <Textarea
            id="security"
            value={form.securityNotes}
            onChange={(e) => update("securityNotes", e.target.value)}
            rows={3}
            placeholder="What data does the game capture? Any third-party network calls? How are scores produced?"
          />
          <FieldError errors={errors.securityNotes} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={submit} disabled={isPending}>
          <Sparkles className="size-4" aria-hidden="true" />
          Submit for review
        </Button>
      </div>
    </Card>
  )
}
