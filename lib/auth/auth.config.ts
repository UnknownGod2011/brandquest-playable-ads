/**
 * BrandQuest — Auth configuration (prepared, not yet active)
 *
 * The app is structured for Google + email sign-in but ships WITHOUT real
 * credentials so it runs safely in any environment. No secrets are referenced
 * in client code. When you are ready to enable real auth:
 *
 *   1. Add credentials to your environment (see .env.example):
 *        AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *   2. Install your auth provider (e.g. `pnpm add next-auth` or Better Auth).
 *   3. Wire the provider into this config and replace the abstraction in
 *      lib/auth/current-user.ts with real session reads.
 *
 * IMPORTANT: AUTH_SECRET / client secrets are server-only. Never expose them to
 * the browser. Do not prefix them with NEXT_PUBLIC_.
 */

export interface AuthProviderStatus {
  googleConfigured: boolean
  secretConfigured: boolean
  /** True only when every required secret is present. */
  enabled: boolean
}

export function getAuthStatus(): AuthProviderStatus {
  const googleConfigured =
    Boolean(process.env.GOOGLE_CLIENT_ID) &&
    Boolean(process.env.GOOGLE_CLIENT_SECRET)
  const secretConfigured = Boolean(process.env.AUTH_SECRET)
  return {
    googleConfigured,
    secretConfigured,
    enabled: googleConfigured && secretConfigured,
  }
}

export const AUTH_COOKIE = "brandquest_role"
export const PLAYER_COOKIE = "brandquest_player"
