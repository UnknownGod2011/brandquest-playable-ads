import Link from "next/link"
import {
  BarChart3,
  Gamepad2,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SiteHeader } from "@/components/brandquest/SiteHeader"

const marketingLinks = [
  { label: "How it works", href: "#how-players-win" },
  { label: "For brands", href: "#for-brands" },
  { label: "Safety", href: "#safety" },
  { label: "Architecture", href: "/architecture" },
]

export default function MarketingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader links={marketingLinks} />

      <main className="flex-1">
        <Hero />
        <PlayersSection />
        <BrandsSection />
        <WhySection />
        <SafetySection />
        <FinalCta />
      </main>

      <Footer />
    </div>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-arcade-grid opacity-70" aria-hidden="true" />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
        <div className="flex flex-col gap-6">
          <Badge variant="outline" className="w-fit gap-1.5 border-primary/40 text-primary">
            <Sparkles className="size-3" aria-hidden="true" />
            Playable ad campaigns
          </Badge>
          <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            Playable ads. <span className="text-primary">Real rewards.</span>
          </h1>
          <p className="max-w-md text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            BrandQuest turns ads into interactive game campaigns. Brands launch
            challenges with rewards, players compete through skill-based games,
            and every attempt becomes measurable engagement.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button render={<Link href="/role?role=player" />} size="lg">
              <Gamepad2 className="size-4" aria-hidden="true" />
              {"I'm a Player"}
            </Button>
            <Button
              render={<Link href="/role?role=creator" />}
              size="lg"
              variant="outline"
            >
              <Rocket className="size-4" aria-hidden="true" />
              {"I'm a Creator"}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-neon" aria-hidden="true" />
              Server-validated scores
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BarChart3 className="size-3.5 text-accent" aria-hidden="true" />
              Real engagement analytics
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-3xl ring-1 ring-foreground/10 glow-primary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/hero-arcade.png"
              alt="Floating arcade game cards, leaderboards and a glowing trophy"
              className="aspect-square w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight">
        {title}
      </h2>
      <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

function PlayersSection() {
  const steps = [
    {
      icon: Gamepad2,
      title: "Discover campaigns",
      body: "Browse an arcade of branded mini-games filtered by reward, difficulty, and category.",
    },
    {
      icon: Target,
      title: "Play skill-based games",
      body: "Quiz, memory, reaction, and approved custom games — pure skill, limited attempts.",
    },
    {
      icon: Trophy,
      title: "Climb the leaderboard",
      body: "Scores are validated server-side. Top players win the brand's reward.",
    },
  ]
  return (
    <section id="how-players-win" className="mx-auto w-full max-w-6xl px-4 py-16">
      <SectionHeading
        eyebrow="For players"
        title="How players win"
        description="Turn idle scrolling into rewarded play. Compete on skill, build a profile, and claim real prizes."
      />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {steps.map((s) => (
          <Card key={s.title} className="p-6">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <s.icon className="size-5" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-semibold">{s.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}

function BrandsSection() {
  const steps = [
    {
      icon: Rocket,
      title: "Pick a template",
      body: "Choose from 20+ game templates or submit a custom game for review.",
    },
    {
      icon: Sparkles,
      title: "Customize & launch",
      body: "Set rewards, winners, attempt limits, and anti-cheat rules in a guided builder.",
    },
    {
      icon: BarChart3,
      title: "Measure engagement",
      body: "Every view, attempt, and reward claim becomes a measurable analytics event.",
    },
  ]
  return (
    <section id="for-brands" className="border-y border-border/60 bg-card/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        <SectionHeading
          eyebrow="For brands"
          title="How brands launch campaigns"
          description="Replace passive impressions with interactive challenges that capture real intent and attention."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <Card key={s.title} className="p-6">
              <div className="flex size-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <s.icon className="size-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function WhySection() {
  const points = [
    {
      stat: "Active",
      label: "engagement",
      body: "Players choose to play. That intent beats interruptive impressions every time.",
    },
    {
      stat: "Measurable",
      label: "outcomes",
      body: "Attempts, completion rates, and conversion funnels — not just guessed reach.",
    },
    {
      stat: "Rewarded",
      label: "attention",
      body: "Real rewards create real reasons to engage, return, and convert.",
    },
  ]
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16">
      <SectionHeading
        eyebrow="Why playable"
        title="Why playable campaigns outperform passive ads"
        description="Passive ads are skipped. Playable campaigns are chosen, completed, and remembered."
      />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {points.map((p) => (
          <Card key={p.label} className="p-6">
            <div className="text-3xl font-bold text-primary">{p.stat}</div>
            <div className="text-sm font-medium text-muted-foreground">
              {p.label}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {p.body}
            </p>
          </Card>
        ))}
      </div>
    </section>
  )
}

function SafetySection() {
  const items = [
    {
      icon: ShieldCheck,
      title: "Server-side validation",
      body: "Every score is validated on the server before it touches a leaderboard.",
    },
    {
      icon: Zap,
      title: "Anti-cheat engine",
      body: "Impossible scores, impossible durations, and duplicate attempts are flagged or rejected.",
    },
    {
      icon: Users,
      title: "Reviewed custom games",
      body: "Custom games require admin approval and run in a sandboxed iframe — no arbitrary code execution.",
    },
  ]
  return (
    <section id="safety" className="border-y border-border/60 bg-card/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        <SectionHeading
          eyebrow="Safety & fairness"
          title="Safety and anti-cheat by default"
          description="Fair competition is the product. Validation and review are built into every campaign."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {items.map((i) => (
            <Card key={i.title} className="p-6">
              <div className="flex size-11 items-center justify-center rounded-xl bg-neon/15 text-neon">
                <i.icon className="size-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-semibold">{i.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {i.body}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-20">
      <div className="relative overflow-hidden rounded-3xl bg-primary/10 p-10 text-center ring-1 ring-primary/30 md:p-16">
        <div className="absolute inset-0 bg-arcade-grid opacity-50" aria-hidden="true" />
        <div className="relative mx-auto max-w-xl">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
            Ready to turn ads into quests?
          </h2>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
            Pick your path and start in seconds — no credentials required to
            explore.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button render={<Link href="/role?role=player" />} size="lg">
              <Gamepad2 className="size-4" aria-hidden="true" />
              {"I'm a Player"}
            </Button>
            <Button
              render={<Link href="/role?role=creator" />}
              size="lg"
              variant="outline"
            >
              <Rocket className="size-4" aria-hidden="true" />
              {"I'm a Creator"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
        <p>BrandQuest — Playable ads. Real rewards.</p>
        <nav className="flex items-center gap-4">
          <Link href="/architecture" className="hover:text-foreground">
            Architecture
          </Link>
          <Link href="/signin?role=admin" className="hover:text-foreground">
            Admin
          </Link>
          <Link href="/role" className="hover:text-foreground">
            Get started
          </Link>
        </nav>
      </div>
    </footer>
  )
}
