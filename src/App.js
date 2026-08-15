import React, { useState, useMemo, useRef, useCallback } from "react";
import "./App.css";
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import useSpeech from "./hooks/useSpeech";
import useKeyboardShortcut from "./hooks/useKeyboardShortcut";
import Header from "./components/Header";
import Controls from "./components/Controls";
import SearchBar from "./components/SearchBar";
import CategoryFilter from "./components/CategoryFilter";
import ArticleCard from "./components/ArticleCard";
import ArticleFocusView from "./components/ArticleFocusView";
import EmptyState from "./components/EmptyState";
import SkipToContent from "./components/SkipToContent";
import KeyboardShortcutsModal from "./components/KeyboardShortcutsModal";
import SplashScreen from "./components/SplashScreen";
import ARTICLES from "./data/articles";

function AppShell() {
  const {
    highContrast,
    toggleContrast,
    fontScale,
    increaseFont,
    decreaseFont,
    easyMode,
    toggleEasyMode,
    reduceMotion,
    speechRate,
    voiceURI,
    bookmarks,
    language,
  } = useSettings();

  const speech = useSpeech({ rate: speechRate, voiceURI, language });

  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [focusedArticleId, setFocusedArticleId] = useState(null);

  const searchRef = useRef(null);

  const categories = useMemo(
    () => Array.from(new Set(ARTICLES.map((a) => a.category))),
    []
  );

  const filteredArticles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return ARTICLES.filter((article) => {
      const matchesTerm =
        !term ||
        article.title.toLowerCase().includes(term) ||
        article.content.toLowerCase().includes(term);
      const matchesCategory = activeCategory === "All" || article.category === activeCategory;
      const matchesBookmark = !showBookmarkedOnly || bookmarks.includes(article.id);
      return matchesTerm && matchesCategory && matchesBookmark;
    });
  }, [searchTerm, activeCategory, showBookmarkedOnly, bookmarks]);

  const focusedArticle = useMemo(
    () => ARTICLES.find((a) => a.id === focusedArticleId) || null,
    [focusedArticleId]
  );

  const handleToggleSpeak = useCallback(
    (article) => {
      const text = `${article.title}. By ${article.author}. ${article.content}`;
      speech.speak(article.id, text);
    },
    [speech]
  );

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setActiveCategory("All");
    setShowBookmarkedOnly(false);
  }, []);

  // ---- Keyboard shortcuts ----
  useKeyboardShortcut("/", (e) => {
    e.preventDefault();
    searchRef.current?.focus();
  });
  useKeyboardShortcut("c", toggleContrast);
  useKeyboardShortcut("e", toggleEasyMode);
  useKeyboardShortcut("+", increaseFont);
  useKeyboardShortcut("=", increaseFont);
  useKeyboardShortcut("-", decreaseFont);
  useKeyboardShortcut("?", () => setHelpOpen(true));
  useKeyboardShortcut(
    "Escape",
    () => {
      if (helpOpen) {
        setHelpOpen(false);
      } else if (speech.speakingId !== null) {
        speech.stop();
      } else if (focusedArticleId !== null) {
        setFocusedArticleId(null);
      }
    },
    { allowInInputs: true }
  );

  return (
    <div
      className={`anr-app ${highContrast ? "anr-contrast" : ""} ${easyMode ? "anr-easy" : ""} ${
        reduceMotion ? "anr-reduce-motion" : ""
      }`}
      style={{ "--anr-font-scale": fontScale }}
    >
      <SkipToContent targetId="main-content" />

      <Header onOpenHelp={() => setHelpOpen(true)} />

      <main className="anr-main">
        {focusedArticle ? (
          <ArticleFocusView
            article={focusedArticle}
            onBack={() => setFocusedArticleId(null)}
            isSpeaking={speech.speakingId === focusedArticle.id}
            isPaused={speech.speakingId === focusedArticle.id && speech.isPaused}
            wordRange={speech.speakingId === focusedArticle.id ? speech.wordRange : null}
            isSupported={speech.isSupported}
            isAnotherSpeaking={
              speech.speakingId !== null && speech.speakingId !== focusedArticle.id
            }
            onToggleSpeak={handleToggleSpeak}
            onTogglePause={speech.togglePause}
          />
        ) : (
          <>
            <Controls voices={speech.voices} />

            <SearchBar ref={searchRef} value={searchTerm} onChange={setSearchTerm} />

            <CategoryFilter
              categories={categories}
              activeCategory={activeCategory}
              onSelect={setActiveCategory}
              showBookmarkedOnly={showBookmarkedOnly}
              onToggleBookmarkedOnly={() => setShowBookmarkedOnly((v) => !v)}
              bookmarkCount={bookmarks.length}
            />

            <section id="main-content" className="anr-articles" aria-label="Articles" tabIndex={-1}>
              {filteredArticles.length === 0 ? (
                <EmptyState onClear={clearFilters} />
              ) : (
                filteredArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    isSpeaking={speech.speakingId === article.id}
                    isPaused={speech.speakingId === article.id && speech.isPaused}
                    wordRange={speech.speakingId === article.id ? speech.wordRange : null}
                    isSupported={speech.isSupported}
                    isAnotherSpeaking={speech.speakingId !== null && speech.speakingId !== article.id}
                    onToggleSpeak={handleToggleSpeak}
                    onTogglePause={speech.togglePause}
                    onSelectArticle={setFocusedArticleId}
                  />
                ))
              )}
            </section>
          </>
        )}

        {/* Announces reading state changes for screen reader users without
            visually shouting about it (visually-hidden via CSS). */}
        <p className="anr-sr-only" aria-live="polite">
          {speech.speakingId
            ? speech.isPaused
              ? "Reading paused"
              : "Reading article aloud"
            : ""}
        </p>
      </main>

      <footer className="anr-footer">
        <p>Accessible News Reader &middot; press ? for keyboard shortcuts</p>
      </footer>

      {speech.voiceError && (
        <div className="anr-toast" role="alert" aria-live="assertive">
          {speech.voiceError}
        </div>
      )}

      {helpOpen && <KeyboardShortcutsModal onClose={() => setHelpOpen(false)} />}
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <SettingsProvider>
      {showSplash ? (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      ) : (
        <AppShell />
      )}
    </SettingsProvider>
  );
}
