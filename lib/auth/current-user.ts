import { cookies } from "next/headers"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import type { User, UserRole } from "@/lib/db/types"
import { AUTH_COOKIE } from "./auth.config"

const VALID_ROLES: UserRole[] = ["player", "creator", "admin"]

function parseRole(value: string | undefined): UserRole | null {
  if (value && VALID_ROLES.includes(value as UserRole)) return value as UserRole
  return null
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await auth()
  const email = session?.user?.email
  if (email) {
    const user = await db.getUserByEmail(email)
    if (user) return user
    if (db.isPersistent) return null
  }

  const store = await cookies()
  const role = parseRole(store.get(AUTH_COOKIE)?.value)
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
