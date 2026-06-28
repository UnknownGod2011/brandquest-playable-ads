export interface AuthProviderStatus {
  googleConfigured: boolean
  secretConfigured: boolean
  adminCredentialsConfigured: boolean
  enabled: boolean
}

export function getAuthStatus(): AuthProviderStatus {
  const googleConfigured =
    Boolean(process.env.GOOGLE_CLIENT_ID) &&
    Boolean(process.env.GOOGLE_CLIENT_SECRET)
  const secretConfigured = Boolean(process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET)
  const adminCredentialsConfigured =
    Boolean(process.env.ADMIN_EMAIL) &&
    Boolean(process.env.ADMIN_PASSWORD_HASH) &&
    Boolean(process.env.ADMIN_PASSWORD_SALT)
  return {
    googleConfigured,
    secretConfigured,
    adminCredentialsConfigured,
    enabled: (googleConfigured || adminCredentialsConfigured) && secretConfigured,
  }
}

export const AUTH_COOKIE = "brandquest_role"
export const PLAYER_COOKIE = "brandquest_player"
