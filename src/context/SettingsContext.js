import React, { createContext, useContext, useMemo, useCallback } from "react";
import useLocalStorage from "../hooks/useLocalStorage";

const SettingsContext = createContext(null);

export const MIN_FONT = 0;
export const MAX_FONT = 5;
export const FONT_SCALE = [0.875, 1, 1.125, 1.25, 1.4, 1.6];

// Helper to detect system preference for reduced motion on first load
function getInitialReduceMotion() {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  return false;
}

// Every setting here is persisted to localStorage, so a reader's
// preferences survive a page refresh or a return visit.
export function SettingsProvider({ children }) {
  const [highContrast, setHighContrast] = useLocalStorage("anr:highContrast", false);
  const [fontLevel, setFontLevel] = useLocalStorage("anr:fontLevel", 1);
  const [easyMode, setEasyMode] = useLocalStorage("anr:easyMode", false);
  const [reduceMotion, setReduceMotion] = useLocalStorage("anr:reduceMotion", getInitialReduceMotion);
  const [speechRate, setSpeechRate] = useLocalStorage("anr:speechRate", 1);
  const [voiceURI, setVoiceURI] = useLocalStorage("anr:voiceURI", null);
  const [bookmarks, setBookmarks] = useLocalStorage("anr:bookmarks", []);
  const [language, setLanguage] = useLocalStorage("anr:language", "en");

  const toggleContrast = useCallback(() => setHighContrast((v) => !v), [setHighContrast]);
  const toggleEasyMode = useCallback(() => setEasyMode((v) => !v), [setEasyMode]);
  const toggleReduceMotion = useCallback(() => setReduceMotion((v) => !v), [setReduceMotion]);
  const increaseFont = useCallback(
    () => setFontLevel((v) => Math.min(MAX_FONT, v + 1)),
    [setFontLevel]
  );
  const decreaseFont = useCallback(
    () => setFontLevel((v) => Math.max(MIN_FONT, v - 1)),
    [setFontLevel]
  );
  const resetFont = useCallback(() => setFontLevel(1), [setFontLevel]);

  const toggleBookmark = useCallback(
    (articleId) => {
      setBookmarks((current) =>
        current.includes(articleId)
          ? current.filter((id) => id !== articleId)
          : [...current, articleId]
      );
    },
    [setBookmarks]
  );

  const value = useMemo(
    () => ({
      highContrast,
      toggleContrast,
      fontLevel,
      fontScale: FONT_SCALE[fontLevel],
      increaseFont,
      decreaseFont,
      resetFont,
      easyMode,
      toggleEasyMode,
      reduceMotion,
      toggleReduceMotion,
      speechRate,
      setSpeechRate,
      voiceURI,
      setVoiceURI,
      bookmarks,
      toggleBookmark,
      language,
      setLanguage,
    }),
    [
      highContrast,
      toggleContrast,
      fontLevel,
      increaseFont,
      decreaseFont,
      resetFont,
      easyMode,
      toggleEasyMode,
      reduceMotion,
      toggleReduceMotion,
      speechRate,
      setSpeechRate,
      voiceURI,
      setVoiceURI,
      bookmarks,
      toggleBookmark,
      language,
      setLanguage,
    ]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// Convenience hook so components don't import useContext + SettingsContext separately.
export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside a <SettingsProvider>");
  return ctx;
}
