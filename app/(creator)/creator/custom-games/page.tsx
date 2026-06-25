import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Sparkles } from "lucide-react"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/current-user"
import { Card } from "@/components/ui/card"
import { CustomGameForm } from "@/components/brandquest/CustomGameForm"
import { SubmissionStatusBadge } from "@/components/brandquest/SubmissionStatusBadge"
import { EmptyState } from "@/components/brandquest/EmptyState"
import { formatDate } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Custom games — BrandQuest",
}

export default async function CustomGamesPage() {
  const user = await getCurrentUser()
  const all = await db.listCustomSubmissions()
  const mine = user ? all.filter((s) => s.creatorId === user.userId) : []

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/creator"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to dashboard
        </Link>
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Custom games</h1>
          <p className="text-sm text-muted-foreground">
            Submit a bespoke branded game for security review. Approved games can
            power a campaign.
          </p>
        </header>
      </div>

      <section className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="order-2 lg:order-1">
          <CustomGameForm />
        </div>

        <aside className="order-1 lg:order-2">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Your submissions
          </h2>
          {mine.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No submissions yet"
              description="Submitted custom games and their review status will appear here."
            />
          ) : (
            <div className="space-y-3">
              {mine.map((s) => (
                <Card key={s.submissionId} className="gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{s.gameTitle}</span>
                    <SubmissionStatusBadge status={s.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Submitted {formatDate(s.submittedAt)}
                  </p>
                  {s.reviewNotes.length > 0 ? (
                    <div className="mt-1 space-y-1 border-t border-border/40 pt-2">
                      {s.reviewNotes.map((n) => (
                        <p key={n.noteId} className="text-xs text-muted-foreground">
                          <span className="font-medium capitalize text-foreground">
                            {n.action}:
                          </span>{" "}
                          {n.note}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </Card>
              ))}
            </div>
          )}
        </aside>
      </section>
    </div>
  )
}
