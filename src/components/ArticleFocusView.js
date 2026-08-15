import React, { useEffect, useRef } from "react";
import { useSettings } from "../context/SettingsContext";
import ArticleCard from "./ArticleCard";

/**
 * ArticleFocusView component renders a single article in a large, centered,
 * distraction-free focused layout.
 *
 * Requirements & Accessibility Features:
 * - Renders a single focused article taking over the main content area.
 * - Big, unmissable "← Back to Articles" exit button pinned at the top.
 * - Reuses ArticleCard logic for read-aloud, word-highlighting, and bookmarks without code duplication.
 * - Auto-focuses the exit button on mount so keyboard/screen reader users land on a sensible control.
 * - Landmarked with role="region" and aria-label naming the focused article.
 * - Smooth zoom/scale-in entry transition (suppressed when reduceMotion is enabled).
 *
 * @param {Object} props
 * @param {Object} props.article The focused article object.
 * @param {Function} props.onBack Callback function to exit focus view and return to grid.
 * @param {boolean} props.isSpeaking Whether this article is currently being read aloud.
 * @param {boolean} props.isPaused Whether speech is currently paused.
 * @param {Object|null} props.wordRange Current word boundary index for TTS highlighting.
 * @param {boolean} props.isSupported Whether TTS speech synthesis is supported.
 * @param {boolean} props.isAnotherSpeaking Whether another article is being read.
 * @param {Function} props.onToggleSpeak Callback to start or stop reading aloud.
 * @param {Function} props.onTogglePause Callback to pause or resume reading aloud.
 */
function ArticleFocusView({
  article,
  onBack,
  isSpeaking,
  isPaused,
  wordRange,
  isSupported,
  isAnotherSpeaking,
  onToggleSpeak,
  onTogglePause,
}) {
  const { easyMode, reduceMotion } = useSettings();
  const backButtonRef = useRef(null);

  // Move keyboard focus to the "← Back to Articles" exit button on mount
  useEffect(() => {
    if (backButtonRef.current) {
      backButtonRef.current.focus();
    }
  }, []);

  if (!article) return null;

  return (
    <section
      className={`anr-focus-view ${reduceMotion ? "anr-reduce-motion" : ""}`}
      aria-label={`Focused article: ${article.title}`}
    >
      {/* Big, unmissable exit button pinned near top */}
      <button
        ref={backButtonRef}
        type="button"
        className={`anr-focus-back-btn ${easyMode ? "is-easy" : ""}`}
        onClick={onBack}
        aria-label="Back to all articles grid"
      >
        <span aria-hidden="true">&larr;</span> Back to Articles
      </button>

      {/* Render focused article using ArticleCard logic for complete feature parity */}
      <div className="anr-focus-card-wrapper">
        <ArticleCard
          article={article}
          isSpeaking={isSpeaking}
          isPaused={isPaused}
          wordRange={wordRange}
          isSupported={isSupported}
          isAnotherSpeaking={isAnotherSpeaking}
          onToggleSpeak={onToggleSpeak}
          onTogglePause={onTogglePause}
          isFocused={true}
        />
      </div>
    </section>
  );
}

export default ArticleFocusView;
