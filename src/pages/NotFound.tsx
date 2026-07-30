import { Link } from "react-router-dom"

export default function NotFound() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background p-4">
      <div className="text-center space-y-3">
        <p className="text-6xl font-bold tracking-tight">404</p>
        <p className="text-muted-foreground">Trang bạn tìm không tồn tại.</p>
        <Link
          to="/login"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4"
        >
          Về trang đăng nhập
        </Link>
      </div>
    </div>
  )
}