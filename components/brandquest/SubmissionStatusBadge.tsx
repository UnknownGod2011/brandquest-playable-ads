import { CheckCircle2, Clock, XCircle } from "lucide-react"
import type { CustomGameReviewStatus } from "@/lib/db/types"
import { Badge } from "@/components/ui/badge"

const meta: Record<
  CustomGameReviewStatus,
  { label: string; icon: typeof Clock; variant: "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "pending_review", icon: Clock, variant: "outline" },
  approved: { label: "Approved", icon: CheckCircle2, variant: "secondary" },
  rejected: { label: "Rejected", icon: XCircle, variant: "destructive" },
}

export function SubmissionStatusBadge({
  status,
}: {
  status: CustomGameReviewStatus
}) {
  const m = meta[status]
  const Icon = m.icon
  return (
    <Badge variant={m.variant} className="gap-1">
      <Icon className="size-3" aria-hidden="true" />
      {m.label}
    </Badge>
  )
}
