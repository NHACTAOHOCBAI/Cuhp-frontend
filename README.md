# Cuhp Frontend Admin Dashboard 🍰🎨🎧

Đây là giao diện quản trị Admin Dashboard của hệ thống Cuhp, được xây dựng dưới dạng ứng dụng Single Page Application (SPA) hiện đại. Phục vụ việc quản lý thành viên và tải lên các bài nghe tiếng Anh lên Cloudflare R2 để học viên học trên ứng dụng di động.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

* **Thư viện chính**: [React 19](https://react.dev/)
* **Ngôn ngữ**: [TypeScript](https://www.typescriptlang.org/)
* **Build Tool**: [Vite](https://vite.dev/)
* **Styling & CSS**: [Tailwind CSS v4](https://tailwindcss.com/)
* **Bộ Icons**: [Lucide React](https://lucide.dev/)
* **Thông báo**: [Sonner](https://github.com/emilkowalski/sonner) (Toast notifications)
* **Routing**: [React Router DOM v7](https://reactrouter.com/)

---

## 📁 Cấu Trúc Thư Mục Frontend

```text
frontend/
├── src/
│   ├── assets/               # Hình ảnh và tài nguyên tĩnh
│   ├── components/           # Các component React tái sử dụng
│   │   ├── admin/            # Component giao diện Admin (Topbar, Sidebar, navItems,...)
│   │   ├── ui/               # Các block UI nền tảng (button, input, card, dialog,...)
│   │   └── ConfirmDialog.tsx # Hộp thoại xác nhận (sử dụng custom useConfirm hook toàn cục)
│   ├── hooks/                # Custom React Hooks (useAuth, useTheme, useRoomSocket)
│   ├── lib/                  # Tiện ích và cấu hình client API
│   │   ├── api.ts            # Wrapper Fetch API tự động chèn Token (tự động phát hiện & hỗ trợ FormData)
│   │   └── utils.ts          # Các hàm hỗ trợ định dạng lớp CSS
│   ├── pages/                # Các trang chính của ứng dụng
│   │   ├── admin/            # Các trang phân hệ quản trị
│   │   │   ├── Dashboard.tsx     # Trang chủ thống kê tổng quan
│   │   │   ├── Audio.tsx         # [NEW] Quản lý bài nghe tiếng Anh, tải file lên Cloudflare R2
│   │   │   ├── Users.tsx         # Quản lý tài khoản Admin
│   │   │   └── ...
│   │   ├── LoginPage.tsx     # Trang đăng nhập của quản trị viên
│   │   └── NotFound.tsx      # Trang hiển thị khi sai đường dẫn
│   ├── types.ts              # Định nghĩa toàn bộ TypeScript Interfaces
│   ├── App.tsx               # Cấu hình Routing chính và Provider (đã đăng ký route /admin/audio)
│   ├── main.tsx              # Điểm khởi tạo ứng dụng React
│   └── index.css             # Cấu hình Tailwind CSS và font chữ toàn cục
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Local

### 1. Cài Đặt Thư Viện
Truy cập vào thư mục `frontend/` và chạy lệnh cài đặt:
```bash
npm install
```

### 2. Khởi Chạy Server Phát Triển (Dev Server)
Khởi động dự án ở chế độ local dev:
```bash
npm run dev
```
Ứng dụng sẽ chạy tại địa chỉ: [http://localhost:5173](http://localhost:5173).

### 3. Cấu hình Proxy kết nối Backend
Trong tệp `vite.config.ts`, hệ thống đã thiết lập sẵn cơ chế **Vite Proxy** để chuyển tiếp tất cả các yêu cầu có tiền tố `/api` hoặc kết nối WebSocket về phía backend local:
```typescript
server: {
  proxy: {
    "/api": {
      target: "http://127.0.0.1:8000",
      changeOrigin: true,
      ws: true,
    },
  },
}
```

---

## 🌟 Các Phân Hệ Quản Trị Chính (Admin Dashboard)

### 1. Quản Lý Bài Nghe Tiếng Anh (`Audio`) [NEW]
* **Tải lên bài học mới**: Form nhập tiêu đề bài học và kéo thả hoặc chọn file âm thanh từ thiết bị để tải lên Cloudflare R2 thông qua API backend.
* **Nghe thử trực quan**: Tích hợp trình chơi nhạc trực tiếp sử dụng thẻ HTML5 Audio cho phép Admin nghe trước các bài nghe đã tải lên.
* **Xóa bài học**: Sử dụng hook `useConfirm` hiển thị hộp thoại xác nhận hủy bản ghi trong database và file vật lý trên Cloudflare R2 một cách đồng bộ, an toàn.



---

## 🔒 Bảo Mật & Phân Quyền (Authentication)

* Hệ thống sử dụng cơ chế xác thực session token được lưu trữ ở `localStorage`.
* Khi truy cập các trang `/admin/*`, component `ProtectedRoute` sẽ kiểm tra token, nếu chưa xác thực hoặc token hết hạn sẽ tự động chuyển hướng người dùng về trang `/login`.
