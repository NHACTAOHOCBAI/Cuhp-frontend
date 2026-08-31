import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/hooks/useAuth"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import Layout from "@/components/Layout"
import Hub from "@/pages/Hub"
import Login from "@/pages/Login"
import Gym from "@/pages/Gym"
import EnglishLayout from "@/components/EnglishLayout"
import EnglishVocabularies from "@/pages/EnglishVocabularies"
import EnglishAnalytics from "@/pages/EnglishAnalytics"
import EnglishReadingList from "@/pages/EnglishReadingList"
import EnglishReadingDetail from "@/pages/EnglishReadingDetail"
import EnglishAudioLibrary from "@/pages/EnglishAudioLibrary"
import EnglishShadowingDetail from "@/pages/EnglishShadowingDetail"
import Tasks from "@/pages/Tasks"
import Habits from "@/pages/Habits"

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
          
          {/* Nested English Hub Layout and Routes */}
          <Route
            path="/english"
            element={
              <ProtectedRoute>
                <Layout>
                  <EnglishLayout />
                </Layout>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="vocabularies" replace />} />
            <Route path="vocabularies" element={<EnglishVocabularies />} />
            <Route path="reading" element={<EnglishReadingList />} />
            <Route path="reading/:id" element={<EnglishReadingDetail />} />
            <Route path="listening" element={<EnglishAudioLibrary />} />
            <Route path="listening/:id" element={<EnglishShadowingDetail />} />
            <Route path="analytics" element={<EnglishAnalytics />} />
          </Route>
          <Route
            path="/todo"
            element={
              <ProtectedRoute>
                <Layout>
                  <Tasks />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/habits"
            element={
              <ProtectedRoute>
                <Layout>
                  <Habits />
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