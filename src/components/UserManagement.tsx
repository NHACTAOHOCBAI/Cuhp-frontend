import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Trash2, ShieldCheck, UserCheck } from "lucide-react"
import { toast } from "sonner"
import type { User } from "../types"
import { useConfirm } from "@/components/ConfirmDialog"

interface UserManagementProps {
  token: string
  currentAdmin: User
}

export function UserManagement({ token, currentAdmin }: UserManagementProps) {
  const confirm = useConfirm()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/v1/users", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (!res.ok) {
        throw new Error("Không thể tải danh sách người dùng.")
      }
      const data = await res.json()
      setUsers(data)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDeleteUser = async (userId: string) => {
    const ok = await confirm({
      title: "Xác nhận xóa người dùng",
      description: "Bạn có chắc chắn muốn xóa người dùng này? Toàn bộ phòng chat và tin nhắn liên quan cũng sẽ bị xóa. Hành động này không thể hoàn tác.",
      confirmText: "Xóa",
      cancelText: "Hủy",
      variant: "destructive",
    })
    if (!ok) return

    try {
      setLoading(true)
      const res = await fetch(`/api/v1/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || "Xóa người dùng thất bại.")
      }
      toast.success("Đã xóa người dùng thành công.")
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-background p-6 overflow-y-auto">
      <div className="w-full space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Quản lý thành viên</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Xem danh sách, phân quyền quản trị và quản lý tài khoản người dùng trên hệ thống.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-muted-foreground text-xs uppercase font-semibold tracking-wider">
                <th className="p-4">Họ và tên</th>
                <th className="p-4">Tên đăng nhập</th>
                <th className="p-4">Vai trò</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {users.map((user) => {
                const isSelf = user.id === currentAdmin.id
                return (
                  <tr key={user.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="p-4 font-medium text-foreground flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-secondary text-foreground flex items-center justify-center font-bold text-xs uppercase border border-border">
                        {user.initials}
                      </div>
                      <span>
                        {user.name} {isSelf && <span className="text-xs text-muted-foreground">(Bạn)</span>}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">{user.username}</td>
                    <td className="p-4">
                      {user.role === "admin" ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-foreground text-background border border-foreground">
                          <ShieldCheck className="h-3 w-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-secondary text-foreground border border-border">
                          <UserCheck className="h-3 w-3" />
                          User
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1.5 text-xs">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            user.status === "online" ? "bg-emerald-500" : "bg-muted-foreground/30"
                          }`}
                        ></span>
                        <span className="capitalize">{user.status}</span>
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Xóa người dùng"
                        disabled={isSelf || loading}
                        onClick={() => handleDeleteUser(user.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                )
              })}

              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-muted-foreground">
                    Không có thành viên nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
