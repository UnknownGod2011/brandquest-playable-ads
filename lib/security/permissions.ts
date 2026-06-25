/**
 * BrandQuest — Permission checks (placeholder)
 *
 * Centralizes role-based authorization. Today these run against the current
 * user from lib/auth/current-user.ts. When real auth is wired in, the same
 * functions keep working because they only depend on the User shape.
 *
 * TODO(production): Enforce these on EVERY mutating server action / API route.
 * Never rely on the client hiding a button as a security boundary.
 */

import type { User, UserRole, Campaign } from "@/lib/db/types"

export function hasRole(user: User | null, role: UserRole): boolean {
  return user?.role === role
}

export function isAdmin(user: User | null): boolean {
  return user?.role === "admin"
}

export function canCreateCampaign(user: User | null): boolean {
  return user?.role === "creator"
}

export function canEditCampaign(user: User | null, campaign: Campaign): boolean {
  if (!user) return false
  if (user.role === "admin") return true
  return user.role === "creator" && campaign.creatorId === user.userId
}

export function canReviewCustomGames(user: User | null): boolean {
  return user?.role === "admin"
}

export function canSubmitAttempt(user: User | null): boolean {
  // Players submit attempts. (Creators may preview their own campaigns.)
  return user?.role === "player" || user?.role === "creator"
}

export class PermissionError extends Error {
  status = 403
  constructor(message = "You do not have permission to do that.") {
    super(message)
    this.name = "PermissionError"
  }
}

export function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) throw new PermissionError(message)
}
