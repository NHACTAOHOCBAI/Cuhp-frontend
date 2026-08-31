import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useTodosQuery, useToggleTodo } from "@/features/todos/hooks"
import { useGymExercisesQuery } from "@/features/gym/hooks"
import { useVocabulariesQuery } from "@/features/vocabulary/hooks"
import {
  Flame,
  Dumbbell,
  Languages,
  CheckSquare,
  Plus,
  Play,
  Check,
  ChevronRight,
  TrendingUp,
} from "lucide-react"

export default function Hub() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toggleTodoMutation = useToggleTodo()

  // Format today's date to YYYY-MM-DD in local time
  const todayStr = React.useMemo(() => {
    return new Date().toLocaleDateString("sv-SE")
  }, [])

  // 1. Gym query (Exercises for today)
  const { data: gymExercises, isLoading: isGymLoading } = useGymExercisesQuery(todayStr)

  // 2. Vocabulary query (due cards count)
  const { data: vocabResponse, isLoading: isVocabLoading } = useVocabulariesQuery({
    due: true,
    page_size: 1, // We only care about the total count
  })

  // 3. Todos query (tasks from matrix)
  const { data: todosResponse, isLoading: isTodosLoading } = useTodosQuery({
    scope: "today",
    show_completed: true,
  })

  // Calculations for daily target progress (Activity Ring)
  const totalTarget = user?.daily_target ?? 10
  const completedTarget = user?.words_reviewed_today ?? 0
  const targetPercent = Math.min(
    totalTarget > 0 ? Math.round((completedTarget / totalTarget) * 100) : 0,
    100
  )

  // Filter tasks to show top 3 open/priority tasks
  const priorityTasks = React.useMemo(() => {
    if (!todosResponse?.items) return []
    // Sort so incomplete are first, then completed
    return [...todosResponse.items]
      .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1))
      .slice(0, 3)
  }, [todosResponse])

  // Get active gym category based on exercises
  const gymCategoryName = React.useMemo(() => {
    if (!gymExercises || gymExercises.length === 0) return null
    // Return category name from first exercise or default
    return gymExercises[0].category?.name || "Workout"
  }, [gymExercises])

  // Calculate gym duration or completed/total count
  const gymProgressText = React.useMemo(() => {
    if (!gymExercises || gymExercises.length === 0) return "Rest Day"
    const completed = gymExercises.filter((e) => e.completed).length
    return `${completed}/${gymExercises.length} Exercises`
  }, [gymExercises])

  // Circular progress ring calculation
  const radius = 60
  const strokeWidth = 12
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (targetPercent / 100) * circumference

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <header className="mt-4 mb-6">
        <h1 className="font-sora font-bold text-3xl mb-2 text-[#201B1E] tracking-tight">The Hub</h1>
        <p className="font-outfit font-normal text-base text-[#706065]">
          Welcome back to your structured serenity.
        </p>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-[24px]">
        {/* Mascot & Streaks Card (Col Span 8) */}
        <div className="glass-card md:col-span-8 flex flex-col md:flex-row items-center gap-[48px] bg-white border border-[#E5DFE2] rounded-[24px] p-6 shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] hover:translate-y-[-2px] hover:shadow-[0_15px_35px_-5px_rgba(239,188,213,0.25)] transition-all duration-300">
          <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 relative">
            <img
              alt="Friendly Mascot"
              className="w-full h-full object-contain"
              src="https://lh3.googleusercontent.com/aida/AEtjO1WWI-4Bez9fReOhkSCuzDtHUG7lv8VKTf8TGY2IKLCIm-FGkyiSxSgNE2Njbwwr0jbra9wkrwTVQuk_MAJJkM_6ZrGHlbtRhPMMYjmPZQ50_zvfpgtkoxkWm9DY2-M93kymnKeqoQmnwHB5FFef0XeWLefcH6i4tdOUmjST5LsaF94YW1rJVQpo_n28A2_Vx7FCVSreph-NFjaSFNXeOm5bEEw6nMoNBCJtcFsWpPEFaE-EApbe713Qm19s"
            />
            {/* Soft decorative glow background */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#efbcd5] opacity-25 rounded-full blur-xl animate-pulse"></div>
          </div>

          <div className="flex-grow text-center md:text-left space-y-4 w-full">
            <div className="flex items-center justify-center md:justify-start gap-2 text-[#7b5268]">
              <Flame className="h-8 w-8 text-[#EFBCD5] fill-[#EFBCD5]" />
              <h2 className="font-sora font-bold text-3xl text-[#1f1a1d] tracking-tight">
                Streak: {user?.current_streak ?? 0} Days
              </h2>
            </div>

            <div className="bg-[#fcf1f5] rounded-2xl p-4 border border-[#d2c2c8] w-full max-w-md mx-auto md:mx-0">
              <div className="flex justify-between items-center mb-2 font-mono text-sm text-[#7b5268] font-semibold">
                <span>Daily vocabulary goal</span>
                <span>{targetPercent}% Completed</span>
              </div>
              <p className="font-sora text-lg font-bold text-[#1f1a1d]">
                {completedTarget} / {totalTarget} words
              </p>
              {/* Slim animated progress bar */}
              <div className="w-full h-2.5 bg-[#eae0e4] rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-[#EFBCD5] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${targetPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Rings Card (Col Span 4) */}
        <div className="glass-card md:col-span-4 flex flex-col justify-center items-center bg-white border border-[#E5DFE2] rounded-[24px] p-6 shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] hover:translate-y-[-2px] hover:shadow-[0_15px_35px_-5px_rgba(239,188,213,0.25)] transition-all duration-300">
          <div className="flex items-center gap-2 w-full mb-6">
            <TrendingUp className="h-5 w-5 text-[#7b5268]" />
            <h3 className="font-sora font-semibold text-xl text-[#4f4449]">Activity</h3>
          </div>

          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* SVG Interactive Progress Circle */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              {/* Background ring */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-[#eae0e4]"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Foreground animated ring */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-[#EFBCD5] transition-all duration-1000 ease-out"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="font-sora text-3xl font-bold text-[#1f1a1d]">
                {targetPercent}%
              </span>
              <span className="font-mono text-xs text-[#7b5268] mt-0.5">of goal</span>
            </div>
          </div>
        </div>

        {/* Gym Card (Col Span 4) */}
        <div className="glass-card md:col-span-4 flex flex-col bg-white border border-[#E5DFE2] rounded-[24px] p-6 shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] hover:translate-y-[-2px] hover:shadow-[0_15px_35px_-5px_rgba(239,188,213,0.25)] transition-all duration-300 min-h-[300px]">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3 text-[#7b5268]">
              <Dumbbell className="h-6 w-6" />
              <h3 className="font-sora font-semibold text-xl text-[#1f1a1d] truncate max-w-[160px]">
                {gymCategoryName || "Gym Schedule"}
              </h3>
            </div>
            <span className="font-mono text-xs bg-[#f2dde2] text-[#7b5268] px-3 py-1 rounded-full font-semibold">
              {gymProgressText}
            </span>
          </div>

          {isGymLoading ? (
            <div className="space-y-4 animate-pulse flex-grow flex flex-col justify-center">
              <div className="h-4 bg-zinc-100 rounded w-3/4"></div>
              <div className="h-4 bg-zinc-100 rounded w-5/6"></div>
              <div className="h-4 bg-zinc-100 rounded w-2/3"></div>
            </div>
          ) : !gymExercises || gymExercises.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center text-[#7b5268] py-8">
              <Dumbbell className="h-10 w-10 text-zinc-300 stroke-[1.5px] mb-2" />
              <p className="text-sm font-semibold">No workouts scheduled today</p>
              <Link
                to="/gym"
                className="mt-4 text-xs font-bold text-[#EFBCD5] flex items-center gap-1 hover:underline"
              >
                <span>Create a new session</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <div className="flex-grow flex flex-col justify-between">
              <ul className="space-y-3">
                {gymExercises.slice(0, 4).map((ex) => (
                  <li
                    key={ex.id}
                    className="flex items-center justify-between pb-3 border-b border-[#eae0e4]/80 last:border-0 last:pb-0"
                  >
                    <span className="font-outfit text-sm text-[#1f1a1d] font-semibold">{ex.name}</span>
                    <span className="font-mono text-xs text-[#7b5268] bg-[#fcf1f5] px-2 py-1 rounded-md border border-[#eae0e4]/50">
                      {ex.sets}x{ex.reps} {ex.weight ? `(${ex.weight}kg)` : ""}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                to="/gym"
                className="mt-4 text-xs font-bold text-[#7b5268] hover:text-[#EFBCD5] flex items-center gap-1 self-end transition-colors"
              >
                <span>View session details</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* English Hub Card (Col Span 4) */}
        <div className="glass-card md:col-span-4 flex flex-col relative overflow-hidden bg-white border border-[#E5DFE2] rounded-[24px] p-6 shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] hover:translate-y-[-2px] hover:shadow-[0_15px_35px_-5px_rgba(239,188,213,0.25)] transition-all duration-300 min-h-[300px]">
          {/* Soft background corner gradient */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#efbcd5]/10 rounded-bl-full pointer-events-none"></div>

          <div className="flex items-center gap-3 text-[#7b5268] mb-6 z-10">
            <Languages className="h-6 w-6" />
            <h3 className="font-sora font-semibold text-xl text-[#1f1a1d]">English Hub</h3>
          </div>

          <div className="flex-grow flex flex-col justify-between">
            <div className="text-center pt-4">
              <p className="font-mono text-xs text-[#7b5268] uppercase tracking-wider mb-1">
                Leitner cards due for review
              </p>
              <h4 className="font-sora font-bold text-2xl text-[#1f1a1d]">
                {isVocabLoading ? "..." : `${vocabResponse?.total ?? 0} cards`}
              </h4>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => navigate("/english")}
                className="bg-[#efbcd5] text-[#201B1E] w-full py-3 rounded-2xl font-sora text-base font-bold hover:opacity-90 active:scale-[0.98] transition-all border border-[#ffd8ea] flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Start Review</span>
                <Play className="h-4 w-4 fill-[#201B1E]" />
              </button>

              <div className="flex items-center justify-center gap-3 text-xs font-semibold text-[#7b5268]">
                <Link to="/english/reading" className="hover:text-[#EFBCD5] hover:underline">
                  Reading
                </Link>
                <span className="w-1.5 h-1.5 bg-[#E5DFE2] rounded-full"></span>
                <Link to="/english/audio" className="hover:text-[#EFBCD5] hover:underline">
                  Listening
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Card (Col Span 4) */}
        <div className="glass-card md:col-span-4 flex flex-col bg-white border border-[#E5DFE2] rounded-[24px] p-6 shadow-[0_10px_30px_-5px_rgba(239,188,213,0.15)] hover:translate-y-[-2px] hover:shadow-[0_15px_35px_-5px_rgba(239,188,213,0.25)] transition-all duration-300 min-h-[300px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 text-[#7b5268]">
              <CheckSquare className="h-6 w-6" />
              <h3 className="font-sora font-semibold text-xl text-[#1f1a1d]">Priority Tasks</h3>
            </div>
            <button
              onClick={() => navigate("/todo")}
              className="text-[#EFBCD5] hover:bg-[#fcf1f5] p-1.5 rounded-full border border-transparent hover:border-[#eae0e4] transition-all active:scale-90"
              title="Add task"
            >
              <Plus className="h-5 w-5 stroke-[2.5px]" />
            </button>
          </div>

          {isTodosLoading ? (
            <div className="space-y-4 animate-pulse flex-grow flex flex-col justify-center">
              <div className="h-4 bg-zinc-100 rounded w-full"></div>
              <div className="h-4 bg-zinc-100 rounded w-5/6"></div>
              <div className="h-4 bg-zinc-100 rounded w-11/12"></div>
            </div>
          ) : priorityTasks.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center text-[#7b5268] py-8">
              <CheckSquare className="h-10 w-10 text-zinc-300 stroke-[1.5px] mb-2" />
              <p className="text-sm font-semibold">All tasks completed!</p>
              <Link
                to="/todo"
                className="mt-4 text-xs font-bold text-[#EFBCD5] flex items-center gap-1 hover:underline"
              >
                <span>View task board</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <div className="flex-grow flex flex-col justify-between">
              <ul className="space-y-3">
                {priorityTasks.map((task) => (
                  <li
                    key={task.id}
                    onClick={() => toggleTodoMutation.mutate(task.id)}
                    className="flex items-start gap-3 group cursor-pointer"
                  >
                    <div
                      className={`mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        task.completed
                          ? "bg-[#EFBCD5] border-[#EFBCD5]"
                          : "border-[#d2c2c8] group-hover:border-[#EFBCD5]"
                      }`}
                    >
                      {task.completed && <Check className="h-3.5 w-3.5 text-white stroke-[3px]" />}
                    </div>
                    <span
                      className={`font-outfit text-sm leading-snug pt-0.5 transition-colors ${
                        task.completed
                          ? "text-[#7b5268] line-through decoration-[#d2c2c8]"
                          : "text-[#1f1a1d] group-hover:text-[#7b5268]"
                      }`}
                    >
                      {task.title}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                to="/todo"
                className="mt-4 text-xs font-bold text-[#7b5268] hover:text-[#EFBCD5] flex items-center gap-1 self-end transition-colors"
              >
                <span>View plan details</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
