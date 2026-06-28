"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, Sparkles, Upload } from "lucide-react"
import { toast } from "sonner"
import type {
  CampaignCategory,
  LeaderboardMetric,
  ScoringType,
  SortDirection,
} from "@/lib/db/types"
import { campaignCategories } from "@/lib/validation/campaign"
import { customGameSubmissionSchema } from "@/lib/validation/custom-game"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ThumbnailUploader } from "@/components/brandquest/ThumbnailUploader"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { submitCustomGame } from "@/lib/campaigns/actions"

const scoringMethods: ScoringType[] = ["points", "time", "accuracy", "combo"]
const leaderboardMetrics: LeaderboardMetric[] = [
  "score",
  "accuracy",
  "completionTime",
  "combo",
  "submittedAt",
]

interface FormState {
  gameTitle: string
  brandName: string
  description: string
  category: CampaignCategory
  thumbnailUrl: string
  instructions: string
  expectedScoreMin: number
  expectedScoreMax: number
  scoringMethod: ScoringType
  maxPossibleScore: number
  timeLimitSeconds: number
  reward: string
  rewardValue: number
  externalDemoUrl: string
  securityNotes: string
  desiredGameStyle: string
  primaryMetric: LeaderboardMetric
  sortDirection: SortDirection
  tieBreakers: LeaderboardMetric[]
}

const initial: FormState = {
  gameTitle: "",
  brandName: "",
  description: "",
  category: "tech",
  thumbnailUrl: "",
  instructions: "",
  expectedScoreMin: 0,
  expectedScoreMax: 1000,
  scoringMethod: "points",
  maxPossibleScore: 1000,
  timeLimitSeconds: 60,
  reward: "",
  rewardValue: 0,
  externalDemoUrl: "",
  securityNotes: "",
  desiredGameStyle: "Beat Tiles",
  primaryMetric: "score",
  sortDirection: "desc",
  tieBreakers: ["accuracy", "combo", "submittedAt"],
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null
  return <p className="mt-1 text-xs text-destructive">{errors[0]}</p>
}

