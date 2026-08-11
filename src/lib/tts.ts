/**
 * Phát âm từ vựng tiếng Anh bằng Web Speech API có sẵn trong trình duyệt.
 * @param word Từ hoặc cụm từ cần phát âm.
 * @param lang Mã ngôn ngữ (mặc định: en-US).
 */
export function speakWord(word: string, lang = "en-US") {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    // Huỷ bỏ bất kỳ phiên âm nào đang chạy để tránh đè âm thanh
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = lang
    utterance.rate = 0.95 // Tốc độ đọc vừa phải giúp người học dễ nghe

    window.speechSynthesis.speak(utterance)
  } else {
    console.warn("Trình duyệt này không hỗ trợ API Text-to-Speech.")
  }
}
