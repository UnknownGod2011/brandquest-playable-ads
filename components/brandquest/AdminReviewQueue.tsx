"use client"

import { useMemo, useState, useTransition } from "react"
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import type {
  CustomGameReviewStatus,
  CustomGameSubmission,
} from "@/lib/db/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SubmissionStatusBadge } from "./SubmissionStatusBadge"
import { EmptyState } from "./EmptyState"
import { reviewSubmission } from "@/lib/admin/actions"
import { formatDate } from "@/lib/utils"

type Filter = CustomGameReviewStatus | "all"

export function AdminReviewQueue({
  submissions,
}: {
  submissions: CustomGameSubmission[]
}) {
  const [filter, setFilter] = useState<Filter>("pending")
  const [active, setActive] = useState<CustomGameSubmission | null>(null)

  const counts = useMemo(
    () =>
      submissions.reduce(
        (acc, s) => {
          acc[s.status] = (acc[s.status] ?? 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    [submissions],
  )

  const filtered =
    filter === "all" ? submissions : submissions.filter((s) => s.status === filter)

  if (submissions.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Review queue is empty"
        description="Custom game submissions from creators will appear here for security review. Connect DynamoDB to load real submissions."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {([
          ["pending", "Pending"],
          ["approved", "Approved"],
          ["rejected", "Rejected"],
          ["all", "All"],
        ] as [Filter, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {label} ({key === "all" ? submissions.length : counts[key] ?? 0})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Nothing here"
          description="No submissions match this filter."
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((s) => (
            <Card key={s.submissionId} className="gap-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{s.gameTitle}</h3>
                    <SubmissionStatusBadge status={s.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    by {s.creatorName} · submitted {formatDate(s.submittedAt)}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setActive(s)}>
                  Review
                </Button>
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {s.instructions}
              </p>
            </Card>
          ))}
        </div>
      )}

      <ReviewDialog
        submission={active}
        onClose={() => setActive(null)}
      />
    </div>
  )
}

function ReviewDialog({
  submission,
  onClose,
}: {
  submission: CustomGameSubmission | null
  onClose: () => void
}) {
  const [note, setNote] = useState("")
  const [isPending, startTransition] = useTransition()

  function act(action: "approved" | "rejected" | "comment") {
    if (!submission) return
    startTransition(async () => {
      const res = await reviewSubmission({
        submissionId: submission.submissionId,
        action,
        note,
      })
      if (!res.ok) {
        toast.error(res.message)
        return
      }
      if (res.persisted) toast.success(res.message)
      else toast.message("Recorded", { description: res.message })
      setNote("")
      onClose()
    })
  }

  return (
    <Dialog open={Boolean(submission)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {submission ? (
          <>
            <DialogHeader>
              <DialogTitle>{submission.gameTitle}</DialogTitle>
              <DialogDescription>
                Submitted by {submission.creatorName} · {formatDate(submission.submittedAt)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-sm">
              <Detail label="Instructions">{submission.instructions}</Detail>
              <div className="grid grid-cols-2 gap-3">
                <Detail label="Scoring">{submission.scoringMethod}</Detail>
                <Detail label="Runtime">
                  {submission.desiredGameStyle ?? "Brand Rush Runner"}
                </Detail>
                <Detail label="Time limit">{submission.timeLimitSeconds}s</Detail>
                <Detail label="Expected score">
                  {submission.expectedScoreMin}–{submission.expectedScoreMax}
                </Detail>
                <Detail label="Max possible">{submission.maxPossibleScore}</Detail>
                <Detail label="Reward">{submission.reward}</Detail>
              </div>

              {submission.externalDemoUrl ? (
                <a
                  href={submission.externalDemoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-accent underline-offset-4 hover:underline"
                >
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                  Open demo
                </a>
              ) : null}

              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
                  <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
                  Security notes from creator
                </p>
                <p className="text-xs text-muted-foreground">
                  {submission.securityNotes}
                </p>
              </div>

              {submission.reviewNotes.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Review history
                  </p>
                  {submission.reviewNotes.map((n) => (
                    <p key={n.noteId} className="text-xs text-muted-foreground">
                      <span className="font-medium capitalize text-foreground">
                        {n.reviewerName} · {n.action}:
                      </span>{" "}
                      {n.note}
                    </p>
                  ))}
                </div>
              ) : null}

              <div>
                <Label htmlFor="note">Decision note</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Required when approving or rejecting."
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => act("comment")}
              >
                <MessageSquare className="size-4" aria-hidden="true" />
                Comment
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => act("rejected")}
              >
                <XCircle className="size-4" aria-hidden="true" />
                Reject
              </Button>
              <Button size="sm" disabled={isPending} onClick={() => act("approved")}>
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Approve
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function Detail({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="capitalize-first text-sm">{children}</p>
    </div>
  )
}
