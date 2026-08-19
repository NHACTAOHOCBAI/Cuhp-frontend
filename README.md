# Cuhp — Frontend Web App

Web cá nhân (admin dashboard) của hệ thống Cuhp — phục vụ 4 miền chính: **Tiếng Anh** (bài nghe, từ vựng, luyện dịch & bài đọc), **Tập gym**, **Công việc** (Eisenhower matrix + daily planner), **Quản trị** (user & role). Mobile companion app (Expo React Native) sử dụng cùng backend API.

Xây dựng dưới dạng SPA hiện đại, mọi route `/admin/*` yêu cầu quyền admin.

---

## 🛠️ Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Routing | react-router-dom v7 |
| Data | @tanstack/react-query v5 + axios |
| Icons | lucide-react |
| UI primitives | Radix UI (alert-dialog, dropdown-menu, dialog, sheet, tabs-control, ...) |
| Drag & Drop | @dnd-kit (core + sortable + utilities) |
| Toasts | sonner |
| Lint | oxlint |

---

## 📁 Cấu trúc thư mục

```text
frontend/
├── src/
│   ├── assets/                 # Logo, hình ảnh tĩnh
│   ├── components/             # Component React tái sử dụng
│   │   ├── admin/              # Shell admin: Sidebar, Topbar, AdminLayout, navItems, PageHeader, UserMenu
│   │   ├── auth/               # ProtectedRoute (gate /admin/* — yêu cầu admin)
│   │   ├── ui/                 # shadcn-style primitives: Button, Card, Input, Dialog, Sheet, TabsControl, RichTextEditor, MascotAssistant, Sonner...
│   │   ├── LoginRegister.tsx   # Form login/register kết hợp
│   │   ├── UserManagement.tsx  # Bảng user cho admin
│   │   └── ConfirmDialog.tsx   # useConfirm() provider toàn cục
│   ├── features/               # Module nghiệp vụ (mỗi module: Page + hooks + api + components)
│   │   ├── audio/              # Quản lý bài nghe (upload R2, list/grid, player, comments)
│   │   ├── vocabulary/         # Sổ tay từ vựng SRS Leitner (5 hộp), review hằng ngày
│   │   ├── reading/            # Bài đọc song ngữ, luyện dịch, tra từ theo vùng chọn, comments
│   │   ├── gym/                # Lịch tập, nhóm cơ, biểu đồ volume + strength progress
│   │   └── todos/              # Eisenhower matrix + Daily Planner + Inbox, drag-drop
│   ├── hooks/                  # useAuth (token + user), useTheme, useResizeHandle
│   ├── lib/                    # apiFetch (wrapper có Bearer token), tts, utils (cn)
│   ├── pages/                  # Route-level wrappers
│   │   ├── LoginPage.tsx
│   │   ├── NotFound.tsx
│   │   └── admin/              # Re-export wrappers trỏ vào features/* (Dashboard, Audio, Vocabulary, Reading, AudioDetail, ReadingDetail, Gym, Todo, Users)
│   ├── types.ts                # TypeScript interfaces chung
│   ├── App.tsx                 # BrowserRouter + Routes + AuthProvider
│   ├── main.tsx                # Entry point React
│   └── index.css               # Tailwind v4 + font toàn cục
├── index.html
├── vite.config.ts              # Vite proxy: /api → http://127.0.0.1:8000, ws: true
├── vercel.json                 # Cấu hình deploy Vercel
├── components.json             # shadcn registry
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🚀 Cài đặt & chạy local

### 1. Cài dependencies
```bash
cd frontend
npm install
```

### 2. Chạy dev server
```bash
npm run dev
```
Mặc định chạy tại [http://localhost:5173](http://localhost:5173).

### 3. Proxy backend
`vite.config.ts` đã cấu hình sẵn:
```typescript
server: {
  proxy: {
    "/api": { target: "http://127.0.0.1:8000", changeOrigin: true, ws: true },
  },
}
```
Mọi request `/api/...` và WebSocket từ frontend được chuyển tiếp sang backend local. Đảm bảo backend đang chạy ở port 8000.

### 4. Các script khác
```bash
npm run build      # tsc -b && vite build (production)
npm run preview    # Serve bản build
npm run lint       # oxlint
```

---

## 🧭 Sidebar — cấu trúc nhóm

Sidebar gom theo miền cá nhân, có thể đóng/mở từng nhóm (trạng thái lưu `localStorage` key `admin-sidebar-groups-collapsed`):

| Nhóm | Children |
|---|---|
| Tổng quan | Dashboard |
| **Tiếng Anh** | Bài nghe, Từ vựng, Luyện dịch & Bài đọc |
| **Tập gym** | Hỗ trợ tập gym |
| **Công việc** | Quản lý công việc |
| **Quản trị** | Quản lý thành viên |

Tự động bung nhóm khi route hiện tại thuộc nhóm đó. Sidebar có 2 chế độ: mở rộng (240px) và icon-only (64px).

### Routing
```text
/login                 → LoginPage (public)
/admin                 → Dashboard
/admin/users           → Quản lý thành viên
/admin/audio, /:id     → Bài nghe
/admin/vocabulary      → Từ vựng
/admin/reading, /:id   → Luyện dịch & Bài đọc
/admin/gym             → Tập gym
/admin/todo            → Công việc
*                      → NotFound
```

---

## 🌟 Tính năng theo miền

### Tiếng Anh
- **Bài nghe**: upload file lên Cloudflare R2, hiển thị list/grid, player HTML5, comments theo vùng chọn.
- **Từ vựng**: SRS Leitner 5 hộp (1→1d, 2→2d, 3→4d, 4→7d, 5→14d), streak tracking, lookup từ điển ngoài.
- **Luyện dịch & Bài đọc**: bài viết song ngữ, ô translation, tra từ theo selection, comments.

### Tập gym
7 nhóm cơ mặc định (Ngực, Lưng, Chân, Vai, Tay, Bụng, Cardio), lịch tập theo ngày, biểu đồ weekly volume + strength progress.

### Công việc
3 cột: Inbox / Eisenhower Matrix 2×2 / Daily Planner, drag-drop thay đổi quadrant, stats panel (completion rate, focus rate, overdue).

### Quản trị
CRUD user, đổi role, xóa tài khoản.

---

## 🔒 Xác thực & phân quyền

- Token lưu `localStorage`, `useAuth` cung cấp `login` / `logout` / `user`.
- `apiFetch` (lib/api.ts) tự động gắn `Authorization: Bearer <token>`.
- `<ProtectedRoute requireAdmin>` chặn mọi route `/admin/*` — chưa đăng nhập hoặc không phải admin → redirect `/login`.
- `getPageTitle(pathname)` ở `navItems.ts` resolve title cho Topbar.

Mặc định backend seed tài khoản `admin` / `admin` (SHA-256 + salt `chat_pepper_123`).

---

## 📝 Ghi chú thêm

- Vite dev server cần backend chạy ở `127.0.0.1:8000` (hoặc cấu hình lại proxy trong `vite.config.ts`).
- `components.json` khai báo shadcn-style UI registry — dùng `npx shadcn@latest add ...` nếu cần thêm component.
- Build production to ra 1 bundle chính (~660 KB gzipped ~190 KB). Nếu cần tách chunk, có thể dùng dynamic import cho các feature page.
