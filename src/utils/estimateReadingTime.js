// Rough reading-time estimate at 200 words per minute, rounded up to
// the nearest minute (minimum 1) so short articles still show "1 min read".
export default function estimateReadingTime(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}
