import type { Metadata } from "next"
import Link from "next/link"
import { cookies } from "next/headers"
import { Info } from "lucide-react"
import type { UserRole } from "@/lib/db/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Logo } from "@/components/brandquest/Logo"
import { AdminCredentialsForm } from "@/components/brandquest/AdminCredentialsForm"
import { startGoogleSignIn } from "@/lib/auth/actions"
import { AUTH_COOKIE, getAuthStatus } from "@/lib/auth/auth.config"

export const metadata: Metadata = {
  title: "Sign in - BrandQuest",
}

const VALID: UserRole[] = ["player", "creator", "admin"]

function parseRole(value: string | undefined): UserRole | null {
  return VALID.includes(value as UserRole) ? (value as UserRole) : null
}

function authErrorMessage(error: string | undefined): string | null {
  if (!error) return null
  if (
    error === "AccessDenied" ||
    error === "OAuthCallback" ||
    error === "OAuthCallbackError" ||
    error === "CallbackRouteError" ||
    error === "OAuthCancelled" ||
    error.toLowerCase().includes("access_denied")
  ) {
    return "Sign-in was cancelled. Please try again."
  }
  if (error === "CredentialsSignin") {
    return "Admin credentials were not accepted."
  }
  return "We could not complete sign-in. Please try again."
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; error?: string }>
}) {
  const { role, error } = await searchParams
  const store = await cookies()
  const cookieRole = parseRole(store.get(AUTH_COOKIE)?.value)
  const safeRole: UserRole = parseRole(role) ?? cookieRole ?? "player"
  const auth = getAuthStatus()
  const isAdmin = safeRole === "admin"
  const message = authErrorMessage(error)

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-arcade-grid opacity-50" aria-hidden="true" />
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo />
          <h1 className="text-2xl font-bold tracking-tight">
            Continue as {safeRole}
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to save progress and claim rewards.
          </p>
        </div>

        <Card className="p-6">
          {message ? (
            <div className="mb-4 flex gap-2 rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
              <span>{message}</span>
            </div>
          ) : null}

          {isAdmin ? (
            <AdminCredentialsForm
              enabled={auth.secretConfigured && auth.adminCredentialsConfigured}
            />
          ) : (
            <form action={startGoogleSignIn}>
              <input type="hidden" name="role" value={safeRole} />
              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={!auth.secretConfigured || !auth.googleConfigured}
              >
                <GoogleIcon />
                Continue with Google
              </Button>
            </form>
          )}

          {!auth.secretConfigured || (!auth.googleConfigured && !isAdmin) ? (
            <div className="mt-4 flex gap-2 rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>
                Add <code className="text-foreground">AUTH_SECRET</code>,{" "}
                <code className="text-foreground">GOOGLE_CLIENT_ID</code>, and{" "}
                <code className="text-foreground">GOOGLE_CLIENT_SECRET</code> to
                enable real Google sign-in. Email sign-in is disabled until an
                email provider is configured.
              </span>
            </div>
          ) : null}

          {isAdmin && !auth.adminCredentialsConfigured ? (
            <div className="mt-4 flex gap-2 rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>
                Add <code className="text-foreground">ADMIN_EMAIL</code>,{" "}
                <code className="text-foreground">ADMIN_PASSWORD_HASH</code>, and{" "}
                <code className="text-foreground">ADMIN_PASSWORD_SALT</code> to
                enable reviewer access.
              </span>
            </div>
          ) : null}
        </Card>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Wrong path?{" "}
          <Link href="/role" className="font-medium text-primary hover:underline">
            Change role
          </Link>
        </p>
      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 11v3.6h5.1c-.2 1.3-1.6 3.9-5.1 3.9-3.1 0-5.6-2.5-5.6-5.6S8.9 7.3 12 7.3c1.7 0 2.9.7 3.6 1.4l2.5-2.4C16.5 4.7 14.5 4 12 4 7.6 4 4 7.6 4 12s3.6 8 8 8c4.6 0 7.7-3.2 7.7-7.8 0-.5 0-.9-.1-1.2H12z"
      />
    </svg>
  )
}
