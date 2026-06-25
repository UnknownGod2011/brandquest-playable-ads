import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Info, Mail } from "lucide-react"
import type { UserRole } from "@/lib/db/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Logo } from "@/components/brandquest/Logo"
import { completeSignIn } from "@/lib/auth/actions"
import { getAuthStatus } from "@/lib/auth/auth.config"

export const metadata: Metadata = {
  title: "Sign in — BrandQuest",
}

const VALID: UserRole[] = ["player", "creator", "admin"]

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const { role } = await searchParams
  const safeRole: UserRole = VALID.includes(role as UserRole)
    ? (role as UserRole)
    : "player"
  const auth = getAuthStatus()

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
          {/* Google sign-in (prepared) */}
          <Button
            variant="outline"
            className="w-full"
            disabled={!auth.googleConfigured}
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          <div className="my-4 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          {/* Email form (prepared) + continue action */}
          <form action={completeSignIn} className="flex flex-col gap-4">
            <input type="hidden" name="role" value={safeRole} />
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@brand.com"
                autoComplete="email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full">
              <Mail className="size-4" aria-hidden="true" />
              Continue
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </form>

          {!auth.enabled ? (
            <div className="mt-4 flex gap-2 rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>
                Auth runs in prepared mode. Add{" "}
                <code className="text-foreground">AUTH_SECRET</code>,{" "}
                <code className="text-foreground">GOOGLE_CLIENT_ID</code>, and{" "}
                <code className="text-foreground">GOOGLE_CLIENT_SECRET</code> to
                enable real sign-in. Continuing starts a safe role session
                without storing credentials.
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
