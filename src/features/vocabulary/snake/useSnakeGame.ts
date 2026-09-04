import { useState, useEffect, useCallback, useRef } from "react"
import { apiFetch } from "@/lib/api"
import type { VocabularyItem } from "@/types"
import { soundManager } from "./soundEffects"

export type Position = { x: number; y: number }
export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT"
export type GameStatus = "IDLE" | "PLAYING" | "PAUSED" | "VICTORY" | "GAME_OVER"

export interface FoodItem {
  position: Position
  vocab: VocabularyItem
  isCorrect: boolean
}

export interface SnakeGameStatsResponse {
  high_score: number
  max_combo: number
  total_games: number
  total_wins: number
}

const GRID_SIZE = 20
const INITIAL_SPEED = 140

export function useSnakeGame(userVocabularies: VocabularyItem[], token?: string) {
  const [status, setStatus] = useState<GameStatus>("IDLE")
  const [snake, setSnake] = useState<Position[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ])
  const [direction, setDirection] = useState<Direction>("UP")
  const nextDirectionRef = useRef<Direction>("UP")

  const [lives, setLives] = useState<number>(3)
  const [score, setScore] = useState<number>(0)
  const [combo, setCombo] = useState<number>(1)
  const [maxCombo, setMaxCombo] = useState<number>(1)
  const [screenShake, setScreenShake] = useState<boolean>(false)

  // Words tracking
  const [remainingVocab, setRemainingVocab] = useState<VocabularyItem[]>([])
  const [currentPrompt, setCurrentPrompt] = useState<VocabularyItem | null>(null)
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [correctWordsCount, setCorrectWordsCount] = useState<number>(0)
  const [wrongWordsList, setWrongWordsList] = useState<VocabularyItem[]>([])
  const [collectedWordsList, setCollectedWordsList] = useState<VocabularyItem[]>([])

  // Backend stats
  const [highScore, setHighScore] = useState<number>(0)

  // Fetch High Score from backend
  useEffect(() => {
    if (!token) return
    apiFetch<SnakeGameStatsResponse>("/snake/stats", { token })
      .then((data) => {
        if (data && data.high_score !== undefined) {
          setHighScore(data.high_score)
        }
      })
      .catch(() => {})
  }, [token])

  // Helper to generate food placements
  const generateFoods = useCallback(
    (targetVocab: VocabularyItem, allVocab: VocabularyItem[], currentSnake: Position[]): FoodItem[] => {
      // Pick 2 distractors (other vocabularies)
      const distractors = allVocab.filter((v) => v.id !== targetVocab.id)
      // Shuffle distractors
      const shuffled = [...distractors].sort(() => 0.5 - Math.random())
      const selectedDistractors = shuffled.slice(0, 2)

      const roundVocabs = [
        { vocab: targetVocab, isCorrect: true },
        ...selectedDistractors.map((v) => ({ vocab: v, isCorrect: false })),
      ].sort(() => 0.5 - Math.random())

      const occupied = new Set(currentSnake.map((p) => `${p.x},${p.y}`))
      const head = currentSnake[0]
      const foodItems: FoodItem[] = []

      // Helper to check if a position is too close to snake head (<= 3 steps away)
      const isTooCloseToHead = (p: Position): boolean => {
        if (!head) return false
        return Math.abs(p.x - head.x) + Math.abs(p.y - head.y) <= 3
      }

      for (const item of roundVocabs) {
        let pos: Position
        let attempts = 0
        do {
          pos = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
          }
          attempts++
        } while (
          (occupied.has(`${pos.x},${pos.y}`) ||
            foodItems.some((f) => f.position.x === pos.x && f.position.y === pos.y) ||
            (attempts < 100 && isTooCloseToHead(pos))) &&
          attempts < 200
        )

        foodItems.push({
          position: pos,
          vocab: item.vocab,
          isCorrect: item.isCorrect,
        })
      }

      return foodItems
    },
    []
  )

  // Submit session to backend
  const submitSession = useCallback(
    async (isWin: boolean, finalScore: number, finalMaxCombo: number, correctCount: number, wrongCount: number) => {
      if (!token) return
      try {
        const data = await apiFetch<SnakeGameStatsResponse>("/snake/session", {
          method: "POST",
          token,
          body: JSON.stringify({
            score: finalScore,
            max_combo: finalMaxCombo,
            is_win: isWin,
            correct_words_count: correctCount,
            wrong_words_count: wrongCount,
          }),
        })
        if (data && data.high_score > highScore) {
          setHighScore(data.high_score)
        }
      } catch (err) {
        console.error("Failed to submit snake session:", err)
      }
    },
    [token, highScore]
  )

  // Start new game session
  const startGame = useCallback(() => {
    if (!userVocabularies || userVocabularies.length === 0) return

    const shuffled = [...userVocabularies].sort(() => 0.5 - Math.random())
    const initialPrompt = shuffled[0]
    const initialSnake: Position[] = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ]

    setSnake(initialSnake)
    setDirection("UP")
    nextDirectionRef.current = "UP"
    setLives(3)
    setScore(0)
    setCombo(1)
    setMaxCombo(1)
    setCorrectWordsCount(0)
    setWrongWordsList([])
    setCollectedWordsList([])

    setRemainingVocab(shuffled)
    setCurrentPrompt(initialPrompt)

    const initialFoods = generateFoods(initialPrompt, userVocabularies, initialSnake)
    setFoods(initialFoods)
    setStatus("PLAYING")
  }, [userVocabularies, generateFoods])

  const pauseGame = useCallback(() => {
    if (status === "PLAYING") setStatus("PAUSED")
    else if (status === "PAUSED") setStatus("PLAYING")
  }, [status])

  const changeDirection = useCallback((newDir: Direction) => {
    const current = nextDirectionRef.current
    if (
      (newDir === "UP" && current !== "DOWN") ||
      (newDir === "DOWN" && current !== "UP") ||
      (newDir === "LEFT" && current !== "RIGHT") ||
      (newDir === "RIGHT" && current !== "LEFT")
    ) {
      nextDirectionRef.current = newDir
    }
  }, [])

  // Keyboard input listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== "PLAYING") return
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          " ",
          "w",
          "W",
          "s",
          "S",
          "a",
          "A",
          "d",
          "D",
        ].includes(e.key)
      ) {
        e.preventDefault()
      }
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          changeDirection("UP")
          break
        case "ArrowDown":
        case "s":
        case "S":
          changeDirection("DOWN")
          break
        case "ArrowLeft":
        case "a":
        case "A":
          changeDirection("LEFT")
          break
        case "ArrowRight":
        case "d":
        case "D":
          changeDirection("RIGHT")
          break
        case " ":
          pauseGame()
          break
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [status, changeDirection, pauseGame])

  // Game Loop tick
  useEffect(() => {
    if (status !== "PLAYING" || !currentPrompt) return

    const timer = setInterval(() => {
      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] }
        const currentDir = nextDirectionRef.current
        setDirection(currentDir)

        if (currentDir === "UP") head.y -= 1
        if (currentDir === "DOWN") head.y += 1
        if (currentDir === "LEFT") head.x -= 1
        if (currentDir === "RIGHT") head.x += 1

        // 1. Check Wall Collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          handleHitHazard("hit_wall")
          return prevSnake
        }

        // 2. Check Self Collision
        if (prevSnake.some((seg) => seg.x === head.x && seg.y === head.y)) {
          handleHitHazard("hit_self")
          return prevSnake
        }

        // 3. Check Food Collision
        const eatenIndex = foods.findIndex((f) => f.position.x === head.x && f.position.y === head.y)

        if (eatenIndex !== -1) {
          const eatenFood = foods[eatenIndex]

          if (eatenFood.isCorrect) {
            // EAT CORRECT FOOD
            soundManager.playEatSound()
            const newScore = score + 100 * combo
            const newCombo = combo + 1
            const newMaxCombo = Math.max(maxCombo, newCombo)
            const newCorrectCount = correctWordsCount + 1

            setScore(newScore)
            setCombo(newCombo)
            setMaxCombo(newMaxCombo)
            setCorrectWordsCount(newCorrectCount)
            setCollectedWordsList((prev) => [currentPrompt, ...prev])

            // Remove target word from remaining
            const newRemaining = remainingVocab.filter((v) => v.id !== currentPrompt.id)
            setRemainingVocab(newRemaining)

            if (newRemaining.length === 0) {
              // VICTORY! Cleared all words in DB
              soundManager.playVictorySound()
              setStatus("VICTORY")
              submitSession(true, newScore, newMaxCombo, newCorrectCount, wrongWordsList.length)
              return [head, ...prevSnake]
            } else {
              // Spawn next prompt
              const nextPrompt = newRemaining[Math.floor(Math.random() * newRemaining.length)]
              setCurrentPrompt(nextPrompt)
              const newSnake = [head, ...prevSnake]
              setFoods(generateFoods(nextPrompt, userVocabularies, newSnake))
              return newSnake
            }
          } else {
            // EAT WRONG FOOD
            soundManager.playWrongSound()
            triggerScreenShake()
            setWrongWordsList((prev) => [...prev, eatenFood.vocab])

            setCombo(1)
            const nextLives = lives - 1
            setLives(nextLives)

            if (nextLives <= 0) {
              soundManager.playGameOverSound()
              setStatus("GAME_OVER")
              submitSession(false, score, maxCombo, correctWordsCount, wrongWordsList.length + 1)
              return prevSnake
            } else {
              // Respawn foods for same prompt
              const newSnake = [head, ...prevSnake.slice(0, -1)]
              setFoods(generateFoods(currentPrompt, userVocabularies, newSnake))
              return newSnake
            }
          }
        }

        // Normal movement
        return [head, ...prevSnake.slice(0, -1)]
      })
    }, INITIAL_SPEED)

    return () => clearInterval(timer)
  }, [
    status,
    currentPrompt,
    foods,
    combo,
    maxCombo,
    score,
    lives,
    remainingVocab,
    correctWordsCount,
    wrongWordsList,
    userVocabularies,
    generateFoods,
    submitSession,
  ])

  const handleHitHazard = (_reason: string) => {
    soundManager.playWrongSound()
    triggerScreenShake()
    const nextLives = lives - 1
    setLives(nextLives)
    setCombo(1)

    if (nextLives <= 0) {
      soundManager.playGameOverSound()
      setStatus("GAME_OVER")
      submitSession(false, score, maxCombo, correctWordsCount, wrongWordsList.length)
    } else {
      // Safe reset position
      setSnake([
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 },
      ])
      nextDirectionRef.current = "UP"
      setDirection("UP")
    }
  }

  const triggerScreenShake = () => {
    setScreenShake(true)
    setTimeout(() => setScreenShake(false), 350)
  }

  return {
    status,
    snake,
    direction,
    lives,
    score,
    combo,
    maxCombo,
    highScore,
    currentPrompt,
    foods,
    remainingCount: remainingVocab.length,
    totalCount: userVocabularies.length,
    correctWordsCount,
    wrongWordsList,
    collectedWordsList,
    screenShake,
    startGame,
    pauseGame,
    changeDirection,
  }
}
