import * as React from "react"
import { Link } from "react-router-dom"
import { X, BookOpen, Music, GraduationCap, Quote } from "lucide-react"

const MOTIVATIONAL_TIPS = [
  "Bôi đen bất kỳ từ tiếng Anh nào trên bài đọc hoặc transcript bài nghe để tra YouGlish hoặc thêm vào từ điển nhé! 💡",
  "Học tiếng Anh đều đặn 15 phút mỗi ngày hiệu quả hơn là học 2 tiếng một tuần. ⏳",
  "Hãy tận dụng tính năng 'Nghe thử nhanh' ở chế độ xem Lưới để luyện nghe thụ động nhé! 🎧",
  "Đọc nhiều và dịch lại sẽ giúp bạn tăng phản xạ ngữ pháp và từ vựng nhanh nhất. 📖",
  "Thêm từ mới vào sổ từ vựng và thường xuyên ôn tập để nhớ lâu hơn! 🗂️",
]

export function MascotAssistant() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [tip, setTip] = React.useState("")

  React.useEffect(() => {
    // Pick a random tip when opened
    if (isOpen) {
      const randomTip = MOTIVATIONAL_TIPS[Math.floor(Math.random() * MOTIVATIONAL_TIPS.length)]
      setTip(randomTip)
    }
  }, [isOpen])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end select-none">
      {/* Speech Bubble Popup */}
      {isOpen && (
        <div className="mb-3 w-80 bg-popover text-popover-foreground border border-border shadow-2xl rounded-2xl p-4 animate-in fade-in-0 slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between mb-2 pb-2 border-b border-border/60">
            <div className="flex items-center gap-1.5 text-primary font-bold text-sm">
              <GraduationCap className="h-4 w-4" /> Trợ lý học tập
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground cursor-pointer rounded-full p-0.5 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="bg-muted/40 rounded-xl p-3 text-xs leading-relaxed text-foreground/90 italic flex gap-2">
              <Quote className="h-4 w-4 text-primary shrink-0 opacity-70" />
              <span>{tip}</span>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Truy cập nhanh</p>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/admin/reading"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-1.5 p-2 rounded-lg bg-card border border-border hover:border-primary/40 hover:bg-primary/5 text-xs font-semibold text-foreground transition-all"
                >
                  <BookOpen className="h-3.5 w-3.5 text-primary" /> Luyện dịch
                </Link>
                <Link
                  to="/admin/audio"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-1.5 p-2 rounded-lg bg-card border border-border hover:border-primary/40 hover:bg-primary/5 text-xs font-semibold text-foreground transition-all"
                >
                  <Music className="h-3.5 w-3.5 text-primary" /> Luyện nghe
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Mascot Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-16 w-16 flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-300 relative select-none active:scale-95 group focus-visible:outline-none"
        title="Trợ lý học tập"
      >
        <img
          src="/image-3.png"
          alt="Mascot Assistant"
          className="h-16 w-auto object-contain group-hover:rotate-6 transition-transform duration-300 drop-shadow-md"
        />
        {/* Cute online dot indicator */}
        <span className="absolute bottom-1 right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-background"></span>
        </span>
      </button>
    </div>
  )
}
