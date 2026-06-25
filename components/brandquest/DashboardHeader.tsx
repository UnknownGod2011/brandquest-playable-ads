import Link from "next/link"
import { LogOut } from "lucide-react"
import type { UserRole } from "@/lib/db/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Logo } from "./Logo"
import { signOut } from "@/lib/auth/actions"

interface NavLink {
  label: string
  href: string
}

const ROLE_LINKS: Record<UserRole, NavLink[]> = {
  player: [
    { label: "Arcade", href: "/player" },
    { label: "Profile", href: "/player/profile" },
  ],
  creator: [
    { label: "Campaigns", href: "/creator" },
    { label: "New campaign", href: "/creator/campaigns/new" },
  ],
  admin: [{ label: "Review queue", href: "/admin/review" }],
}

export function DashboardHeader({ role }: { role: UserRole }) {
  const links = ROLE_LINKS[role]
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-3">
          <Logo />
          <Badge variant="secondary" className="capitalize">
            {role}
          </Badge>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Button
              key={link.href}
              render={<Link href={link.href} />}
              variant="ghost"
              size="sm"
            >
              {link.label}
            </Button>
          ))}
        </nav>

        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </form>
      </div>
    </header>
  )
}
