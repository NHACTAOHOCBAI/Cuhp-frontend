import { useEffect, useState, useRef } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Trash2, ShieldCheck, UserCheck, Search, X } from "lucide-react"
import { toast } from "sonner"
import type { User } from "../types"
import { useConfirm } from "@/components/ConfirmDialog"
import { cn } from "@/lib/utils"

interface UserManagementProps {
  token: string
  currentAdmin: User
}

export function UserManagement({ token, currentAdmin }: UserManagementProps) {
  const confirm = useConfirm()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  // Filters and Selection States
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

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

  // Sync selection state with visible list
  const filteredUsers = users.filter((u) => {
    const matchesQ =
      searchQuery.trim() === "" ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "" || u.role === roleFilter
    const matchesStatus = statusFilter === "" || u.status === statusFilter
    return matchesQ && matchesRole && matchesStatus
  })

  useEffect(() => {
    if (selectedIds.size === 0) return
    const visible = new Set(filteredUsers.map((u) => u.id))
    const next = new Set(Array.from(selectedIds).filter((id) => visible.has(id)))
    if (next.size !== selectedIds.size) setSelectedIds(next)
  }, [users, searchQuery, roleFilter, statusFilter])

  const allSelected = filteredUsers.length > 0 && filteredUsers.every((u) => selectedIds.has(u.id))
  const someSelected = filteredUsers.some((u) => selectedIds.has(u.id))

  const headerCheckboxRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = !allSelected && someSelected
    }
  }, [allSelected, someSelected])

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredUsers.map((u) => u.id)))
    }
  }

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

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
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    const validIds = ids.filter((id) => id !== currentAdmin.id)
    if (validIds.length === 0) {
      toast.error("Bạn không thể tự xóa tài khoản của chính mình.")
      return
    }

    const ok = await confirm({
      title: `Xác nhận xóa ${validIds.length} thành viên`,
      description: `Bạn có chắc chắn muốn xóa ${validIds.length} thành viên đã chọn? Toàn bộ phòng chat và tin nhắn liên quan cũng sẽ bị xóa. Hành động này không thể hoàn tác.`,
      confirmText: "Xóa tất cả",
      cancelText: "Hủy",
      variant: "destructive",
    })
    if (!ok) return

    try {
      setLoading(true)
      let deleted = 0
      let failed = 0

      await Promise.all(
        validIds.map(async (id) => {
          try {
            const res = await fetch(`/api/v1/users/${id}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
            if (res.ok) {
              deleted++
            } else {
              failed++
            }
          } catch (err) {
            failed++
          }
        }),
      )

      if (failed > 0) {
        toast.warning(`Đã xóa ${deleted} thành viên, thất bại ${failed} thành viên.`)
      } else {
        toast.success(`Đã xóa thành công ${deleted} thành viên.`)
      }

      setUsers((prev) => prev.filter((u) => !selectedIds.has(u.id)))
      setSelectedIds(new Set())
    } catch (err: any) {
      toast.error(err.message || "Xóa hàng loạt thất bại.")
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, tên đăng nhập..."
              className="pl-9 pr-9 shadow-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Xoá tìm kiếm"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              { value: "", label: "Tất cả vai trò" },
              { value: "admin", label: "Admin" },
              { value: "user", label: "User" },
            ]}
            className="sm:w-44 [&_button]:shadow-none"
            ariaLabel="Lọc theo vai trò"
          />

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "", label: "Tất cả trạng thái" },
              { value: "online", label: "Online" },
              { value: "offline", label: "Offline" },
            ]}
            className="sm:w-44 [&_button]:shadow-none"
            ariaLabel="Lọc theo trạng thái"
          />
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm animate-in fade-in-0 duration-200">
            <span className="font-medium text-foreground">
              Đã chọn {selectedIds.size} thành viên
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Bỏ chọn
            </Button>
            <div className="ml-auto">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {loading ? "Đang xoá..." : `Xoá ${selectedIds.size} thành viên`}
              </Button>
            </div>
          </div>
        )}

        <div className="rounded-md border border-border bg-card overflow-hidden shadow-none">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-muted-foreground text-sm font-medium">
                <th className="w-10 p-4">
                  <input
                    type="checkbox"
                    aria-label="Chọn tất cả"
                    checked={allSelected}
                    ref={headerCheckboxRef}
                    onChange={toggleAll}
                    className="h-4 w-4 cursor-pointer accent-primary rounded"
                  />
                </th>
                <th className="p-4">Họ và tên</th>
                <th className="p-4">Tên đăng nhập</th>
                <th className="p-4">Vai trò</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredUsers.map((user) => {
                const isSelf = user.id === currentAdmin.id
                const isSelected = selectedIds.has(user.id)
                return (
                  <tr
                    key={user.id}
                    className={cn(
                      "hover:bg-secondary/10 transition-colors",
                      isSelected && "bg-primary/5",
                    )}
                  >
                    <td className="p-4 align-middle">
                      <input
                        type="checkbox"
                        aria-label={`Chọn ${user.name}`}
                        checked={isSelected}
                        onChange={() => toggleOne(user.id)}
                        disabled={isSelf}
                        className="h-4 w-4 cursor-pointer accent-primary rounded disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </td>
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

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-muted-foreground">
                    Không tìm thấy thành viên nào.
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
