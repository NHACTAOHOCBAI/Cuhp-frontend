import * as React from "react"
import { useAuth } from "@/hooks/useAuth"
import { apiFetch } from "@/lib/api"
import type { User } from "@/types"
import {
  User as UserIcon,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Shield,
  Target,
  Flame,
  Camera,
  LogOut,
  Sparkles,
  Upload,
  Trash2,
  Image as ImageIcon
} from "lucide-react"

export default function Profile() {
  const { user, token, login, logout } = useAuth()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Profile Form States
  const [name, setName] = React.useState(user?.name || "")
  const [avatar, setAvatar] = React.useState(user?.avatar || "")
  const [dailyTarget, setDailyTarget] = React.useState<number>(user?.daily_target || 10)
  const [savingProfile, setSavingProfile] = React.useState(false)
  const [profileMsg, setProfileMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

  // Password Form States
  const [oldPassword, setOldPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [savingPassword, setSavingPassword] = React.useState(false)
  const [passwordMsg, setPasswordMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

  // Update profile states if user object changes
  React.useEffect(() => {
    if (user) {
      setName(user.name || "")
      setAvatar(user.avatar || "")
      setDailyTarget(user.daily_target || 10)
    }
  }, [user])

  // Handle Local File Selection (Upload Avatar)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit size to 3MB
    if (file.size > 3 * 1024 * 1024) {
      setProfileMsg({ type: "error", text: "Dung lượng ảnh quá lớn (vượt quá 3MB). Vui lòng chọn ảnh nhỏ hơn." })
      return
    }

    if (!file.type.startsWith("image/")) {
      setProfileMsg({ type: "error", text: "Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP, GIF)." })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatar(reader.result)
        setProfileMsg({ type: "success", text: "Đã chọn ảnh! Nhấn 'Lưu thay đổi' bên dưới để cập nhật." })
      }
    }
    reader.readAsDataURL(file)
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setProfileMsg({ type: "error", text: "Tên hiển thị không được để trống." })
      return
    }

    setSavingProfile(true)
    setProfileMsg(null)

    try {
      const updatedUser = await apiFetch<User>("/users/me", {
        method: "PUT",
        body: JSON.stringify({
          name: name.trim(),
          avatar: avatar.trim() || undefined,
          daily_target: dailyTarget,
        }),
      })

      if (token) {
        login(token, updatedUser)
      }
      setProfileMsg({ type: "success", text: "Cập nhật thông tin cá nhân thành công!" })
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message || "Có lỗi xảy ra khi cập nhật." })
    } finally {
      setSavingProfile(false)
    }
  }

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: "error", text: "Vui lòng nhập đầy đủ thông tin mật khẩu." })
      return
    }

    if (newPassword.length < 4) {
      setPasswordMsg({ type: "error", text: "Mật khẩu mới phải có ít nhất 4 ký tự." })
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Mật khẩu xác nhận không khớp." })
      return
    }

    setSavingPassword(true)
    setPasswordMsg(null)

    try {
      const res = await apiFetch<{ message: string }>("/users/me/password", {
        method: "PUT",
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      })

      setPasswordMsg({ type: "success", text: res.message || "Đổi mật khẩu thành công!" })
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Không thể đổi mật khẩu." })
    } finally {
      setSavingPassword(false)
    }
  }

  const getInitials = (userName?: string) => {
    if (!userName) return "CU"
    return userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Page Header */}
      <header className="mt-4 mb-6">
        <h1 className="font-sora font-bold text-3xl mb-2 text-[#201B1E] tracking-tight">The Profile</h1>
        <p className="font-outfit font-normal text-base text-[#706065]">
          Quản lý thông tin tài khoản, ảnh đại diện và thiết lập bảo mật cá nhân.
        </p>
      </header>

      {/* Profile Overview Card (Cuhp Style) */}
      <div className="bg-white border border-[#E5DFE2] rounded-[24px] p-6 md:p-8 shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] flex flex-col md:flex-row items-center justify-between gap-6 transition-all">
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          {/* Interactive Avatar Overlay */}
          <div className="relative group cursor-pointer" onClick={triggerFileUpload} title="Bấm để tải ảnh đại diện từ máy tính">
            {avatar ? (
              <img
                src={avatar}
                alt={user?.name || "Avatar"}
                className="w-24 h-24 rounded-full object-cover border-4 border-[#EFBCD5] shadow-sm transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#F4ECEF] border-4 border-[#EFBCD5] flex items-center justify-center text-[#7b5268] font-sora font-bold text-2xl shadow-sm transition-transform group-hover:scale-105">
                {getInitials(user?.name)}
              </div>
            )}
            {/* Camera Overlay Badge */}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-sora font-semibold">
              <Camera className="w-6 h-6 mb-1" />
              <span>Đổi ảnh</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h2 className="font-sora font-bold text-2xl text-[#1f1a1d]">
                {user?.name || "Người dùng Cuhp"}
              </h2>
              <Sparkles className="w-5 h-5 text-[#EFBCD5]" />
            </div>
            <p className="font-outfit text-sm text-[#706065]">@{user?.username}</p>

            <div className="flex flex-wrap gap-2 pt-2 justify-center md:justify-start">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sora font-semibold bg-[#F4ECEF] text-[#7b5268] border border-[#EFBCD5]/30">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                {user?.current_streak ?? 0} Ngày Streak
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sora font-semibold bg-[#FCFAF7] text-[#1f1a1d] border border-[#E5DFE2]">
                <Target className="w-3.5 h-3.5 text-[#7b5268]" />
                {user?.daily_target ?? 10} từ / ngày
              </span>
              {user?.role === "admin" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sora font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={triggerFileUpload}
            className="flex items-center gap-2 px-4 py-3 rounded-[16px] bg-[#EFBCD5]/30 text-[#7b5268] hover:bg-[#EFBCD5]/50 font-sora font-bold text-sm transition-all shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Tải ảnh lên</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 px-4 py-3 rounded-[16px] bg-[#F4ECEF] text-[#7b5268] hover:bg-rose-100 hover:text-rose-700 border border-[#E5DFE2] font-sora font-bold text-sm transition-all shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Grid: Profile Info & Change Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Settings Card */}
        <div className="bg-white border border-[#E5DFE2] rounded-[24px] p-6 md:p-8 shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] space-y-6">
          <div className="flex items-center gap-3 border-b border-[#E5DFE2] pb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#F4ECEF] flex items-center justify-center text-[#7b5268]">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sora font-bold text-lg text-[#1f1a1d]">Thông tin cá nhân</h3>
              <p className="font-outfit text-xs text-[#706065]">Cập nhật tên hiển thị, ảnh đại diện và mục tiêu</p>
            </div>
          </div>

          {profileMsg && (
            <div
              className={`p-4 rounded-[16px] flex items-center gap-3 text-xs font-outfit font-medium ${
                profileMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {profileMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-5 font-outfit">
            <div>
              <label className="block text-xs font-sora font-bold text-[#4f4449] uppercase tracking-wider mb-2">
                Tên hiển thị
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên hiển thị"
                className="w-full px-4 py-3 rounded-[16px] border border-[#E5DFE2] focus:outline-none focus:border-[#EFBCD5] text-sm text-[#1f1a1d] transition-colors"
              />
            </div>

            {/* Avatar Section with Upload & URL */}
            <div>
              <label className="block text-xs font-sora font-bold text-[#4f4449] uppercase tracking-wider mb-2">
                Ảnh đại diện (Avatar)
              </label>

              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <button
                  type="button"
                  onClick={triggerFileUpload}
                  className="flex-1 py-3 px-4 rounded-[16px] bg-[#FCFAF7] border border-[#E5DFE2] hover:border-[#EFBCD5] hover:bg-[#F4ECEF] text-[#7b5268] font-sora font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Chọn ảnh từ máy tính</span>
                </button>

                {avatar && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatar("")
                      setProfileMsg({ type: "success", text: "Đã xóa ảnh đại diện. Nhấn 'Lưu thay đổi' để áp dụng." })
                    }}
                    className="py-3 px-4 rounded-[16px] bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-sora font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa ảnh</span>
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="Hoặc dán URL hình ảnh (https://...)"
                  className="w-full px-4 py-3 rounded-[16px] border border-[#E5DFE2] focus:outline-none focus:border-[#EFBCD5] text-xs text-[#1f1a1d] transition-colors pr-10 font-mono"
                />
                <ImageIcon className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7b5268]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-sora font-bold text-[#4f4449] uppercase tracking-wider mb-2">
                Mục tiêu học từ vựng hàng ngày (từ / ngày)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 rounded-[16px] border border-[#E5DFE2] focus:outline-none focus:border-[#EFBCD5] text-sm text-[#1f1a1d] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-3.5 px-6 rounded-[16px] bg-[#EFBCD5] text-[#7b5268] font-sora font-bold text-sm hover:bg-[#e8abc6] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {savingProfile ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Lưu thay đổi</span>
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white border border-[#E5DFE2] rounded-[24px] p-6 md:p-8 shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] space-y-6">
          <div className="flex items-center gap-3 border-b border-[#E5DFE2] pb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#F4ECEF] flex items-center justify-center text-[#7b5268]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sora font-bold text-lg text-[#1f1a1d]">Đổi mật khẩu</h3>
              <p className="font-outfit text-xs text-[#706065]">Đảm bảo an toàn cho tài khoản của bạn</p>
            </div>
          </div>

          {passwordMsg && (
            <div
              className={`p-4 rounded-[16px] flex items-center gap-3 text-xs font-outfit font-medium ${
                passwordMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {passwordMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-5 font-outfit">
            <div>
              <label className="block text-xs font-sora font-bold text-[#4f4449] uppercase tracking-wider mb-2">
                Mật khẩu hiện tại
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-[16px] border border-[#E5DFE2] focus:outline-none focus:border-[#EFBCD5] text-sm text-[#1f1a1d] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-sora font-bold text-[#4f4449] uppercase tracking-wider mb-2">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ít nhất 4 ký tự"
                className="w-full px-4 py-3 rounded-[16px] border border-[#E5DFE2] focus:outline-none focus:border-[#EFBCD5] text-sm text-[#1f1a1d] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-sora font-bold text-[#4f4449] uppercase tracking-wider mb-2">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full px-4 py-3 rounded-[16px] border border-[#E5DFE2] focus:outline-none focus:border-[#EFBCD5] text-sm text-[#1f1a1d] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full py-3.5 px-6 rounded-[16px] bg-[#1f1a1d] text-white font-sora font-bold text-sm hover:bg-[#382f34] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {savingPassword ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              <span>Cập nhật mật khẩu</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
