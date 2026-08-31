/**
 * Pronounce English vocabulary using the browser's built-in Web Speech API.
 * @param word The word or phrase to pronounce.
 * @param lang Language code (default: en-US).
 */
export function speakWord(word: string, lang = "en-US") {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    // Cancel any ongoing speech session to avoid audio overlap
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = lang
    utterance.rate = 0.95 // Moderate reading speed helps learners listen clearly

    window.speechSynthesis.speak(utterance)
  } else {
    console.warn("This browser does not support the Text-to-Speech API.")
  }
}
