import type { Metadata } from "next"
import { CircleDollarSign, Database, ShieldAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { SiteHeader } from "@/components/brandquest/SiteHeader"
import { ArchitectureDiagram } from "@/components/brandquest/ArchitectureDiagram"

export const metadata: Metadata = {
  title: "Architecture — BrandQuest",
  description:
    "How BrandQuest is built on Vercel and Amazon DynamoDB, with server-side score validation, analytics event capture, and a cost safety layer.",
}

export default function ArchitecturePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <Badge variant="outline" className="border-primary/40 text-primary">
          System architecture
        </Badge>
        <h1 className="mt-3 text-balance text-4xl font-bold tracking-tight">
          BrandQuest architecture
        </h1>
        <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
          A serverless, event-sourced platform designed to scale from a single
          campaign to millions of game attempts without expensive always-on
          infrastructure.
        </p>

        <Card className="my-8 border-l-4 border-l-primary p-5">
          <div className="flex gap-3">
            <Database className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-pretty text-sm leading-relaxed">
              Amazon DynamoDB is used for high-volume game attempts, leaderboard
              events, reward claims, campaign analytics, and player progression.
            </p>
          </div>
        </Card>

        <ArchitectureDiagram />

        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight">Cost safety layer</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            BrandQuest deliberately uses only serverless, pay-per-use building
            blocks to keep AWS costs predictable.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Card className="p-5">
              <CircleDollarSign className="size-5 text-neon" aria-hidden="true" />
              <h3 className="mt-3 font-semibold">DynamoDB only</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                No EC2, RDS, Aurora, NAT Gateway, Load Balancer, SageMaker,
                Bedrock, or OpenSearch. One pay-per-request table.
              </p>
            </Card>
            <Card className="p-5">
              <ShieldAlert className="size-5 text-reward" aria-hidden="true" />
              <h3 className="mt-3 font-semibold">Budgets are alerts</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                AWS Budgets notify — they do not hard-cap spend. Resources are
                created manually and kept minimal. See AWS_SETUP_LATER.md.
              </p>
            </Card>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight">Custom game review workflow</h2>
          <ol className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">1. Submit:</span>{" "}
              Creators submit custom game metadata (never executable code).
            </li>
            <li>
              <span className="font-medium text-foreground">2. Review:</span>{" "}
              Admins review against a security checklist and approve or reject.
            </li>
            <li>
              <span className="font-medium text-foreground">3. Sandbox:</span>{" "}
              Approved games run in a restricted sandboxed iframe.
            </li>
            <li>
              <span className="font-medium text-foreground">4. Score:</span>{" "}
              Scores are reported through the secure, validated score API.
            </li>
          </ol>
        </section>
      </main>
    </div>
  )
}
