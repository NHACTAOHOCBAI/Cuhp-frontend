import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/hooks/useAuth"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { Toaster } from "@/components/ui/sonner"
import { ConfirmDialogHost } from "@/components/ConfirmDialog"
import LoginPage from "@/pages/LoginPage"
import NotFound from "@/pages/NotFound"
import Dashboard from "@/pages/admin/Dashboard"
import Users from "@/pages/admin/Users"
import AudioPage from "@/pages/admin/Audio"
import AudioDetailPage from "@/pages/admin/AudioDetail"
import VocabularyPage from "@/pages/admin/Vocabulary"

export default function App() {
  return (
    <AuthProvider>
      <Toaster />
      <ConfirmDialogHost />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="audio" element={<AudioPage />} />
            <Route path="audio/:id" element={<AudioDetailPage />} />
            <Route path="vocabulary" element={<VocabularyPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}