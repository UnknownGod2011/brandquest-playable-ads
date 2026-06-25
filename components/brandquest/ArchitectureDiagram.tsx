import {
  Activity,
  ArrowDown,
  Database,
  Globe,
  Lock,
  Server,
  ShieldCheck,
  Trophy,
  Wallet,
} from "lucide-react"
import { Card } from "@/components/ui/card"

interface Layer {
  icon: typeof Globe
  title: string
  body: string
  accent: string
}

const layers: Layer[] = [
  {
    icon: Globe,
    title: "Vercel Frontend (Next.js App Router)",
    body: "Server components render dashboards, the arcade, and the campaign builder. Edge-cached marketing pages.",
    accent: "text-primary bg-primary/15",
  },
  {
    icon: Server,
    title: "Next.js Server Routes & Actions",
    body: "All mutations flow through server code: campaigns, attempts, leaderboards, analytics, custom-game review.",
    accent: "text-accent bg-accent/15",
  },
  {
    icon: Lock,
    title: "Auth Layer",
    body: "Role-aware sessions (Player / Creator / Admin), prepared for Google + email sign-in. Secrets stay server-side.",
    accent: "text-neon bg-neon/15",
  },
  {
    icon: ShieldCheck,
    title: "Score Validation & Anti-cheat",
    body: "Rejects impossible scores, expired campaigns, over-limit and duplicate attempts; flags suspicious play.",
    accent: "text-neon bg-neon/15",
  },
  {
    icon: Activity,
    title: "Analytics Event Capture",
    body: "Each interaction emits a typed event (viewed, started, submitted, validated, claimed) for creator analytics.",
    accent: "text-accent bg-accent/15",
  },
  {
    icon: Trophy,
    title: "Leaderboard Query Pattern",
    body: "Attempts stored with zero-padded scores in the sort key — leaderboards read back pre-sorted.",
    accent: "text-reward bg-reward/15",
  },
  {
    icon: Wallet,
    title: "Reward Claim Workflow",
    body: "Eligible winners claim rewards; claims are stored and surfaced in creator analytics.",
    accent: "text-reward bg-reward/15",
  },
  {
    icon: Database,
    title: "Amazon DynamoDB",
    body: "Single-table design for campaigns, attempts, leaderboards, reward claims, analytics, and player progression.",
    accent: "text-primary bg-primary/15",
  },
]

export function ArchitectureDiagram() {
  return (
    <div className="flex flex-col items-stretch gap-2">
      {layers.map((layer, i) => (
        <div key={layer.title} className="flex flex-col items-center gap-2">
          <Card className="w-full p-5">
            <div className="flex items-start gap-4">
              <div
                className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${layer.accent}`}
              >
                <layer.icon className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold">{layer.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {layer.body}
                </p>
              </div>
            </div>
          </Card>
          {i < layers.length - 1 ? (
            <ArrowDown
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          ) : null}
        </div>
      ))}
    </div>
  )
}
