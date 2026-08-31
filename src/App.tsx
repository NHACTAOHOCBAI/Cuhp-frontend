import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/hooks/useAuth"

function ReconstructionPage() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-50 p-6 text-center dark:bg-zinc-950">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Workspace Ready for New UI
      </h1>
      <p className="mt-2 text-zinc-500 dark:text-zinc-400">
        All old UI code, custom components, and views have been wiped out.
      </p>
      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Preserved Structures:</h2>
        <ul className="mt-2 list-disc pl-5 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
          <li>Tech Stack: React 19, Vite, Tailwind CSS v4, React Router 7</li>
          <li>Auth Logic: <code>useAuth</code> context</li>
          <li>API Helper: <code>apiFetch</code></li>
          <li>Types: <code>src/types.ts</code></li>
          <li>Features directories: <code>audio</code>, <code>gym</code>, <code>habits</code>, <code>reading</code>, <code>todos</code>, <code>vocabulary</code></li>
        </ul>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ReconstructionPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}