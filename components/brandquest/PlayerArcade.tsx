"use client"

import { useMemo, useState } from "react"
import { Gamepad2, Search } from "lucide-react"
import type { Campaign } from "@/lib/db/types"
import {
  campaignCategories,
  difficulties,
} from "@/lib/validation/campaign"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { humanize } from "@/lib/utils"
import { GameCard } from "./GameCard"
import { EmptyState } from "./EmptyState"

type SortKey = "newest" | "ending_soon" | "most_played" | "highest_reward"

interface PlayerArcadeProps {
  liveCampaigns: Campaign[]
  sampleCampaigns: Campaign[]
}

export function PlayerArcade({
  liveCampaigns,
  sampleCampaigns,
}: PlayerArcadeProps) {
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortKey>("newest")
  const [category, setCategory] = useState<string>("all")
  const [difficulty, setDifficulty] = useState<string>("all")
  const [kind, setKind] = useState<string>("all")
  const [showSamples, setShowSamples] = useState(false)

  const source = showSamples ? sampleCampaigns : liveCampaigns

  const filtered = useMemo(() => {
    let list = [...source]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.brandName.toLowerCase().includes(q),
      )
    }
    if (category !== "all") list = list.filter((c) => c.category === category)
    if (difficulty !== "all")
      list = list.filter((c) => c.difficulty === difficulty)
    if (kind !== "all")
      list = list.filter((c) =>
        kind === "custom" ? c.isCustom : !c.isCustom,
      )

    switch (sort) {
      case "highest_reward":
        list.sort((a, b) => b.rewardValue - a.rewardValue)
        break
      case "ending_soon":
        list.sort(
          (a, b) =>
            new Date(a.endDate).getTime() - new Date(b.endDate).getTime(),
        )
        break
      case "most_played":
        list.sort((a, b) => b.stats.totalAttempts - a.stats.totalAttempts)
        break
      case "newest":
      default:
        list.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
    }
    return list
  }, [source, search, category, difficulty, kind, sort])

  return (
    <section className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns or brands"
            className="h-10 pl-9"
            aria-label="Search campaigns"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Sort"
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            options={[
              { value: "newest", label: "Newest" },
              { value: "ending_soon", label: "Ending soon" },
              { value: "most_played", label: "Most played" },
              { value: "highest_reward", label: "Highest reward" },
            ]}
          />
          <FilterSelect
            label="Category"
            value={category}
            onChange={setCategory}
            options={[
              { value: "all", label: "All categories" },
              ...campaignCategories.map((c) => ({
                value: c,
                label: humanize(c),
              })),
            ]}
          />
          <FilterSelect
            label="Difficulty"
            value={difficulty}
            onChange={setDifficulty}
            options={[
              { value: "all", label: "All difficulties" },
              ...difficulties.map((d) => ({ value: d, label: humanize(d) })),
            ]}
          />
          <FilterSelect
            label="Type"
            value={kind}
            onChange={setKind}
            options={[
              { value: "all", label: "Template & custom" },
              { value: "template", label: "Template" },
              { value: "custom", label: "Custom" },
            ]}
          />

          <div className="ml-auto flex items-center gap-2 rounded-lg bg-card px-3 py-2 ring-1 ring-foreground/10">
            <Switch
              id="samples"
              checked={showSamples}
              onCheckedChange={setShowSamples}
            />
            <Label htmlFor="samples" className="cursor-pointer text-xs">
              Preview sample campaigns
            </Label>
          </div>
        </div>
      </div>

      {/* Grid / empty states */}
      {filtered.length === 0 ? (
        showSamples ? (
          <EmptyState
            icon={Gamepad2}
            title="No samples match your filters"
            description="Try clearing filters to see all sample campaigns."
            action={
              <Button variant="outline" onClick={() => resetFilters()}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Gamepad2}
            title="No live campaigns yet"
            description="There are no live campaigns to play right now. Connect DynamoDB to load real campaigns, or flip on 'Preview sample campaigns' to explore the arcade."
            action={
              <Button onClick={() => setShowSamples(true)}>
                Preview sample campaigns
              </Button>
            }
          />
        )
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <GameCard key={c.campaignId} campaign={c} sample={showSamples} />
          ))}
        </div>
      )}
    </section>
  )

  function resetFilters() {
    setSearch("")
    setCategory("all")
    setDifficulty("all")
    setKind("all")
    setSort("newest")
  }
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "all")}>
      <SelectTrigger className="h-9" aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
