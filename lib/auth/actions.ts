"use server"

/**
 * BrandQuest — Auth server actions (credential-free, safe defaults)
 *
 * These actions manage the role-selection "session" via an httpOnly cookie.
 * They are intentionally provider-agnostic so the real Google/email flow can be
 * dropped in later (see auth.config.ts) without touching the UI.
 *
 * SECURITY: The cookie only stores the selected role. No secrets, no tokens,
 * nothing that grants privileged access. Real authentication must verify
 * identity server-side before trusting any role.
 */

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { UserRole } from "@/lib/db/types"
import { AUTH_COOKIE } from "./auth.config"
import { track } from "@/lib/analytics/events"

const VALID_ROLES: UserRole[] = ["player", "creator", "admin"]
const ONE_WEEK = 60 * 60 * 24 * 7

function dashboardFor(role: UserRole): string {
  switch (role) {
    case "player":
      return "/player"
    case "creator":
      return "/creator"
    case "admin":
      return "/admin/review"
  }
}

/** Persists the chosen role and continues to sign-in. */
export async function chooseRole(formData: FormData): Promise<void> {
  const role = String(formData.get("role") ?? "")
  if (!VALID_ROLES.includes(role as UserRole)) {
    redirect("/role")
  }
  const store = await cookies()
  store.set(AUTH_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_WEEK,
    path: "/",
  })
  redirect(`/signin?role=${role}`)
}

/**
 * Finalizes the (prepared) sign-in. With no auth provider configured this just
 * confirms the role session and routes to the matching dashboard. When a real
 * provider is wired in, replace this with the provider callback handling.
 */
export async function completeSignIn(formData: FormData): Promise<void> {
  const role = String(formData.get("role") ?? "player") as UserRole
  const safeRole = VALID_ROLES.includes(role) ? role : "player"
  const store = await cookies()
  store.set(AUTH_COOKIE, safeRole, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_WEEK,
    path: "/",
  })
  await track({ type: "player_registered", metadata: { role: safeRole } })
  redirect(dashboardFor(safeRole))
}

/** Clears the role session. */
export async function signOut(): Promise<void> {
  const store = await cookies()
  store.delete(AUTH_COOKIE)
  redirect("/")
}
