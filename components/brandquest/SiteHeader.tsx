import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "./Logo"

interface NavLink {
  label: string
  href: string
}

interface SiteHeaderProps {
  /** Optional contextual nav links (e.g. dashboard sections). */
  links?: NavLink[]
  /** Right-aligned call to action. Defaults to the role chooser. */
  cta?: { label: string; href: string }
}

export function SiteHeader({
  links,
  cta = { label: "Get started", href: "/role" },
}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />

        {links && links.length > 0 ? (
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
        ) : null}

        <div className="flex items-center gap-2">
          <Button
            render={<Link href={cta.href} />}
            size="sm"
          >
            {cta.label}
          </Button>
        </div>
      </div>
    </header>
  )
}
