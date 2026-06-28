import { createHash } from "node:crypto"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { AUTH_COOKIE } from "@/lib/auth/auth.config"
import type { UserRole } from "@/lib/db/types"
import { track } from "@/lib/analytics/events"

const VALID_ROLES: UserRole[] = ["player", "creator", "admin"]

function parseRole(value: string | undefined): UserRole {
  return VALID_ROLES.includes(value as UserRole) ? (value as UserRole) : "player"
}

function stableUserId(email: string): string {
  return `user_${createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 24)}`
}

function dashboardFor(role: UserRole): string {
  if (role === "creator") return "/creator"
  if (role === "admin") return "/admin/review"
  return "/player"
}

export default async function AuthCompletePage() {
  const session = await auth()
  const email = session?.user?.email
  if (!email) redirect("/signin")

  const store = await cookies()
  const requestedRole = parseRole(store.get(AUTH_COOKIE)?.value)
  const user = await db.upsertUser({
    userId: stableUserId(email),
    email,
    displayName: session.user?.name ?? email,
    avatarUrl: session.user?.image ?? undefined,
    requestedRole,
  })

  await track({
    type: "player_registered",
    playerId: user.role === "player" ? user.userId : undefined,
    creatorId: user.role === "creator" ? user.userId : undefined,
    metadata: { role: user.role },
  })

  redirect(dashboardFor(user.role))
}
