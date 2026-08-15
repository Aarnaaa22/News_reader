import { useState, useEffect, useRef, useCallback, useMemo } from "react";

const BCP47_MAP = {
  en: "en-US",
  hi: "hi-IN",
  mr: "mr-IN",
};

// Robust Web Speech API hook supporting dynamic rate changes across English, Hindi, & Marathi
export default function useSpeech({ rate = 1, voiceURI = null, language = "en" } = {}) {
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const [speakingId, setSpeakingId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [wordRange, setWordRange] = useState(null);
  const [voices, setVoices] = useState([]);

  const speakingIdRef = useRef(null);
  const activeTextRef = useRef(null);
  const isPausedRef = useRef(false);
  const restartTimerRef = useRef(null);
  const prevRateRef = useRef(rate);

  // ---- Voice list (loads asynchronously in most browsers) ----
  useEffect(() => {
    if (!isSupported) return;
    function loadVoices() {
      setVoices(window.speechSynthesis.getVoices());
    }
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported]);

  // Voices matching the currently selected language, with Marathi->Hindi fallback
  const filteredVoices = useMemo(() => {
    if (!voices.length) return [];
    const lang = (language || "en").toLowerCase();
    let matches = voices.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith(lang));
    if (matches.length === 0 && lang === "mr") {
      matches = voices.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith("hi"));
    }
    return matches;
  }, [voices, language]);

  const voiceWarning = useMemo(() => {
    if (!isSupported || voices.length === 0) return null;
    const lang = (language || "en").toLowerCase();
    if (lang === "en") return null;
    const exact = voices.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith(lang));
    if (exact.length > 0) return null;
    if (lang === "mr") {
      const hindiFallback = voices.some((v) => v.lang.toLowerCase().replace("_", "-").startsWith("hi"));
      return hindiFallback
        ? "No native Marathi voice found on this device — using Hindi voice as the closest fallback."
        : "No native Marathi voice found on this device — using the system default voice.";
    }
    return "No native Hindi voice found on this device — using the system default voice.";
  }, [isSupported, voices, language]);

  // ---- Cleanup on unmount ----
  useEffect(() => {
    return () => {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (isSupported) window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  const stop = useCallback(() => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    if (isSupported) window.speechSynthesis.cancel();
    setSpeakingId(null);
    setIsPaused(false);
    setWordRange(null);
    speakingIdRef.current = null;
    activeTextRef.current = null;
    isPausedRef.current = false;
  }, [isSupported]);

  const speakInternal = useCallback(
    (id, text) => {
      if (!isSupported || !text) return;

      window.speechSynthesis.cancel();

      speakingIdRef.current = id;
      activeTextRef.current = text;
      isPausedRef.current = false;

      setSpeakingId(id);
      setIsPaused(false);
      setWordRange(null);

      const utterance = new SpeechSynthesisUtterance(text);
      const safeRate = Math.max(0.5, Math.min(2.0, Number(rate) || 1));
      utterance.rate = safeRate;
      utterance.lang = BCP47_MAP[language] || "en-US";

      const allVoices = window.speechSynthesis.getVoices();
      let selected = voiceURI ? allVoices.find((v) => v.voiceURI === voiceURI) : null;
      if (!selected) {
        const lang = (language || "en").toLowerCase();
        selected = allVoices.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith(lang));
        if (!selected && lang === "mr") {
          selected = allVoices.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith("hi"));
        }
        if (!selected) selected = allVoices.find((v) => v.default) || allVoices[0];
      }
      if (selected) utterance.voice = selected;

      utterance.onboundary = (event) => {
        if (event && typeof event.charIndex === "number") {
          setWordRange({ start: event.charIndex, end: event.charIndex + (event.charLength || 1) });
        }
      };

      utterance.onend = () => {
        setSpeakingId(null);
        setIsPaused(false);
        setWordRange(null);
        speakingIdRef.current = null;
        activeTextRef.current = null;
        isPausedRef.current = false;
      };

      utterance.onerror = (e) => {
        if (e && e.error !== "canceled" && e.error !== "interrupted") {
          setSpeakingId(null);
          setIsPaused(false);
          setWordRange(null);
          speakingIdRef.current = null;
          activeTextRef.current = null;
          isPausedRef.current = false;
        }
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, rate, voiceURI, language]
  );

  const speak = useCallback(
    (id, text) => {
      if (speakingIdRef.current === id) {
        stop();
        return;
      }
      speakInternal(id, text);
    },
    [speakingIdRef, stop, speakInternal]
  );

  // Restart speech seamlessly at new rate when user moves rate slider while speaking
  useEffect(() => {
    if (prevRateRef.current === rate) return;
    prevRateRef.current = rate;

    if (isSupported && speakingIdRef.current && activeTextRef.current && !isPausedRef.current) {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      restartTimerRef.current = setTimeout(() => {
        const currentId = speakingIdRef.current;
        const currentText = activeTextRef.current;
        if (currentId && currentText) {
          speakInternal(currentId, currentText);
        }
      }, 300);
    }
  }, [rate, isSupported, speakInternal]);

  const togglePause = useCallback(() => {
    if (!speakingIdRef.current || !isSupported) return;
    if (isPausedRef.current) {
      window.speechSynthesis.resume();
      isPausedRef.current = false;
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      isPausedRef.current = true;
      setIsPaused(true);
    }
  }, [isSupported]);

  return {
    isSupported,
    speakingId,
    isPaused,
    wordRange,
    voices,
    filteredVoices,
    voiceWarning,
    speak,
    toggleSpeak: speak,
    stop,
    togglePause,
  };
}