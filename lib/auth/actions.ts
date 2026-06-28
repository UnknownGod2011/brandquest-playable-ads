"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { signIn as authSignIn, signOut as authSignOut } from "@/auth"
import type { UserRole } from "@/lib/db/types"
import { AUTH_COOKIE } from "./auth.config"

const VALID_ROLES: UserRole[] = ["player", "creator", "admin"]
const ONE_WEEK = 60 * 60 * 24 * 7

function parseRole(value: FormDataEntryValue | null): UserRole {
  const role = String(value ?? "player")
  return VALID_ROLES.includes(role as UserRole) ? (role as UserRole) : "player"
}

async function setRoleCookie(role: UserRole) {
  const store = await cookies()
  store.set(AUTH_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_WEEK,
    path: "/",
  })
}

export async function chooseRole(formData: FormData): Promise<void> {
  const role = parseRole(formData.get("role"))
  await setRoleCookie(role)
  redirect(`/signin?role=${role}`)
}

export async function startGoogleSignIn(formData: FormData): Promise<void> {
  const role = parseRole(formData.get("role"))
  await setRoleCookie(role)
  await authSignIn("google", { redirectTo: "/auth/complete" })
}

export async function startAdminSignIn(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")
  await setRoleCookie("admin")
  await authSignIn("credentials", {
    email,
    password,
    redirectTo: "/auth/complete",
  })
}

export async function signOut(): Promise<void> {
  const store = await cookies()
  store.delete(AUTH_COOKIE)
  await authSignOut({ redirectTo: "/" })
}
