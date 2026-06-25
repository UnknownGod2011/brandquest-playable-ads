import Link from "next/link"
import { Gamepad2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2 font-bold", className)}
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground glow-primary">
        <Gamepad2 className="size-5" aria-hidden="true" />
      </span>
      <span className="text-lg tracking-tight">
        Brand<span className="text-primary">Quest</span>
      </span>
    </Link>
  )
}
