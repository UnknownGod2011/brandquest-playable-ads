import { createHash } from "node:crypto"
import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { AUTH_COOKIE } from "@/lib/auth/auth.config"
import type { UserRole } from "@/lib/db/types"
import { track } from "@/lib/analytics/events"

const VALID_ROLES: UserRole[] = ["player", "creator", "admin"]
const ONE_WEEK = 60 * 60 * 24 * 7

function parseRole(value: string | undefined): UserRole | null {
  return VALID_ROLES.includes(value as UserRole) ? (value as UserRole) : null
}

function stableUserId(email: string): string {
  return `user_${createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 24)}`
}

function dashboardFor(role: UserRole): string {
  if (role === "creator") return "/creator"
  if (role === "admin") return "/admin/review"
  return "/player"
}

export async function GET(req: NextRequest) {
  const session = await auth()
  const email = session?.user?.email
  const cookieRole = parseRole(req.cookies.get(AUTH_COOKIE)?.value)
  const requestedRole =
    parseRole(req.nextUrl.searchParams.get("role") ?? undefined) ??
    cookieRole ??
    "player"

  if (!email) {
    const url = new URL("/signin", req.url)
    url.searchParams.set("role", requestedRole)
    url.searchParams.set(
      "error",
      req.nextUrl.searchParams.get("error") ?? "OAuthCancelled",
    )
    return NextResponse.redirect(url)
  }

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

  const res = NextResponse.redirect(new URL(dashboardFor(user.role), req.url))
  res.cookies.set(AUTH_COOKIE, user.role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_WEEK,
    path: "/",
  })
  return res
}
