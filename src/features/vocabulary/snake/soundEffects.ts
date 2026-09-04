// Web Audio API Sound Effects Synthesizer for Word Snake Game

class SoundManager {
  private ctx: AudioContext | null = null
  public enabled: boolean = true

  private initCtx() {
    try {
      if (!this.ctx && typeof window !== "undefined") {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (AudioCtx) {
          this.ctx = new AudioCtx()
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {})
      }
    } catch (e) {
      console.warn("AudioContext init warning:", e)
    }
  }

  // Play a pleasant chime tone when correctly eating a word food
  playEatSound() {
    if (!this.enabled) return
    try {
      this.initCtx()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = "sine"
      osc.frequency.setValueAtTime(523.25, now) // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12) // G5

      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.25)
    } catch {
      // ignore audio errors
    }
  }

  // Play a low buzz warning tone when eating wrong word food
  playWrongSound() {
    if (!this.enabled) return
    try {
      this.initCtx()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(180, now)
      osc.frequency.linearRampToValueAtTime(110, now + 0.3)

      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.3)
    } catch {
      // ignore audio errors
    }
  }

  // Play fanfare melody when winning the game (cleared all words in DB)
  playVictorySound() {
    if (!this.enabled) return
    try {
      this.initCtx()
      if (!this.ctx) return

      const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
      const now = this.ctx.currentTime

      notes.forEach((freq, idx) => {
        if (!this.ctx) return
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        const start = now + idx * 0.12

        osc.type = "triangle"
        osc.frequency.setValueAtTime(freq, start)

        gain.gain.setValueAtTime(0.2, start)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3)

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start(start)
        osc.stop(start + 0.3)
      })
    } catch {
      // ignore audio errors
    }
  }

  // Play descending sad tone when running out of lives
  playGameOverSound() {
    if (!this.enabled) return
    try {
      this.initCtx()
      if (!this.ctx) return

      const notes = [440, 392, 349.23, 293.66] // A4, G4, F4, D4
      const now = this.ctx.currentTime

      notes.forEach((freq, idx) => {
        if (!this.ctx) return
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        const start = now + idx * 0.15

        osc.type = "sawtooth"
        osc.frequency.setValueAtTime(freq, start)

        gain.gain.setValueAtTime(0.18, start)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35)

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start(start)
        osc.stop(start + 0.35)
      })
    } catch {
      // ignore audio errors
    }
  }
}

export const soundManager = new SoundManager()
