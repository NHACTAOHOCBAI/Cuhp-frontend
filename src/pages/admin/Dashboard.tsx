import * as React from "react"
import { Users, Loader2, Flame, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"
import type { User } from "@/types"

interface Counts {
  users: number | null
}

export default function Dashboard() {
  const { token } = useAuth()
  const [counts, setCounts] = React.useState<Counts>({
    users: null,
  })
  const [currentUser, setCurrentUser] = React.useState<User | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!token) return
    let cancelled = false
    
    // Fetch user counts (for admin overview)
    apiFetch<unknown[]>("/users", { token })
      .then((data) => {
        if (cancelled) return
        setCounts({
          users: data.length,
        })
      })
      .catch((err) => {
        if (cancelled) return
        setError("Không thể tải thông tin thành viên.")
        console.error(err)
      })

    // Fetch fresh user profile details
    apiFetch<User>("/users/me", { token })
      .then((data) => {
        if (cancelled) return
        setCurrentUser(data)
      })
      .catch((err) => {
        console.error("Không thể tải thông tin cá nhân:", err)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tổng quan</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Chào mừng bạn đến với hệ thống quản lý và ôn tập từ vựng cá nhân.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard 
          title="Chuỗi ôn tập liên tục" 
          value={currentUser === null ? null : `${currentUser.current_streak} ngày`} 
          icon={Flame} 
        />
        <KpiCard 
          title="Tiến trình ôn tập ngày" 
          value={currentUser === null ? null : `${currentUser.words_reviewed_today} / ${currentUser.daily_target} từ`} 
          icon={Target} 
        />
        <KpiCard 
          title="Tổng số thành viên" 
          value={counts.users === null ? null : counts.users.toString()} 
          icon={Users} 
        />
      </div>
    </div>
  )
}

function KpiCard({
  title,
  value,
  icon: Icon,
}: {
  title: string
  value: string | null
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card className="shadow-none rounded-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {value === null ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  )
}