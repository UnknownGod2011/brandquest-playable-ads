import type { Metadata } from "next"
import { ShieldCheck } from "lucide-react"
import { db } from "@/lib/db"
import { StatGrid } from "@/components/brandquest/StatGrid"
import { AdminReviewQueue } from "@/components/brandquest/AdminReviewQueue"
import { formatNumber } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Review queue — BrandQuest",
}

export default async function AdminReviewPage() {
  const submissions = await db.listCustomSubmissions()

  const counts = submissions.reduce(
    (acc, s) => {
      acc[s.status] = (acc[s.status] ?? 0) + 1
      return acc
    },
    { pending: 0, approved: 0, rejected: 0 } as Record<string, number>,
  )

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <ShieldCheck className="size-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Custom game review
          </h1>
          <p className="text-sm text-muted-foreground">
            Approve or reject creator-submitted games. Security is reviewed
            before anything can go live.
          </p>
        </div>
      </header>

      <StatGrid
        columns={3}
        stats={[
          { label: "Pending", value: formatNumber(counts.pending), accent: "accent" },
          { label: "Approved", value: formatNumber(counts.approved), accent: "neon" },
          { label: "Rejected", value: formatNumber(counts.rejected), accent: "destructive" },
        ]}
      />

      <AdminReviewQueue submissions={submissions} />
    </div>
  )
}
