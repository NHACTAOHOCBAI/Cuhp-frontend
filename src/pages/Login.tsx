import * as React from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { apiFetch } from "@/lib/api"
import type { User } from "@/types"

interface LoginResponse {
  token: string
  user: User
}

export default function Login() {
  const { login: authLogin, token, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = React.useState("admin")
  const [password, setPassword] = React.useState("admin")
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  // Redirect if already logged in
  React.useEffect(() => {
    if (token && user) {
      const from = (location.state as any)?.from || "/"
      navigate(from, { replace: true })
    }
  }, [token, user, navigate, location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const data = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      })
      authLogin(data.token, data.user)
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FCFAF7] font-outfit p-6">
      <div className="w-full max-w-md bg-white border border-[#E5DFE2] rounded-[24px] p-8 shadow-[0_10px_30px_-5px_rgba(239, 188, 213, 0.15)] space-y-8">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-3">
          <img
            alt="Cuhp Logo"
            className="h-12 w-auto mx-auto"
            src="https://lh3.googleusercontent.com/aida/AEtjO1XNZHMv5HYlxg6fKteaS5hw4xol086fNr_IXdyEOo35-n7dyMRU7NFF4DlVu5y7uHM4nrD-qVLItN9oHcn2_PoG-yNfmkoWMF8cCpHnvvmp9jKDH_mT7izGNi0rMI168pAFUFpwz3CUk1zZkHUh5Wlj5UsblPkrCX58D1rgIml18QFa2qQsd50SaK3yMRaM1YJlbV863u26637abTNFIsyfdo1QF-3lq5vj1NLuHbUAeFBqHhHaWpN2Q92q"
          />
          <h1 className="font-sora font-bold text-2xl text-[#1f1a1d]">Cuhp Portal</h1>
          <p className="text-sm text-[#7b5268]">Sign in to enter your world of serenity</p>
        </div>

        {error && (
          <div className="p-4 bg-[#fcf1f5] border border-[#efbcd5] text-xs text-[#7b5268] rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#7b5268] uppercase tracking-wider font-mono">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-[#FCFAF7] border border-[#E5DFE2] rounded-xl text-sm focus:outline-none focus:border-[#EFBCD5] transition-all font-outfit"
              placeholder="Enter your username"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#7b5268] uppercase tracking-wider font-mono">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#FCFAF7] border border-[#E5DFE2] rounded-xl text-sm focus:outline-none focus:border-[#EFBCD5] transition-all font-outfit"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#EFBCD5] text-[#201B1E] rounded-xl font-sora font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "Connecting..." : "Sign In"}
          </button>
        </form>

        <div className="text-center">
          <p className="text-xs text-[#7b5268]">
            Default account: <span className="font-mono bg-[#fcf1f5] px-1 py-0.5 rounded">admin</span> / <span className="font-mono bg-[#fcf1f5] px-1 py-0.5 rounded">admin</span>
          </p>
        </div>
      </div>
    </div>
  )
}
