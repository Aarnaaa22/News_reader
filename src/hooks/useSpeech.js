import { useState, useEffect, useRef, useCallback } from "react";

// Wraps the Web Speech API with:
//  - a queue of one utterance at a time, tracked by an arbitrary "id"
//  - live word-boundary tracking (via utterance's boundary event)
//  - debounced (300ms) & queue-flushed (polling) rate changes to prevent audio glitching/overlap
//  - voice & language selection
export default function useSpeech({ rate = 1, voiceURI = null, language = 'en' } = {}) {
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const [speakingId, setSpeakingId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [wordRange, setWordRange] = useState(null);
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

  // Clean up pending timers and active speech on unmount
  useEffect(() => {
    return () => {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (cancelPollRef.current) clearInterval(cancelPollRef.current);
      if (isSupported) window.speechSynthesis.cancel();
    };
  }, [isSupported]);

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

  // Full stop function
  const stop = useCallback(() => {
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
    activeIdRef.current = null;
    activeTextRef.current = null;
  }, [isSupported]);

  // Internal helper to construct and start a SpeechSynthesisUtterance
  const speakInternal = useCallback((id, text) => {
    if (!isSupported || !text) return;

    setSpeakingId(id);
    setIsPaused(false);
    setWordRange(null);
    activeIdRef.current = id;
    activeTextRef.current = text;

    const utterance = new SpeechSynthesisUtterance(text);
    const parsedRate = Math.max(0.5, Math.min(2.0, Number(rateRef.current) || 1.0));
    utterance.rate = parsedRate;
    utterance.lang = languageRef.current || 'en';

    let selectedVoice = null;
    const allVoices = window.speechSynthesis.getVoices();

    if (voiceURIRef.current) {
      selectedVoice = allVoices.find((v) => v.voiceURI === voiceURIRef.current);
    }

    if (!selectedVoice || !selectedVoice.lang.startsWith(languageRef.current)) {
      if (languageRef.current === 'mr') {
        selectedVoice = allVoices.find(v => v.lang.startsWith('mr')) || allVoices.find(v => v.lang.startsWith('hi'));
      } else if (languageRef.current === 'hi') {
        selectedVoice = allVoices.find(v => v.lang.startsWith('hi'));
      } else {
        selectedVoice = allVoices.find(v => v.lang.startsWith('en'));
      }

      if (!selectedVoice) {
        selectedVoice = allVoices.find(v => v.lang.startsWith(languageRef.current)) || allVoices[0];
      }
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onboundary = (event) => {
      if (event && typeof event.charIndex === "number") {
        setWordRange({
          start: event.charIndex,
          end: event.charIndex + (event.charLength || 1),
        });
      }
    };

    utterance.onend = () => {
      setSpeakingId(null);
      setIsPaused(false);
      setWordRange(null);
      activeIdRef.current = null;
      activeTextRef.current = null;
    };

    utterance.onerror = (e) => {
      if (e && e.error !== "canceled" && e.error !== "interrupted") {
        setSpeakingId(null);
        setIsPaused(false);
        setWordRange(null);
        activeIdRef.current = null;
        activeTextRef.current = null;
      }
    };

    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

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
    voices,
    voiceError,
    speak,
    toggleSpeak: speak,
    stop,
    togglePause,
  };
}
