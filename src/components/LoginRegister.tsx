import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { User } from "../types"

interface LoginRegisterProps {
  onLoginSuccess: (token: string, user: User) => void
}

export function LoginRegister({ onLoginSuccess }: LoginRegisterProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [role] = useState<"admin" | "user">("admin")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isLogin) {
        const res = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.detail || "Đăng nhập thất bại. Vui lòng kiểm tra lại.")
        }

        onLoginSuccess(data.token, data.user)
      } else {
        if (!name.trim()) {
          throw new Error("Vui lòng nhập họ tên của bạn.")
        }
        const res = await fetch("/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, name, role })
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.detail || "Đăng ký thất bại. Tên đăng nhập có thể đã tồn tại.")
        }

        // Auto login after register
        const loginRes = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        })
        const loginData = await loginRes.json()
        if (loginRes.ok) {
          onLoginSuccess(loginData.token, loginData.user)
        } else {
          setIsLogin(true)
          setError("Đăng ký thành công! Hãy đăng nhập bằng tài khoản mới.")
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-2xl transition-all duration-300">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-foreground text-background flex items-center justify-center font-bold text-2xl shadow-md">
            C
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground">
            Monochat
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isLogin
              ? "Đăng nhập vào hệ thống hỗ trợ trực tuyến"
              : "Tạo tài khoản mới để bắt đầu trò chuyện"}
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Họ và tên
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-secondary/40 border-border"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Tên đăng nhập
              </label>
              <Input
                type="text"
                required
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-secondary/40 border-border"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Mật khẩu
              </label>
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-secondary/40 border-border"
              />
            </div>


          </div>

          <Button type="submit" disabled={loading} className="w-full py-6 text-sm font-semibold shadow-md bg-foreground text-background hover:bg-foreground/90">
            {loading ? "Đang xử lý..." : isLogin ? "Đăng nhập" : "Đăng ký & Đăng nhập"}
          </Button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError(null)
            }}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {isLogin
              ? "Chưa có tài khoản? Đăng ký ngay"
              : "Đã có tài khoản? Đăng nhập"}
          </button>
        </div>
      </div>
    </div>
  )
}
