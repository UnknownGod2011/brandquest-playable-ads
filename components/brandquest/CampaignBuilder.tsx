"use client"

/**
 * BrandQuest — Multi-step campaign builder
 *
 * Steps: 1) Template  2) Details  3) Game config  4) Reward & schedule
 *        5) Review & publish.
 *
 * The form validates with the same Zod schema the server uses
 * (lib/validation/campaign.ts) so the UI gives instant feedback and the server
 * never trusts unvalidated input. Submitting calls the createCampaign action.
 */

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Gamepad2,
  Lock,
  Plus,
  Rocket,
  Save,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import {
  GAME_TEMPLATES,
} from "@/lib/game-engine/templates"
import {
  campaignCategories,
  difficulties,
  createCampaignSchema,
  type CreateCampaignInput,
} from "@/lib/validation/campaign"
import type {
  CampaignCategory,
  Difficulty,
  GameTemplateType,
  QuizQuestion,
} from "@/lib/db/types"
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
import { cn, generateId, humanize } from "@/lib/utils"
import { createCampaign } from "@/lib/campaigns/actions"

const STEPS = ["Template", "Details", "Game setup", "Reward & schedule", "Review"]

function isoInDays(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000)
  return d.toISOString().slice(0, 16)
}

type FormState = Omit<CreateCampaignInput, "templateConfig"> & {
  templateConfig: NonNullable<CreateCampaignInput["templateConfig"]>
}

const initialState: FormState = {
  title: "",
  brandName: "",
  description: "",
  category: "tech",
  difficulty: "easy",
  reward: "",
  rewardValue: 0,
  numberOfWinners: 1,
  startDate: isoInDays(0),
  endDate: isoInDays(14),
  maxAttemptsPerPlayer: 3,
  eligibilityRules: "",
  brandLink: "",
  thumbnailUrl: "",
  templateType: "brand_quiz",
  isCustom: false,
  templateConfig: {
    timeLimitSeconds: 60,
    successMessage: "",
    questions: [],
    memoryPairs: 6,
    reactionTargets: 15,
  },
}

export function CampaignBuilder() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(initialState)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isPending, startTransition] = useTransition()

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }
  function updateConfig(patch: Partial<FormState["templateConfig"]>) {
    setForm((f) => ({ ...f, templateConfig: { ...f.templateConfig, ...patch } }))
  }

  const playableTemplates = useMemo(
    () => GAME_TEMPLATES.filter((t) => t.type !== "custom"),
    [],
  )

  function validateStep(target: number): boolean {
    // Validate the full schema and surface only relevant field errors per step.
    const parsed = createCampaignSchema.safeParse(form)
    if (parsed.success) {
      setErrors({})
      return true
    }
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>
    const stepFields: Record<number, string[]> = {
      0: ["templateType"],
      1: ["title", "brandName", "description", "category", "difficulty", "brandLink"],
      2: ["templateConfig"],
      3: ["reward", "rewardValue", "numberOfWinners", "startDate", "endDate", "maxAttemptsPerPlayer"],
      4: [],
    }
    const relevant = stepFields[target] ?? []
    const filtered: Record<string, string[]> = {}
    for (const key of relevant) {
      if (fieldErrors[key]) filtered[key] = fieldErrors[key]
    }
    // Step 4 (review) shows everything.
    setErrors(target === 4 ? fieldErrors : filtered)
    return Object.keys(target === 4 ? fieldErrors : filtered).length === 0
  }

  function next() {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length - 1))
    else toast.error("Please fix the highlighted fields.")
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0))
  }

  function submit(publish: boolean) {
    startTransition(async () => {
      const res = await createCampaign(form, publish)
      if (!res.ok) {
        if (res.fieldErrors) setErrors(res.fieldErrors)
        toast.error(res.message)
        return
      }
      if (res.persisted) toast.success(res.message)
      else toast.message("Validated", { description: res.message })
      router.push("/creator")
    })
  }

  return (
    <div className="space-y-6">
      <Stepper step={step} />

      {step === 0 && (
        <TemplateStep
          templates={playableTemplates}
          selected={form.templateType}
          onSelect={(type) => {
            update("templateType", type)
            update("isCustom", false)
          }}
        />
      )}

      {step === 1 && (
        <DetailsStep form={form} errors={errors} update={update} />
      )}

      {step === 2 && (
        <GameSetupStep form={form} updateConfig={updateConfig} addQuestion={addQuestion} removeQuestion={removeQuestion} updateQuestion={updateQuestion} />
      )}

      {step === 3 && (
        <RewardStep form={form} errors={errors} update={update} />
      )}

      {step === 4 && <ReviewStep form={form} errors={errors} />}

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={back} disabled={step === 0}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={next}>
            Continue
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" disabled={isPending} onClick={() => submit(false)}>
              <Save className="size-4" aria-hidden="true" />
              Save draft
            </Button>
            <Button disabled={isPending} onClick={() => submit(true)}>
              <Rocket className="size-4" aria-hidden="true" />
              Publish campaign
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  /* ---- quiz question helpers ---- */
  function addQuestion() {
    const q: QuizQuestion = {
      id: generateId("q"),
      prompt: "",
      options: ["", ""],
      correctIndex: 0,
    }
    updateConfig({ questions: [...(form.templateConfig.questions ?? []), q] })
  }
  function removeQuestion(id: string) {
    updateConfig({
      questions: (form.templateConfig.questions ?? []).filter((q) => q.id !== id),
    })
  }
  function updateQuestion(id: string, patch: Partial<QuizQuestion>) {
    updateConfig({
      questions: (form.templateConfig.questions ?? []).map((q) =>
        q.id === id ? { ...q, ...patch } : q,
      ),
    })
  }
}

