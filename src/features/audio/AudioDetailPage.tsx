/**
 * Detail page for a single audio track.
 *
 * Layout (full width, no max-w):
 *  - Header: title + level/category badges + 1-row metadata pill row
 *  - 2-col grid (desktop): Player (left, sticky on lg+) + Script (right)
 *  - Script has a "Ẩn/Hiện" toggle (persisted to localStorage) for shadowing practice
 */
import * as React from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Calendar,
  Eye,
  EyeOff,
  FileAudio,
  Mic,
  User as UserIcon,
  Search,
  Copy,
  Check,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAudioById } from "./hooks"
import { AudioPlayer } from "./AudioPlayer"
import { CATEGORIES, LEVELS } from "./types"

const LEVEL_LABEL = Object.fromEntries(LEVELS.map((l) => [l.value, l.label]))
const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]))

const SCRIPT_PREF_KEY = "audio:showScript"

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

function PillItem({
  icon: Icon,
  text,
  title,
  truncate = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  text: string
  title?: string
  truncate?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className={truncate ? "truncate max-w-[30ch]" : ""} title={title ?? text}>
        {text}
      </span>
    </span>
  )
}

export function AudioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useAudioById(id)

  // Script visibility preference — persisted across reloads
  const [showScript, setShowScript] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return true
    try {
      return window.localStorage.getItem(SCRIPT_PREF_KEY) !== "0"
    } catch {
      return true
    }
  })

  const [copied, setCopied] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const handleCopy = async () => {
    if (!data?.transcript) return
    try {
      await navigator.clipboard.writeText(data.transcript)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return text
    const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
    const parts = text.split(new RegExp(`(${escapedSearch})`, "gi"))
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/60 rounded px-0.5 text-foreground font-medium">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    )
  }

  React.useEffect(() => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(SCRIPT_PREF_KEY, showScript ? "1" : "0")
    } catch {
      // ignore quota / disabled storage
    }
  }, [showScript])

  if (isLoading) {
    return (
      <div className="w-full p-4 sm:p-6 space-y-6">
        <div className="h-7 w-40 bg-muted rounded animate-pulse" />
        <div className="h-10 w-2/3 bg-muted rounded animate-pulse" />
        <div className="h-40 w-full bg-muted rounded animate-pulse" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="w-full p-4 sm:p-6 space-y-4">
        <Button variant="ghost" onClick={() => navigate("/admin/audio")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại danh sách
        </Button>
        <Card className="shadow-none rounded-md">
          <CardContent className="p-6">
            <p className="text-destructive font-medium">
              {error?.message ?? "Không tìm thấy bài nghe."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const levelLabel = data.level ? LEVEL_LABEL[data.level] ?? data.level : null
  const categoryLabel = data.category
    ? CATEGORY_LABEL[data.category] ?? data.category
    : null

  return (
    <div className="w-full p-4 sm:p-6 space-y-6">
      {/* Top back link */}
      <Link
        to="/admin/audio"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 hover:bg-muted text-muted-foreground hover:text-foreground"
        )}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quay lại danh sách
      </Link>

      {/* Header Info Card */}
      <div className="bg-muted/20 border border-border/50 p-5 sm:p-6 rounded-2xl space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight break-words text-foreground">
            {data.title}
          </h1>
          {(levelLabel || categoryLabel) && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {data.level && (
                <Badge variant="secondary" className="capitalize px-3 py-0.5 font-medium bg-secondary text-secondary-foreground border-transparent shadow-sm">
                  {levelLabel}
                </Badge>
              )}
              {data.category && (
                <Badge variant="outline" className="capitalize px-3 py-0.5 font-medium bg-background text-foreground border-border shadow-sm">
                  {categoryLabel}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Metadata pill row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-muted-foreground border-t border-border/30 pt-3">
          <PillItem icon={UserIcon} text={data.user_id} truncate title={data.user_id} />
          <span aria-hidden className="text-muted-foreground/30">•</span>
          <PillItem icon={Calendar} text={formatDate(data.created_at)} />
          {data.filename && (
            <>
              <span aria-hidden className="text-muted-foreground/30">•</span>
              <PillItem icon={FileAudio} text={data.filename} truncate title={data.filename} />
            </>
          )}
        </div>
      </div>

      {/* Player + Script grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Player (sticky on lg+) */}
        <Card className="lg:sticky lg:top-4 h-fit lg:col-span-5 shadow-none rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Mic className="h-5 w-5 text-primary" />
              Trình phát
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AudioPlayer src={data.url} />
          </CardContent>
        </Card>

        {/* Script */}
        <Card className="lg:col-span-7 shadow-none rounded-md">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0 pb-3 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
              <CardTitle className="text-lg flex items-center gap-2 shrink-0 font-semibold">
                <FileAudio className="h-5 w-5 text-primary" />
                Script / Transcript
              </CardTitle>
              {showScript && data.transcript && (
                <div className="relative w-full sm:max-w-[200px] md:max-w-[240px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Tìm từ khóa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 text-xs bg-muted/40 hover:bg-muted/60 focus:bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {showScript && data.transcript && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  title="Sao chép toàn bộ Script"
                  className="h-8 text-xs hover:bg-muted"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400 animate-in fade-in-0 zoom-in-95" />
                      Đã sao chép
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Sao chép
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowScript((v) => !v)}
                aria-pressed={!showScript}
                aria-label={showScript ? "Ẩn script" : "Hiện script"}
                className="h-8 text-xs hover:bg-muted"
              >
                {showScript ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                    Ẩn
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    Hiện
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {showScript ? (
              data.transcript ? (
                <div className="max-h-[70vh] overflow-y-auto rounded-md border border-input bg-muted/10 p-4 sm:p-5">
                  <pre className="whitespace-pre-wrap break-words font-sans text-[15px] leading-loose text-foreground/90 select-text">
                    {highlightText(data.transcript, searchQuery)}
                  </pre>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Bài nghe này chưa có script. Bạn có thể thêm script bằng cách vào trang quản lý và chỉnh sửa.
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Script đang ẩn — bấm nút <span className="font-medium not-italic">Hiện</span> phía trên để xem nội dung transcript.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}