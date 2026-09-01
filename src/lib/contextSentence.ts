/**
 * Utility to extract the entire sentence containing a selected word or phrase
 * from the surrounding reading passage or audio transcript.
 */
export function extractContextSentence(
  selectedWord: string,
  sourceText?: string,
  containerText?: string
): string {
  const word = selectedWord.trim()
  if (!word) return ""

  // Priority 1: Use container paragraph text from DOM if available
  // Priority 2: Use stripped source text (HTML removed)
  const cleanContainer = (containerText || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")
  const cleanSource = (sourceText || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")

  const textToSearch = cleanContainer.toLowerCase().includes(word.toLowerCase())
    ? cleanContainer
    : cleanSource

  if (!textToSearch) return word

  // Case-insensitive search for word position
  const lowerText = textToSearch.toLowerCase()
  const lowerWord = word.toLowerCase()
  const wordIndex = lowerText.indexOf(lowerWord)

  if (wordIndex === -1) return word

  // 1. Find start of sentence (search backwards for '.', '!', '?', '\n' or start of string)
  let startIdx = 0
  for (let i = wordIndex - 1; i >= 0; i--) {
    const char = textToSearch[i]
    if (char === "." || char === "!" || char === "?" || char === "\n" || char === "•") {
      startIdx = i + 1
      break
    }
  }

  // 2. Find end of sentence (search forwards for '.', '!', '?', '\n' or end of string)
  let endIdx = textToSearch.length
  for (let i = wordIndex + word.length; i < textToSearch.length; i++) {
    const char = textToSearch[i]
    if (char === "." || char === "!" || char === "?" || char === "\n" || char === "•") {
      endIdx = i + 1 // Include ending punctuation
      break
    }
  }

  const sentence = textToSearch.slice(startIdx, endIdx).trim()
  // Clean quotes or orphan punctuation at the start/end
  const cleaned = sentence
    .replace(/^[\s“"\'‘«(\[{]+/, "")
    .replace(/[\s”"\'’»\]}]+$/, "")
    .trim()

  return cleaned.length >= word.length ? cleaned : word
}
