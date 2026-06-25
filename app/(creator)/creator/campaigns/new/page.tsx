import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { CampaignBuilder } from "@/components/brandquest/CampaignBuilder"

export const metadata: Metadata = {
  title: "New campaign — BrandQuest",
}

export default function NewCampaignPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/creator"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to dashboard
      </Link>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Create a campaign</h1>
        <p className="text-sm text-muted-foreground">
          Build a playable ad in five steps. Everything is validated as you go.
        </p>
      </header>
      <CampaignBuilder />
    </div>
  )
}
