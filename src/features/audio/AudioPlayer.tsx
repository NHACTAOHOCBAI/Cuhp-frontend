/**
 * Self-contained HTML5 audio player.
 * Layout:
 *   - optional title
 *   - seek bar (full width) + time row
 *   - controls row: transport (left) + settings (right)
 *
 * On mobile (< sm), speed + volume collapse into a Settings popover.
 */
import * as React from "react"
import {
  Gauge,
  Pause,
  Play,
  Settings,
  RotateCcw,
  RotateCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { PLAYBACK_RATES } from "./types"

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

/**
 * Tiny self-contained popover (mobile-only for now).
 * Anchored to its trigger with absolute positioning relative to the wrapping container.
 */
function MobileSettings({
  playbackRate,
  setPlaybackRate,
}: {
  playbackRate: number
  setPlaybackRate: (n: number) => void
}) {
  const [open, setOpen] = React.useState(false)
  const wrapRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={wrapRef} className="relative sm:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((o) => !o)}
        aria-label="Cài đặt phát"
        aria-expanded={open}
        title="Cài đặt phát"
        className="h-10 w-10"
      >
        <Settings className="h-4 w-4" />
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Cài đặt phát"
          className="absolute right-0 bottom-full mb-2 z-50 w-64 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg p-4 space-y-4 animate-in fade-in-0 zoom-in-95"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Tốc độ phát
            </label>
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <Select
                value={String(playbackRate)}
                onChange={(v) => setPlaybackRate(Number(v))}
                options={PLAYBACK_RATES.map((r) => ({
                  value: String(r),
                  label: `${r}x`,
                }))}
                ariaLabel="Tốc độ phát"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function AudioPlayer({
  src,
  title,
  className,
}: {
  src: string
  title?: string
  className?: string
}) {
  const audioRef = React.useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [playbackRate, setPlaybackRate] = React.useState<number>(1)

  // Wire DOM events
  React.useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => setIsPlaying(false)
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoaded = () => setDuration(audio.duration)
    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)
    audio.addEventListener("ended", onEnded)
    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("loadedmetadata", onLoaded)
    return () => {
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
      audio.removeEventListener("ended", onEnded)
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("loadedmetadata", onLoaded)
    }
  }, [])

  // Keep audio element in sync with state
  React.useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.playbackRate = playbackRate
  }, [playbackRate])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      void audio.play().catch(() => {
        /* Autoplay blocked or load error */
      })
    } else {
      audio.pause()
    }
  }

  const seek = (next: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(next, duration || next))
    setCurrentTime(audio.currentTime)
  }

  const onSeekInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value))
  }

  const skip = (delta: number) => {
    seek(currentTime + delta)
  }

  const hasDuration = duration > 0

  return (
    <div className={cn("w-full space-y-4", className)}>
      <audio ref={audioRef} src={src} preload="metadata" crossOrigin="anonymous" />

      {title && (
        <p className="text-sm font-semibold text-foreground truncate" title={title}>
          {title}
        </p>
      )}

      {/* Seek bar (full width) + time row */}
      <div className="space-y-1.5">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={onSeekInput}
          aria-label="Thanh tua"
          className="w-full h-1.5 cursor-pointer slider-premium"
          disabled={!hasDuration}
          style={{ '--seek-percent': `${duration ? (currentTime / duration) * 100 : 0}%` } as React.CSSProperties}
        />
        <div className="flex justify-between text-xs text-muted-foreground/80 font-mono tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls row: transport (left) + settings (right) */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {/* Transport group (left) */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => skip(-10)}
            disabled={!hasDuration}
            aria-label="Tua lùi 10 giây"
            title="Tua lùi 10 giây"
            className="h-9 w-9 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground active:scale-90 transition-transform duration-150"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            onClick={togglePlay}
            disabled={!hasDuration}
            size="icon"
            aria-label={isPlaying ? "Tạm dừng" : "Phát"}
            title={isPlaying ? "Tạm dừng" : "Phát"}
            className="h-11 w-11 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground shadow-md hover:shadow-lg active:scale-95 transition-all duration-200"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => skip(10)}
            disabled={!hasDuration}
            aria-label="Tua tiến 10 giây"
            title="Tua tiến 10 giây"
            className="h-9 w-9 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground active:scale-90 transition-transform duration-150"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Settings group (right) — desktop ≥ sm */}
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          {/* Playback rate */}
          <div className="flex items-center gap-1.5">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <div className="w-24">
              <Select
                value={String(playbackRate)}
                onChange={(v) => setPlaybackRate(Number(v))}
                options={PLAYBACK_RATES.map((r) => ({
                  value: String(r),
                  label: `${r}x`,
                }))}
                ariaLabel="Tốc độ phát"
              />
            </div>
          </div>
        </div>

        {/* Settings popover (mobile < sm) */}
        <MobileSettings
          playbackRate={playbackRate}
          setPlaybackRate={setPlaybackRate}
        />
      </div>
    </div>
  )
}