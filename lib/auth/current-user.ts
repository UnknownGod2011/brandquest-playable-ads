import { cookies } from "next/headers"
import { createHash } from "node:crypto"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import type { User, UserRole } from "@/lib/db/types"
import { AUTH_COOKIE } from "./auth.config"

const VALID_ROLES: UserRole[] = ["player", "creator", "admin"]

function parseRole(value: string | undefined): UserRole | null {
  if (value && VALID_ROLES.includes(value as UserRole)) return value as UserRole
  return null
}

function stableUserId(email: string): string {
  return `user_${createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 24)}`
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await auth()
  const email = session?.user?.email
  const store = await cookies()
  const role = parseRole(store.get(AUTH_COOKIE)?.value)

  if (email) {
    const user = await db.getUserByEmail(email)
    if (user) return user
    if (db.isPersistent && role && role !== "admin") {
      return db.upsertUser({
        userId: stableUserId(email),
        email,
        displayName: session.user?.name ?? email,
        avatarUrl: session.user?.image ?? undefined,
        requestedRole: role,
      })
    }
    if (db.isPersistent) return null
  }

  if (!role || db.isPersistent) return null

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
