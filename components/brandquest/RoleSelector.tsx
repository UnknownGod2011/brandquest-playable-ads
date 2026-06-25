"use client"

import { useState } from "react"
import { Check, Gamepad2, Rocket, ShieldCheck } from "lucide-react"
import type { UserRole } from "@/lib/db/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { chooseRole } from "@/lib/auth/actions"

interface RoleOption {
  role: UserRole
  title: string
  description: string
  icon: typeof Gamepad2
  perks: string[]
}

const OPTIONS: RoleOption[] = [
  {
    role: "player",
    title: "I'm a Player",
    description: "Compete in branded mini-games and win real rewards.",
    icon: Gamepad2,
    perks: ["Play skill-based games", "Climb leaderboards", "Earn XP, levels & badges"],
  },
  {
    role: "creator",
    title: "I'm a Creator",
    description: "Launch playable ad campaigns and measure engagement.",
    icon: Rocket,
    perks: ["Build campaigns from templates", "Submit custom games", "Track real analytics"],
  },
]

export function RoleSelector({ initialRole }: { initialRole?: UserRole }) {
  const [selected, setSelected] = useState<UserRole | null>(initialRole ?? null)

  return (
    <form action={chooseRole} className="flex flex-col gap-6">
      <input type="hidden" name="role" value={selected ?? ""} />

      <div className="grid gap-4 sm:grid-cols-2">
        {OPTIONS.map((opt) => {
          const isActive = selected === opt.role
          return (
            <button
              type="button"
              key={opt.role}
              onClick={() => setSelected(opt.role)}
              aria-pressed={isActive}
              className={cn(
                "group relative flex flex-col gap-4 rounded-2xl bg-card p-6 text-left ring-1 transition-all",
                isActive
                  ? "ring-2 ring-primary glow-primary"
                  : "ring-foreground/10 hover:ring-primary/40",
              )}
            >
              {isActive ? (
                <span className="absolute right-4 top-4 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-4" aria-hidden="true" />
                </span>
              ) : null}
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <opt.icon className="size-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{opt.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {opt.description}
                </p>
              </div>
              <ul className="mt-1 space-y-1.5">
                {opt.perks.map((perk) => (
                  <li
                    key={perk}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Check className="size-3.5 text-neon" aria-hidden="true" />
                    {perk}
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>

      <Button type="submit" size="lg" disabled={!selected} className="w-full sm:w-auto sm:self-center">
        Continue
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5" aria-hidden="true" />
        You can switch roles anytime. No credentials required to explore.
      </p>
    </form>
  )
}