/* -------------------------------------------------------------------------- */
/*  Stepper                                                                    */
/* -------------------------------------------------------------------------- */

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {STEPS.map((label, i) => {
        const done = i < step
        const active = i === step
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-xs font-bold",
                active
                  ? "bg-primary text-primary-foreground"
                  : done
                    ? "bg-neon/20 text-neon"
                    : "bg-secondary text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-xs font-medium",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 ? (
              <span className="mx-1 hidden h-px w-6 bg-border sm:block" />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

/* -------------------------------------------------------------------------- */
/*  Step 1 — Template                                                          */
/* -------------------------------------------------------------------------- */

function TemplateStep({
  templates,
  selected,
  onSelect,
}: {
  templates: typeof GAME_TEMPLATES
  selected: GameTemplateType
  onSelect: (type: GameTemplateType) => void
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold">Choose a game template</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Playable templates work end to end today. Roadmap templates can be
        configured now and become playable as shells ship.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => {
          const active = t.type === selected
          return (
            <button
              key={t.type}
              onClick={() => onSelect(t.type)}
              className={cn(
                "flex flex-col gap-2 rounded-2xl p-4 text-left ring-1 transition-all",
                active
                  ? "bg-primary/10 ring-primary glow-primary"
                  : "bg-card ring-foreground/10 hover:ring-primary/40",
              )}
            >
              <div className="flex items-center justify-between">
                <Gamepad2
                  className={cn("size-5", active ? "text-primary" : "text-muted-foreground")}
                  aria-hidden="true"
                />
                {t.playable ? (
                  <span className="rounded-full bg-neon/15 px-2 py-0.5 text-[10px] font-semibold text-neon">
                    Playable
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    <Lock className="size-2.5" aria-hidden="true" />
                    Roadmap
                  </span>
                )}
              </div>
              <span className="font-semibold">{t.name}</span>
              <span className="text-xs leading-relaxed text-muted-foreground">
                {t.description}
              </span>
              <span className="mt-1 text-[11px] text-muted-foreground">
                {t.estimatedPlayTime} · {humanize(t.scoringType)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Step 2 — Details                                                           */
/* -------------------------------------------------------------------------- */

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null
  return <p className="mt-1 text-xs text-destructive">{errors[0]}</p>
}

function DetailsStep({
  form,
  errors,
  update,
}: {
  form: FormState
  errors: Record<string, string[]>
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}) {
  return (
    <Card className="gap-4 p-6">
      <h2 className="text-lg font-semibold">Campaign details</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="title">Campaign title</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Hydra Energy Brand IQ"
          />
          <FieldError errors={errors.title} />
        </div>
        <div>
          <Label htmlFor="brand">Brand name</Label>
          <Input
            id="brand"
            value={form.brandName}
            onChange={(e) => update("brandName", e.target.value)}
            placeholder="Your brand"
          />
          <FieldError errors={errors.brandName} />
        </div>
        <div>
          <Label htmlFor="brandLink">Brand link</Label>
          <Input
            id="brandLink"
            value={form.brandLink}
            onChange={(e) => update("brandLink", e.target.value)}
            placeholder="https://yourbrand.com"
          />
          <FieldError errors={errors.brandLink} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="desc">Description</Label>
          <Textarea
            id="desc"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="What is this campaign about and what can players win?"
            rows={4}
          />
          <FieldError errors={errors.description} />
        </div>
        <div>
          <Label>Category</Label>
          <Select
            value={form.category}
            onValueChange={(v) => update("category", (v ?? "tech") as CampaignCategory)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {campaignCategories.map((c) => (
                <SelectItem key={c} value={c}>
                  {humanize(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Difficulty</Label>
          <Select
            value={form.difficulty}
            onValueChange={(v) => update("difficulty", (v ?? "easy") as Difficulty)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {difficulties.map((d) => (
                <SelectItem key={d} value={d}>
                  {humanize(d)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  Step 3 — Game setup                                                        */
/* -------------------------------------------------------------------------- */

function GameSetupStep({
  form,
  updateConfig,
  addQuestion,
  removeQuestion,
  updateQuestion,
}: {
  form: FormState
  updateConfig: (patch: Partial<FormState["templateConfig"]>) => void
  addQuestion: () => void
  removeQuestion: (id: string) => void
  updateQuestion: (id: string, patch: Partial<QuizQuestion>) => void
}) {
  const cfg = form.templateConfig
  return (
    <Card className="gap-4 p-6">
      <h2 className="text-lg font-semibold">Game setup</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="time">Time limit (seconds)</Label>
          <Input
            id="time"
            type="number"
            value={cfg.timeLimitSeconds ?? 60}
            onChange={(e) => updateConfig({ timeLimitSeconds: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="success">Success message</Label>
          <Input
            id="success"
            value={cfg.successMessage ?? ""}
            onChange={(e) => updateConfig({ successMessage: e.target.value })}
            placeholder="Nice play!"
          />
        </div>
      </div>

      {form.templateType === "brand_quiz" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Questions</h3>
            <Button size="sm" variant="outline" onClick={addQuestion}>
              <Plus className="size-3.5" aria-hidden="true" />
              Add question
            </Button>
          </div>
          {(cfg.questions ?? []).length === 0 ? (
            <p className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
              Add at least one question. Each needs a prompt, 2–6 options, and a
              correct answer.
            </p>
          ) : null}
          {(cfg.questions ?? []).map((q, qi) => (
            <div key={q.id} className="rounded-xl bg-secondary/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Question {qi + 1}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeQuestion(q.id)}
                  aria-label="Remove question"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </Button>
              </div>
              <Input
                className="mt-2"
                value={q.prompt}
                onChange={(e) => updateQuestion(q.id, { prompt: e.target.value })}
                placeholder="Question prompt"
              />
              <div className="mt-2 grid gap-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuestion(q.id, { correctIndex: oi })}
                      aria-label={`Mark option ${oi + 1} correct`}
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
                        q.correctIndex === oi
                          ? "bg-neon text-background"
                          : "bg-background text-muted-foreground ring-1 ring-border",
                      )}
                    >
                      {q.correctIndex === oi ? <Check className="size-3" aria-hidden="true" /> : oi + 1}
                    </button>
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const options = [...q.options]
                        options[oi] = e.target.value
                        updateQuestion(q.id, { options })
                      }}
                      placeholder={`Option ${oi + 1}`}
                    />
                    {q.options.length > 2 ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label="Remove option"
                        onClick={() =>
                          updateQuestion(q.id, {
                            options: q.options.filter((_, i) => i !== oi),
                            correctIndex: Math.min(q.correctIndex, q.options.length - 2),
                          })
                        }
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </Button>
                    ) : null}
                  </div>
                ))}
                {q.options.length < 6 ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="justify-start"
                    onClick={() => updateQuestion(q.id, { options: [...q.options, ""] })}
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    Add option
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {form.templateType === "memory_match" && (
        <div>
          <Label htmlFor="pairs">Number of pairs ({cfg.memoryPairs ?? 6})</Label>
          <Input
            id="pairs"
            type="number"
            min={2}
            max={12}
            value={cfg.memoryPairs ?? 6}
            onChange={(e) => updateConfig({ memoryPairs: Number(e.target.value) })}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Players match pairs with as few flips as possible. 2–12 pairs.
          </p>
        </div>
      )}

      {form.templateType === "reaction_tap" && (
        <div>
          <Label htmlFor="targets">Targets to tap ({cfg.reactionTargets ?? 15})</Label>
          <Input
            id="targets"
            type="number"
            min={3}
            max={50}
            value={cfg.reactionTargets ?? 15}
            onChange={(e) => updateConfig({ reactionTargets: Number(e.target.value) })}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Number of targets players must hit. 3–50.
          </p>
        </div>
      )}

      {!["brand_quiz", "memory_match", "reaction_tap"].includes(form.templateType) && (
        <div>
          <Label htmlFor="maxScore">Max possible score</Label>
          <Input
            id="maxScore"
            type="number"
            value={cfg.maxPossibleScore ?? 1000}
            onChange={(e) => updateConfig({ maxPossibleScore: Number(e.target.value) })}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Used by the server to reject impossible scores for this template.
          </p>
        </div>
      )}
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  Step 4 — Reward & schedule                                                 */
/* -------------------------------------------------------------------------- */

function RewardStep({
  form,
  errors,
  update,
}: {
  form: FormState
  errors: Record<string, string[]>
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}) {
  return (
    <Card className="gap-4 p-6">
      <h2 className="text-lg font-semibold">Reward &amp; schedule</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="reward">Reward description</Label>
          <Input
            id="reward"
            value={form.reward}
            onChange={(e) => update("reward", e.target.value)}
            placeholder="e.g. $50 gift card, 1yr free supply"
          />
          <FieldError errors={errors.reward} />
        </div>
        <div>
          <Label htmlFor="rewardValue">Reward value (USD)</Label>
          <Input
            id="rewardValue"
            type="number"
            value={form.rewardValue}
            onChange={(e) => update("rewardValue", Number(e.target.value))}
          />
          <FieldError errors={errors.rewardValue} />
        </div>
        <div>
          <Label htmlFor="winners">Number of winners</Label>
          <Input
            id="winners"
            type="number"
            value={form.numberOfWinners}
            onChange={(e) => update("numberOfWinners", Number(e.target.value))}
          />
          <FieldError errors={errors.numberOfWinners} />
        </div>
        <div>
          <Label htmlFor="start">Start date</Label>
          <Input
            id="start"
            type="datetime-local"
            value={form.startDate}
            onChange={(e) => update("startDate", e.target.value)}
          />
          <FieldError errors={errors.startDate} />
        </div>
        <div>
          <Label htmlFor="end">End date</Label>
          <Input
            id="end"
            type="datetime-local"
            value={form.endDate}
            onChange={(e) => update("endDate", e.target.value)}
          />
          <FieldError errors={errors.endDate} />
        </div>
        <div>
          <Label htmlFor="attempts">Max attempts per player</Label>
          <Input
            id="attempts"
            type="number"
            value={form.maxAttemptsPerPlayer}
            onChange={(e) => update("maxAttemptsPerPlayer", Number(e.target.value))}
          />
          <FieldError errors={errors.maxAttemptsPerPlayer} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="eligibility">Eligibility rules (optional)</Label>
          <Textarea
            id="eligibility"
            value={form.eligibilityRules}
            onChange={(e) => update("eligibilityRules", e.target.value)}
            placeholder="e.g. Open to players 18+. One reward per winner."
            rows={3}
          />
        </div>
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  Step 5 — Review                                                            */
/* -------------------------------------------------------------------------- */

function ReviewStep({
  form,
  errors,
}: {
  form: FormState
  errors: Record<string, string[]>
}) {
  const hasErrors = Object.keys(errors).length > 0
  const rows: [string, string][] = [
    ["Template", humanize(form.templateType)],
    ["Title", form.title || "—"],
    ["Brand", form.brandName || "—"],
    ["Category", humanize(form.category)],
    ["Difficulty", humanize(form.difficulty)],
    ["Reward", form.reward || "—"],
    ["Winners", String(form.numberOfWinners)],
    ["Attempts/player", String(form.maxAttemptsPerPlayer)],
    ["Start", form.startDate.replace("T", " ")],
    ["End", form.endDate.replace("T", " ")],
  ]
  return (
    <Card className="gap-4 p-6">
      <h2 className="text-lg font-semibold">Review &amp; publish</h2>
      {hasErrors ? (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          Some fields need attention. Go back and fix the highlighted steps.
        </div>
      ) : (
        <div className="rounded-lg bg-neon/10 p-3 text-sm text-neon">
          Everything checks out. Publish to go live, or save as a draft.
        </div>
      )}
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-border/40 pb-2">
            <dt className="text-sm text-muted-foreground">{k}</dt>
            <dd className="text-right text-sm font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-muted-foreground">
        {form.description}
      </p>
    </Card>
  )
}
