import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/current-user"
import { DashboardHeader } from "@/components/brandquest/DashboardHeader"

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser("creator")
  if (!user) redirect("/signin?role=creator")
  if (user.role !== "creator") redirect("/role")

  return (
    <div className="flex min-h-dvh flex-col">
      <DashboardHeader role="creator" />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</div>
    </div>
  )
}
