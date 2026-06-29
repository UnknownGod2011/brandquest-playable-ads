import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import { scryptSync, timingSafeEqual } from "node:crypto"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { rateLimit } from "@/lib/security/rate-limit"

function adminCredentialsConfigured() {
  return Boolean(
    process.env.ADMIN_EMAIL &&
      process.env.ADMIN_PASSWORD_HASH &&
      process.env.ADMIN_PASSWORD_SALT,
  )
}

function verifyAdminPassword(password: unknown): boolean {
  const value = typeof password === "string" ? password : ""
  const expectedHash = process.env.ADMIN_PASSWORD_HASH ?? ""
  const salt = process.env.ADMIN_PASSWORD_SALT ?? ""
  if (!value || !expectedHash || !salt) return false
  if (!/^[a-f0-9]{128}$/i.test(expectedHash)) return false

  const expected = Buffer.from(expectedHash, "hex")
  const actual = scryptSync(value, salt, 64)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

const providers: NextAuthConfig["providers"] = []

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  )
}

if (adminCredentialsConfigured()) {
  providers.push(
    Credentials({
      name: "Admin credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const email = String(credentials?.email ?? "").trim().toLowerCase()
          const adminEmail = String(process.env.ADMIN_EMAIL ?? "").trim().toLowerCase()
          const limit = rateLimit(`admin-auth:${email || "unknown"}`, 5, 60_000)
          if (!limit.allowed || !email || email !== adminEmail) return null
          if (!verifyAdminPassword(credentials?.password)) return null

          const user = await db.upsertUser({
            userId: "admin_brandquest",
            email: adminEmail,
            displayName: "BrandQuest Admin",
            requestedRole: "admin",
            allowAdmin: true,
          })

          return {
            id: user.userId,
            email: user.email,
            name: user.displayName,
            image: user.avatarUrl ?? null,
          }
        } catch {
          return null
        }
      },
    }),
  )
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers,
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
})
