/**
 * BrandQuest — Current user abstraction (safe, credential-free)
 *
 * Until a real auth provider is connected (see auth.config.ts), we model a
 * lightweight "session" using an httpOnly cookie that stores only the ROLE the
 * visitor selected on the role screen. We deliberately do NOT fabricate logged
 * in profile data: the role tells us which dashboard to show, while real player
 * stats / campaigns come from the database (empty until DynamoDB is connected).
 *
 * TODO(auth): Replace cookie reads with real session reads once a provider is
 * wired in. The rest of the app only depends on the `User` shape returned here,
 * so the swap is isolated to this file.
 */

import { cookies } from "next/headers"
import type { User, UserRole } from "@/lib/db/types"
import { AUTH_COOKIE } from "./auth.config"

const VALID_ROLES: UserRole[] = ["player", "creator", "admin"]

function parseRole(value: string | undefined): UserRole | null {
  if (value && VALID_ROLES.includes(value as UserRole)) {
    return value as UserRole
  }
  return null
}

/**
 * Returns a minimal session user derived from the selected role, or null if the
 * visitor has not chosen a role yet. This is NOT authenticated identity — it is
 * a pre-auth role selection that the UI uses to route between dashboards.
 */
export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies()
  const role = parseRole(store.get(AUTH_COOKIE)?.value)
  if (!role) return null

  // A placeholder identity for the chosen role. Once real auth lands, userId /
  // email / displayName come from the verified session instead.
  return {
    userId: `pending-${role}`,
    email: "",
    displayName:
      role === "player" ? "Player" : role === "creator" ? "Creator" : "Reviewer",
    role,
    createdAt: new Date(0).toISOString(),
  }
}

export async function requireRole(role: UserRole): Promise<User | null> {
  const user = await getCurrentUser()
  if (!user || user.role !== role) return null
  return user
}
