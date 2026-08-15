import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import splitWords from "../utils/splitWords";

const BCP47_MAP = {
  en: "en-US",
  hi: "hi-IN",
  mr: "mr-IN",
};

// Wraps the Web Speech API with:
//  - a queue of one utterance at a time, tracked by an arbitrary "id"
//  - live word-boundary tracking (via utterance's boundary event)
//  - fallback estimated word-by-word highlighter when boundary events aren't emitted (e.g. Hindi/Marathi)
//  - debounced (300ms) & queue-flushed (polling) rate changes
//  - voice & language selection with language-based voice filtering and fallback notices
export default function useSpeech({ rate = 1, voiceURI = null, language = 'en' } = {}) {
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const [speakingId, setSpeakingId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [wordRange, setWordRange] = useState(null);
  const [isEstimatedHighlight, setIsEstimatedHighlight] = useState(false);
  const [voices, setVoices] = useState([]);
  const [voiceError] = useState(null);

  const activeIdRef = useRef(null);
  const activeTextRef = useRef(null);
  const rateRef = useRef(rate);
  const voiceURIRef = useRef(voiceURI);
  const languageRef = useRef(language);
  const isPausedRef = useRef(isPaused);
  const restartTimerRef = useRef(null);
  const cancelPollRef = useRef(null);

  const hasRealBoundaryRef = useRef(false);
  const fallbackCheckTimerRef = useRef(null);
  const estimateTimerRef = useRef(null);

  // Keep refs updated with current settings
  useEffect(() => {
    rateRef.current = rate;
    voiceURIRef.current = voiceURI;
    languageRef.current = language;
    isPausedRef.current = isPaused;
  }, [rate, voiceURI, language, isPaused]);

  // Voice lists load asynchronously in most browsers
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

  // Filter voices that match the currently selected language
  const filteredVoices = useMemo(() => {
    if (!voices || voices.length === 0) return [];

    const currentLang = (language || 'en').toLowerCase();
    let matching = voices.filter((v) =>
      v.lang.toLowerCase().replace("_", "-").startsWith(currentLang)
    );

    if (matching.length === 0 && currentLang === 'mr') {
      matching = voices.filter((v) =>
        v.lang.toLowerCase().replace("_", "-").startsWith('hi')
      );
    }

    return matching;
  }, [voices, language]);

  // Provide a calm, informative notice if no native voice exists on the current device
  const voiceWarning = useMemo(() => {
    if (!isSupported || voices.length === 0) return null;

    const currentLang = (language || 'en').toLowerCase();
    const exactMatches = voices.filter((v) =>
      v.lang.toLowerCase().replace("_", "-").startsWith(currentLang)
    );

    if (currentLang === 'hi' && exactMatches.length === 0) {
      return "No native Hindi voice found on this device — using nearest voice fallback. For native pronunciation, try Chrome on Android or Desktop.";
    }

    if (currentLang === 'mr' && exactMatches.length === 0) {
      const hindiMatches = voices.filter((v) =>
        v.lang.toLowerCase().replace("_", "-").startsWith('hi')
      );
      if (hindiMatches.length > 0) {
        return "No native Marathi voice found on this device — using Hindi voice as closest fallback.";
      }
      return "No native Marathi voice found on this device — using nearest voice fallback. For native pronunciation, try Chrome on Android or Desktop.";
    }

    return null;
  }, [isSupported, voices, language]);

  // Clear all estimation & fallback timers
  const clearHighlightTimers = useCallback(() => {
    if (fallbackCheckTimerRef.current) {
      clearTimeout(fallbackCheckTimerRef.current);
      fallbackCheckTimerRef.current = null;
    }
    if (estimateTimerRef.current) {
      clearTimeout(estimateTimerRef.current);
      estimateTimerRef.current = null;
    }
  }, []);

  // Clean up pending timers and active speech on unmount
  useEffect(() => {
    return () => {
      clearHighlightTimers();
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (cancelPollRef.current) clearInterval(cancelPollRef.current);
      if (isSupported) window.speechSynthesis.cancel();
    };
  }, [isSupported, clearHighlightTimers]);

  // Safely cancels speech and waits for the browser queue to actually empty (max 500ms)
  const cancelAndDrainQueue = useCallback((callback) => {
    if (!isSupported) {
      if (callback) callback();
      return;
    }

    if (cancelPollRef.current) clearInterval(cancelPollRef.current);

    window.speechSynthesis.cancel();

    let elapsed = 0;
    const interval = 50;
    const maxWait = 500;

    cancelPollRef.current = setInterval(() => {
      elapsed += interval;
      const isSpeaking = window.speechSynthesis.speaking;

      if (!isSpeaking || elapsed >= maxWait) {
        clearInterval(cancelPollRef.current);
        cancelPollRef.current = null;
        if (callback) callback();
      }
    }, interval);
  }, [isSupported]);

  // Start simulated estimated highlighting when native boundary events do not fire
  const startEstimatedHighlighting = useCallback((text, currentRate) => {
    clearHighlightTimers();

    const tokens = splitWords(text);
    if (tokens.length === 0) return;

    let index = 0;

    function highlightNext() {
      if (index >= tokens.length || !activeIdRef.current) {
        return;
      }

      const token = tokens[index];
      setWordRange({ start: token.start, end: token.end });

      // Base ~65ms per character, scaled for speech rate
      const baseDuration = Math.max(150, Math.min(800, token.word.length * 65));
      const effectiveDuration = baseDuration / (currentRate || 1.0);

      index++;
      estimateTimerRef.current = setTimeout(highlightNext, effectiveDuration);
    }

    highlightNext();
  }, [clearHighlightTimers]);

  // Full stop function
  const stop = useCallback(() => {
    clearHighlightTimers();
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (cancelPollRef.current) {
      clearInterval(cancelPollRef.current);
      cancelPollRef.current = null;
    }

    if (isSupported) {
      window.speechSynthesis.cancel();
    }
    setSpeakingId(null);
    setIsPaused(false);
    setWordRange(null);
    setIsEstimatedHighlight(false);
    activeIdRef.current = null;
    activeTextRef.current = null;
    hasRealBoundaryRef.current = false;
  }, [isSupported, clearHighlightTimers]);

  // Internal helper to construct and start a SpeechSynthesisUtterance
  const speakInternal = useCallback((id, text) => {
    if (!isSupported || !text) return;

    clearHighlightTimers();

    setSpeakingId(id);
    setIsPaused(false);
    setWordRange(null);
    setIsEstimatedHighlight(false);
    activeIdRef.current = id;
    activeTextRef.current = text;
    hasRealBoundaryRef.current = false;

    const utterance = new SpeechSynthesisUtterance(text);
    const parsedRate = Math.max(0.5, Math.min(2.0, Number(rateRef.current) || 1.0));
    utterance.rate = parsedRate;

    // Explicitly set exact BCP-47 locale code (hi-IN, mr-IN, en-US)
    const targetBCP47 = BCP47_MAP[languageRef.current] || languageRef.current || 'en-US';
    utterance.lang = targetBCP47;

    let selectedVoice = null;
    const allVoices = window.speechSynthesis.getVoices();

    if (voiceURIRef.current) {
      selectedVoice = allVoices.find((v) => v.voiceURI === voiceURIRef.current);
    }

    if (!selectedVoice) {
      const langPrefix = (languageRef.current || 'en').toLowerCase();
      selectedVoice = allVoices.find(v => v.lang.toLowerCase().replace("_", "-").startsWith(langPrefix));

      if (!selectedVoice && langPrefix === 'mr') {
        selectedVoice = allVoices.find(v => v.lang.toLowerCase().replace("_", "-").startsWith('hi'));
      }

      if (!selectedVoice) {
        selectedVoice = allVoices.find(v => v.default) || allVoices[0];
      }
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // 400ms check: If no native boundary event fires within 400ms, enable estimated mode
    fallbackCheckTimerRef.current = setTimeout(() => {
      if (!hasRealBoundaryRef.current && activeIdRef.current === id) {
        setIsEstimatedHighlight(true);
        startEstimatedHighlighting(text, rateRef.current);
      }
    }, 400);

    utterance.onboundary = (event) => {
      hasRealBoundaryRef.current = true;
      clearHighlightTimers();
      setIsEstimatedHighlight(false);

      if (event && typeof event.charIndex === "number") {
        setWordRange({
          start: event.charIndex,
          end: event.charIndex + (event.charLength || 1),
        });
      }
    };

    utterance.onend = () => {
      clearHighlightTimers();
      setSpeakingId(null);
      setIsPaused(false);
      setWordRange(null);
      setIsEstimatedHighlight(false);
      activeIdRef.current = null;
      activeTextRef.current = null;
      hasRealBoundaryRef.current = false;
    };

    utterance.onerror = (e) => {
      if (e && e.error !== "canceled" && e.error !== "interrupted") {
        clearHighlightTimers();
        setSpeakingId(null);
        setIsPaused(false);
        setWordRange(null);
        setIsEstimatedHighlight(false);
        activeIdRef.current = null;
        activeTextRef.current = null;
        hasRealBoundaryRef.current = false;
      }
    };

    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
  }, [isSupported, clearHighlightTimers, startEstimatedHighlighting]);

  // Main speak function called when user taps Listen on an article
  const speak = useCallback((id, text) => {
    if (!isSupported) return;

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    // Clicking the article that's already speaking stops it instead of restarting
    if (speakingId === id) {
      stop();
      return;
    }

    cancelAndDrainQueue(() => {
      speakInternal(id, text);
    });
  }, [isSupported, speakingId, stop, cancelAndDrainQueue, speakInternal]);

  // Debounced (300ms) restart when `rate` changes while an article is currently playing
  useEffect(() => {
    if (!isSupported) return;

    // Only restart speech if an article is actively playing
    if (speakingId !== null && activeIdRef.current && activeTextRef.current && !isPausedRef.current) {
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }

      restartTimerRef.current = setTimeout(() => {
        const currentId = activeIdRef.current;
        const currentText = activeTextRef.current;

        if (currentId && currentText) {
          cancelAndDrainQueue(() => {
            speakInternal(currentId, currentText);
          });
        }
      }, 300);
    }
  }, [rate, isSupported, speakingId, cancelAndDrainQueue, speakInternal]);

  const togglePause = useCallback(() => {
    if (!speakingId || !isSupported) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSupported, speakingId, isPaused]);

  return {
    isSupported,
    speakingId,
    isPaused,
    wordRange,
    isEstimatedHighlight,
    voices,
    filteredVoices,
    voiceWarning,
    voiceError,
    speak,
    toggleSpeak: speak,
    stop,
    togglePause,
  };
}
