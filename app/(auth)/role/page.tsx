import type { Metadata } from "next"
import type { UserRole } from "@/lib/db/types"
import { Logo } from "@/components/brandquest/Logo"
import { RoleSelector } from "@/components/brandquest/RoleSelector"

export const metadata: Metadata = {
  title: "Choose your role — BrandQuest",
}

const VALID: UserRole[] = ["player", "creator"]

export default async function RolePage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const { role } = await searchParams
  const initialRole = VALID.includes(role as UserRole)
    ? (role as UserRole)
    : undefined

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-arcade-grid opacity-50" aria-hidden="true" />
      <div className="relative w-full max-w-2xl">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Logo />
          <div>
            <h1 className="text-balance text-3xl font-bold tracking-tight">
              How do you want to play?
            </h1>
            <p className="mt-2 text-pretty text-muted-foreground">
              Choose a path to get started. This decides which dashboard you land
              on.
            </p>
          </div>
        </div>
        <RoleSelector initialRole={initialRole} />
      </div>
    </main>
  )
}
