import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/current-user"
import { DashboardHeader } from "@/components/brandquest/DashboardHeader"

export default async function PlayerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/role?role=player")
  if (user.role !== "player") redirect("/role")

  return (
    <div className="flex min-h-dvh flex-col">
      <DashboardHeader role="player" />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</div>
    </div>
  )
}
