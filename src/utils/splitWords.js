// Splits text into { word, start, end } tokens with character offsets
// matching the original string, so a SpeechSynthesisUtterance boundary
// event's charIndex can be mapped back to the word currently being read.
export default function splitWords(text) {
  const tokens = [];
  const regex = /\S+/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    tokens.push({ word: match[0], start: match.index, end: match.index + match[0].length });
  }
  return tokens;
}
