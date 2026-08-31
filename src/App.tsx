import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom"
import { AuthProvider } from "@/hooks/useAuth"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import Layout from "@/components/Layout"
import Hub from "@/pages/Hub"
import Login from "@/pages/Login"
import Gym from "@/pages/Gym"

function FeaturePlaceholderPage({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-white border border-[#E5DFE2] rounded-[24px] shadow-[0_10px_30px_-5px_rgba(239, 188, 213, 0.15)] max-w-lg mx-auto">
      <h1 className="font-sora font-bold text-2xl text-[#1f1a1d] tracking-tight">{name}</h1>
      <p className="mt-2 text-sm text-[#7b5268] max-w-md">
        Trang này đang trong quá trình tái cấu trúc theo bộ giao diện chuẩn hóa mới. 
      </p>
      <Link
        to="/"
        className="mt-6 px-6 py-2.5 bg-[#EFBCD5] text-[#201B1E] rounded-xl font-sora font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-sm"
      >
        Quay lại trang chủ (Hub)
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public login page */}
          <Route path="/login" element={<Login />} />

          {/* Protected Portal routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Hub />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gym"
            element={
              <ProtectedRoute>
                <Layout>
                  <Gym />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/english"
            element={
              <ProtectedRoute>
                <Layout>
                  <FeaturePlaceholderPage name="English Hub" />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/todo"
            element={
              <ProtectedRoute>
                <Layout>
                  <FeaturePlaceholderPage name="Tasks" />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirects */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}