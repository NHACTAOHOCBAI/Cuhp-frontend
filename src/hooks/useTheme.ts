import * as React from "react"

type Theme = "light" | "dark"

const STORAGE_KEY = "theme"

function readInitialTheme(): Theme {
  if (typeof window === "undefined") return "light"
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  if (stored === "light" || stored === "dark") return stored
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

function applyTheme(theme: Theme) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark")
  } else {
    document.documentElement.classList.remove("dark")
  }
}

export function useTheme() {
  const [theme, setTheme] = React.useState<Theme>(readInitialTheme)

  // Apply on mount in case stored value differs from current class
  React.useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggle = React.useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark"
      localStorage.setItem(STORAGE_KEY, next)
      applyTheme(next)
      return next
    })
  }, [])

  return { theme, isDark: theme === "dark", toggle, setTheme }
}