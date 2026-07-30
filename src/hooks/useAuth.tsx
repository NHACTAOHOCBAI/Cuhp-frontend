import * as React from "react"
import type { User } from "@/types"
import { apiFetch } from "@/lib/api"

interface AuthContextValue {
  token: string | null
  user: User | null
  loading: boolean
  isAdmin: boolean
  login: (token: string, user: User) => void
  logout: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = React.useState<string | null>(() => localStorage.getItem("token"))
  const [user, setUser] = React.useState<User | null>(() => {
    try {
      const raw = localStorage.getItem("user")
      return raw ? (JSON.parse(raw) as User) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = React.useState<boolean>(!!localStorage.getItem("token") && !localStorage.getItem("user"))

  // Resolve current user on mount if we have a token but no cached user
  React.useEffect(() => {
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    if (user) {
      setLoading(false)
      return
    }
    let cancelled = false
    apiFetch<User>("/users/me", { token })
      .then((data) => {
        if (!cancelled) {
          setUser(data)
          localStorage.setItem("user", JSON.stringify(data))
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Token invalid — clear and force re-login
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          setToken(null)
          setUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token, user])

  const login = React.useCallback((newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken)
    localStorage.setItem("user", JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
    setLoading(false)
  }, [])

  const logout = React.useCallback(async () => {
    const currentToken = localStorage.getItem("token")
    if (currentToken) {
      try {
        await apiFetch("/auth/logout", { method: "POST", token: currentToken })
      } catch {
        // ignore — we'll still clear local state
      }
    }
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setToken(null)
    setUser(null)
  }, [])

  const value = React.useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      loading,
      isAdmin: user?.role === "admin",
      login,
      logout,
    }),
    [token, user, loading, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>")
  return ctx
}

/**
 * Convenience hook that returns the props expected by the existing
 * UserManagement component (`{ token, currentAdmin }`).
 */
export function useAdminProps() {
  const { token, user, isAdmin } = useAuth()
  if (!isAdmin || !token || !user) {
    throw new Error("useAdminProps used outside admin shell")
  }
  return { token, currentAdmin: user }
}