import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/current-user"
import { DashboardHeader } from "@/components/brandquest/DashboardHeader"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  // Admin is reached via /signin?role=admin (reviewer access).
  if (!user) redirect("/signin?role=admin")
  if (user.role !== "admin") redirect("/role")

  return (
    <div className="flex min-h-dvh flex-col">
      <DashboardHeader role="admin" />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</div>
    </div>
  )
}