export function CustomGameForm() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(initial)
  const [jsonText, setJsonText] = useState("")
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isPending, startTransition] = useTransition()

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function applyImportedMetadata(data: Record<string, unknown>) {
    const nextForm: FormState = {
      ...form,
      gameTitle: textValue(data.gameTitle ?? data.title, form.gameTitle),
      brandName: textValue(data.brandName, form.brandName),
      description: textValue(
        data.previewText ?? data.description,
        form.description,
      ),
      category: categoryValue(data.category, form.category),
      thumbnailUrl: textValue(data.thumbnailUrl, form.thumbnailUrl),
      instructions: textValue(
        data.instructions ?? data.gameBrief,
        form.instructions,
      ),
      scoringMethod: scoringValue(data.scoringMethod, form.scoringMethod),
      expectedScoreMin: numberValue(data.expectedScoreMin, form.expectedScoreMin),
      expectedScoreMax: numberValue(data.expectedScoreMax, form.expectedScoreMax),
      maxPossibleScore: numberValue(data.maxPossibleScore, form.maxPossibleScore),
      timeLimitSeconds: numberValue(data.timeLimitSeconds, form.timeLimitSeconds),
      reward: textValue(data.reward ?? data.incentive ?? data.prize, form.reward),
      rewardValue: numberValue(data.rewardValue ?? data.incentiveValue, form.rewardValue),
      externalDemoUrl: textValue(data.externalDemoUrl, form.externalDemoUrl),
      securityNotes: textValue(
        data.securityNotes,
        form.securityNotes || "Metadata-only submission. No uploaded JavaScript or executable code is included.",
      ),
      desiredGameStyle: textValue(data.desiredGameStyle, form.desiredGameStyle),
      primaryMetric: metricValue(data.primaryMetric, form.primaryMetric),
      sortDirection: sortDirectionValue(data.sortDirection, form.sortDirection),
      tieBreakers: metricArrayValue(data.tieBreakers, form.tieBreakers),
    }
    const parsed = customGameSubmissionSchema.safeParse(nextForm)
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>)
      toast.error("Metadata was parsed, but some fields need review.")
      return
    }
    setErrors({})
    setForm(nextForm)
    toast.success("Metadata imported. Review the fields before submitting.")
  }

  function importJsonText(text: string) {
    try {
      const parsed = JSON.parse(text) as unknown
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        toast.error("Paste a JSON object with custom game metadata.")
        return
      }
      applyImportedMetadata(parsed as Record<string, unknown>)
    } catch {
      toast.error("That JSON could not be parsed.")
    }
  }

  async function importJsonFile(file: File | undefined) {
    if (!file) return
    if (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json") {
      toast.error("Upload a .json metadata file.")
      return
    }
    if (file.size > 100 * 1024) {
      toast.error("JSON metadata file must be under 100 KB.")
      return
    }
    importJsonText(await file.text())
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

      <div className="grid gap-2 rounded-xl bg-secondary/40 p-4">
        <Label htmlFor="metadataJson">Import metadata JSON</Label>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id="metadataFile"
            type="file"
            accept="application/json,.json"
            className="max-w-sm"
            onChange={(event) => {
              void importJsonFile(event.target.files?.[0])
              event.currentTarget.value = ""
            }}
          />
          <span className="text-xs text-muted-foreground">
            Upload `spotify-beat-tiles-custom-game.json` or paste it below.
          </span>
        </div>
        <Textarea
          id="metadataJson"
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={4}
          placeholder="Paste metadata-only JSON. Scripts are never executed."
        />
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => importJsonText(jsonText)}>
            <Upload className="size-4" aria-hidden="true" />
            Import JSON
          </Button>
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
        <div>
          <Label htmlFor="brandName">Brand name</Label>
          <Input
            id="brandName"
            value={form.brandName}
            onChange={(e) => update("brandName", e.target.value)}
            placeholder="Your brand"
          />
          <FieldError errors={errors.brandName} />
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
              {campaignCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={errors.category} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            placeholder="Describe the branded experience and reward context."
          />
          <FieldError errors={errors.description} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="thumbnail">Thumbnail URL or placeholder</Label>
          <Input
            id="thumbnail"
            value={form.thumbnailUrl}
            onChange={(e) => update("thumbnailUrl", e.target.value)}
            placeholder="https://example.com/thumbnail.png"
          />
          <FieldError errors={errors.thumbnailUrl} />
        </div>
        <div className="sm:col-span-2">
          <ThumbnailUploader
            id="customThumbnailUpload"
            value={form.thumbnailUrl}
            onChange={(value) => update("thumbnailUrl", value)}
          />
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
          <Label htmlFor="style">Desired game style</Label>
          <Input
            id="style"
            value={form.desiredGameStyle}
            onChange={(e) => update("desiredGameStyle", e.target.value)}
            placeholder="Beat Tiles"
          />
          <FieldError errors={errors.desiredGameStyle} />
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
          <Label>Primary leaderboard metric</Label>
          <Select
            value={form.primaryMetric}
            onValueChange={(v) =>
              update("primaryMetric", (v ?? "score") as LeaderboardMetric)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {leaderboardMetrics.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Sort direction</Label>
          <Select
            value={form.sortDirection}
            onValueChange={(v) =>
              update("sortDirection", (v ?? "desc") as SortDirection)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">High to low</SelectItem>
              <SelectItem value="asc">Low to high</SelectItem>
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
        <div>
          <Label htmlFor="rewardValue">Reward value</Label>
          <Input
            id="rewardValue"
            type="number"
            value={form.rewardValue}
            onChange={(e) => update("rewardValue", Number(e.target.value))}
          />
          <FieldError errors={errors.rewardValue} />
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

function textValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.slice(0, 800) : fallback
}

function numberValue(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function categoryValue(value: unknown, fallback: CampaignCategory): CampaignCategory {
  return typeof value === "string" &&
    campaignCategories.includes(value as CampaignCategory)
    ? (value as CampaignCategory)
    : fallback
}

function scoringValue(value: unknown, fallback: ScoringType): ScoringType {
  if (value === "accuracy_combo") return "combo"
  return typeof value === "string" && scoringMethods.includes(value as ScoringType)
    ? (value as ScoringType)
    : fallback
}

function metricValue(value: unknown, fallback: LeaderboardMetric): LeaderboardMetric {
  if (value === "maxCombo") return "combo"
  if (value === "durationMs") return "completionTime"
  return typeof value === "string" && leaderboardMetrics.includes(value as LeaderboardMetric)
    ? (value as LeaderboardMetric)
    : fallback
}

function sortDirectionValue(value: unknown, fallback: SortDirection): SortDirection {
  return value === "asc" || value === "desc" ? value : fallback
}

function metricArrayValue(
  value: unknown,
  fallback: LeaderboardMetric[],
): LeaderboardMetric[] {
  if (!Array.isArray(value)) return fallback
  const metrics = value
    .map((item) => metricValue(item, "score"))
    .filter((metric, index, list) => list.indexOf(metric) === index)
    .slice(0, 4)
  return metrics.length ? metrics : fallback
}
