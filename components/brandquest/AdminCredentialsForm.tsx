"use client"

import type { FormEvent } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AdminCredentialsForm({
  enabled,
}: {
  enabled: boolean
}) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError("")
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/auth/complete",
    })
    setPending(false)
    if (!result || result.error) {
      setError("Admin credentials were not accepted.")
      return
    }
    const target = result.url
      ? new URL(result.url, window.location.origin)
      : new URL("/auth/complete", window.location.origin)
    router.push(`${target.pathname}${target.search}`)
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">Admin email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="admin@brandquest.local"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={!enabled || pending}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Admin password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={!enabled || pending}
          required
        />
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={!enabled || pending}>
        <Mail className="size-4" aria-hidden="true" />
        Continue as admin
      </Button>
    </form>
  )
}
