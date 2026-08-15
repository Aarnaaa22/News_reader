import React, { useMemo, useState, useEffect } from "react";
import { useSettings } from "../context/SettingsContext";
import translateText from "../utils/translateText";
import estimateReadingTime from "../utils/estimateReadingTime";
import splitWords from "../utils/splitWords";

// The utterance spoken for each article is "{title}. By {author}. {content}",
// built in App. To highlight the right word inside just the content
// paragraph, we need to know how long that spoken prefix is so the
// boundary event's charIndex (which counts from the start of the whole
// utterance) can be translated into an offset within `content` alone.
function buildSpokenPrefix(article) {
  return `${article.title}. By ${article.author}. `;
}

function ArticleCard({
  article,
  isSpeaking,
  isPaused,
  wordRange,
  isSupported,
  onToggleSpeak,
  onTogglePause,
  isAnotherSpeaking,
  onSelectArticle,
  isFocused = false,
}) {
  const { bookmarks, toggleBookmark, language } = useSettings();
  const isBookmarked = bookmarks.includes(article.id);

  const [translatedTitle, setTranslatedTitle] = useState(article.title);
  const [translatedContent, setTranslatedContent] = useState(article.content);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (!language || language === 'en') {
      setTranslatedTitle(article.title);
      setTranslatedContent(article.content);
      setIsTranslating(false);
      return;
    }

    let isMounted = true;
    setIsTranslating(true);

    Promise.all([
      translateText(article.title, language),
      translateText(article.content, language)
    ]).then(([newTitle, newContent]) => {
      if (isMounted) {
        setTranslatedTitle(newTitle);
        setTranslatedContent(newContent);
        setIsTranslating(false);
      }
    });

    return () => { isMounted = false; };
  }, [article.title, article.content, language]);

  const translatedArticle = useMemo(() => ({
    ...article,
    title: translatedTitle,
    content: translatedContent
  }), [article, translatedTitle, translatedContent]);

  const readingTime = useMemo(() => estimateReadingTime(translatedContent), [translatedContent]);

  const words = useMemo(() => splitWords(translatedContent), [translatedContent]);
  const prefixLength = useMemo(() => buildSpokenPrefix(translatedArticle).length, [translatedArticle]);

  const highlightIndex =
    isSpeaking && wordRange ? wordRange.start - prefixLength : -1;

  // Handle clicking anywhere on the card to trigger zoom-in focus view
  const handleCardClick = () => {
    if (!isFocused && onSelectArticle) {
      onSelectArticle(article.id);
    }
  };

  // Keyboard support: Enter/Space triggers card focus view when focused on card container
  const handleCardKeyDown = (e) => {
    if (!isFocused && onSelectArticle && (e.key === "Enter" || e.key === " ")) {
      if (e.target.tagName !== "BUTTON") {
        e.preventDefault();
        onSelectArticle(article.id);
      }
    }
  };

  return (
    <article
      className={`anr-card ${isFocused ? "anr-card-focused" : ""} ${isSpeaking ? "is-speaking" : ""} ${
        !isFocused && onSelectArticle ? "is-clickable" : ""
      }`}
      tabIndex={!isFocused && onSelectArticle ? 0 : undefined}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role={!isFocused && onSelectArticle ? "button" : undefined}
      aria-label={!isFocused && onSelectArticle ? `View full article: ${article.title}` : undefined}
    >
      <div className="anr-card-meta">
        <span className="anr-badge">{article.category}</span>
        <span className="anr-reading-time">{readingTime}</span>
        {isSpeaking && (
          <span className="anr-now-reading" role="status">
            <span className="anr-pulse-dot" aria-hidden="true" />
            {isPaused ? "Paused" : "Reading aloud"}
          </span>
        )}
        <button
          type="button"
          className={`anr-bookmark-btn ${isBookmarked ? "is-on" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleBookmark(article.id);
          }}
          aria-pressed={isBookmarked}
          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this article"}
        >
          {isBookmarked ? "\u2605" : "\u2606"}
        </button>
      </div>

      <div style={{ transition: "opacity 0.3s ease", opacity: isTranslating ? 0.5 : 1 }}>
        <h2 className="anr-card-title">{isTranslating ? "Translating..." : translatedTitle}</h2>
        <p className="anr-card-byline">
          By {article.author} &middot; {article.date}
        </p>

        {isTranslating ? (
          <p className="anr-card-content" aria-live="polite">Translating content...</p>
        ) : (
          <p className="anr-card-content">
            {words.map((token, i) => {
              const isCurrent =
                highlightIndex >= 0 && token.start <= highlightIndex && highlightIndex < token.end;
              return (
                <React.Fragment key={i}>
                  <span className={isCurrent ? "anr-word-highlight" : undefined}>{token.word}</span>{" "}
                </React.Fragment>
              );
            })}
          </p>
        )}
      </div>

      <div className="anr-card-actions">
        <button
          type="button"
          className={`anr-speak-btn ${isSpeaking ? "is-active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSpeak(translatedArticle);
          }}
          disabled={!isSupported || isAnotherSpeaking}
          aria-pressed={isSpeaking}
        >
          <span aria-hidden="true" className="anr-speak-icon">
            {isSpeaking ? "\u25A0" : "\uD83D\uDD0A"}
          </span>
          {isSpeaking ? "Stop reading" : "Read aloud"}
        </button>

        {isSpeaking && (
          <button
            type="button"
            className="anr-pause-btn"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePause();
            }}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
        )}
      </div>

      {!isSupported && (
        <p className="anr-support-note">Text-to-speech isn't supported in this browser.</p>
      )}
    </article>
  );
}

export default ArticleCard;
