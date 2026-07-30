# Frontend Admin Dashboard 🍰🎨

Đây là giao diện quản trị Admin Dashboard của hệ thống Tiệm Bánh Ngọt, được xây dựng dưới dạng ứng dụng Single Page Application (SPA) hiện đại, phục vụ việc quản lý phòng chat, duyệt đơn hàng nháp, cấu hình sản phẩm và các trường thông tin tùy chỉnh.

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
│   │   ├── admin/            # Component giao diện Admin (Topbar, Sidebar, DraftOrderCard,...)
│   │   ├── chat/             # ChatPane xử lý luồng nhắn tin và hiển thị danh sách phòng chat
│   │   ├── ui/               # Các block UI nền tảng (button, input, switch, badge, dialog,...)
│   │   └── ConfirmDialog.tsx # Hộp thoại xác nhận toàn cục (thay thế browser alert mặc định)
│   ├── hooks/                # Custom React Hooks
│   │   ├── useAuth.tsx       # Hook quản lý trạng thái đăng nhập, phân quyền người dùng
│   │   ├── useRoomSocket.ts  # Hook quản lý kết nối và đồng bộ tin nhắn qua WebSocket
│   │   └── useTheme.ts       # Hook quản lý chế độ giao diện sáng/tối
│   ├── lib/                  # Tiện ích và cấu hình client API
│   │   ├── api.ts            # Wrapper Fetch API tự động chèn Authorization Bearer token
│   │   └── utils.ts          # Các hàm hỗ trợ định dạng lớp CSS (cn)
│   ├── pages/                # Các trang chính của ứng dụng
│   │   ├── admin/            # Các trang phân hệ quản trị
│   │   │   ├── Dashboard.tsx     # Trang chủ thống kê chung
│   │   │   ├── Conversations.tsx # Phân hệ Chat thời gian thực với khách hàng & cấu hình Chatbot
│   │   │   ├── Orders.tsx        # Duyệt và quản lý Đơn hàng nháp (Draft Orders)
│   │   │   ├── Products.tsx      # Quản lý Danh mục, Dòng bánh (ProductLine) và Sản phẩm
│   │   │   ├── Faqs.tsx          # Thiết lập và chỉnh sửa bộ câu hỏi FAQ của cửa hàng
│   │   │   ├── FieldSettings.tsx # Cấu hình động các trường thông tin điền khi đặt hàng
│   │   │   └── Users.tsx         # Quản lý tài khoản Admin trong hệ thống
│   │   ├── LoginPage.tsx     # Trang đăng nhập của nhân viên
│   │   └── NotFound.tsx      # Trang hiển thị khi sai đường dẫn
│   ├── types.ts              # Định nghĩa toàn bộ TypeScript Interfaces cho dự án
│   ├── App.tsx               # Cấu hình Routing chính và Provider
│   ├── main.tsx              # Điểm khởi tạo ứng dụng React
│   └── index.css             # Cấu hình Tailwind CSS và font chữ toàn cục
├── package.json              # Khai báo thư viện và lệnh chạy dự án
└── vite.config.ts            # Cấu hình Vite (cài đặt proxy API chuyển hướng backend)
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
      ws: true, // Cho phép chuyển tiếp WebSocket
    },
  },
}
```
*Lưu ý*: Hãy đảm bảo server Backend đã được khởi chạy ở cổng `8000` trước khi kết nối.

---

## 🌟 Các Phân Hệ Quản Trị Chính (Admin Dashboard)

### 1. Phân Hệ Chat & Quản Lý Chatbot (`Conversations`)
* **Real-time Chat**: Tự động đồng bộ tin nhắn khách gửi và phản hồi chatbot qua kết nối WebSocket (`useRoomSocket`).
* **Bật/Tắt Chatbot**: Hộp nút Switch ngay trong Header phòng chat cho phép tắt chatbot tự động để chuyển giao hỗ trợ thủ công (hoặc bật lại khi đã giải quyết xong).
* **Trả lời trích dẫn (Message Reply)**:
  - Cho phép click vào icon Reply bên cạnh tin nhắn để trích dẫn tin nhắn gốc.
  - Hiển thị khối trích dẫn trực quan phía trên ô nhập liệu và trong bong bóng chat.
  - Hỗ trợ bấm vào phần trích dẫn để tự động trượt (scroll) nhảy nhanh đến tin nhắn cha trong lịch sử chat.
* **Tách biệt hiển thị**: Tin nhắn gửi bởi Admin/AI được canh phải, tin nhắn của khách hàng canh trái. Hình ảnh gửi kèm hiển thị trực quan và hỗ trợ click xem phóng to (Lightbox).

### 2. Duyệt Đơn Hàng Nháp (`Orders`)
* Hiển thị danh sách các đơn hàng nháp do chatbot tự động thu thập từ khách hàng ở trạng thái `pending`.
* Hiển thị đầy đủ thông tin khách hàng, số điện thoại, địa chỉ, thời gian nhận bánh, chi tiết sản phẩm/combo, tổng tiền và các trường tùy chỉnh động.
* Admin có thể nhanh chóng ấn nút **Duyệt đơn** (`approved`) hoặc **Hủy đơn** (`rejected`). Trạng thái cập nhật tức thì qua WebSocket tới cuộc trò chuyện.

### 3. Quản Lý Sản Phẩm (`Products`)
* Quản lý phân cấp: Danh mục bánh (Category) $\rightarrow$ Dòng bánh (Product Line) $\rightarrow$ Mẫu mã (Size, mã mẫu thiết kế).
* Hỗ trợ gán từ khóa tìm kiếm (`keywords`) cho dòng bánh nhằm hỗ trợ AI nhận diện tốt hơn khi khách nhắn tin tìm kiếm.
* Admin dễ dàng cập nhật giá cả, tải lên ảnh sản phẩm mới lên AWS S3 và chỉnh sửa phí phụ thu (surcharge) của từng mẫu bánh.

### 4. Quản Lý Cấu Hình FAQ (`FAQs`)
* Quản lý cơ sở kiến thức tĩnh của chatbot gồm các cặp Câu hỏi - Câu trả lời.
* Hỗ trợ lưu trữ trực tiếp vào PostgreSQL. Chatbot sẽ dựa vào đây để trả lời các câu hỏi FAQ với độ khớp nội dung lớn hơn 70%.

### 5. Cài Đặt Trường Đơn Hàng (`Field Settings`)
* Cho phép Admin định nghĩa thêm các trường thông tin cần thu thập khi lên đơn (ví dụ: "Chữ viết lên bánh", "Độ ngọt mong muốn", "Ghi chú nến/đĩa").
* Có thể điều chỉnh trường này là bắt buộc (`required`) hoặc ẩn/hiện (`active`). Chatbot sẽ tự động quét cấu hình này để hỏi khách hàng trong lúc xin thông tin thanh toán.

### 6. Quản Lý Quản Trị Viên (`Users`)
* Quản lý danh sách tài khoản được quyền đăng nhập vào Admin Dashboard.
* Ràng buộc chỉ có tài khoản có quyền `admin` mới được tạo thêm/sửa đổi thông tin nhân viên khác.

---

## 🔒 Bảo Mật & Phân Quyền (Authentication)

* Hệ thống sử dụng cơ chế xác thực JWT Token lưu trữ ở `localStorage`.
* Khi truy cập các trang `/admin/*`, component `ProtectedRoute` sẽ kiểm tra token, nếu chưa xác thực sẽ tự động chuyển hướng người dùng về trang `/login`.
* Toàn bộ luồng khách hàng (customer chat) đã được tối ưu hóa tích hợp chung vào phân hệ quản trị tập trung nên toàn bộ người dùng có tài khoản hợp lệ đều được điều hướng trực tiếp tới giao diện Admin.
