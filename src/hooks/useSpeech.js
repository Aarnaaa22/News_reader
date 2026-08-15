import { useState, useEffect, useRef, useCallback } from "react";

// Wraps the Web Speech API with:
//  - a queue of one utterance at a time, tracked by an arbitrary "id"
//  - live word-boundary tracking (via utterance's boundary event)
//  - dynamic real-time rate updating when user moves speed slider mid-speech
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
  const activeCharIndexRef = useRef(0);
  const rateRef = useRef(rate);
  const voiceURIRef = useRef(voiceURI);
  const languageRef = useRef(language);
  const isPausedRef = useRef(isPaused);

  // Keep refs in sync with props
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

  useEffect(() => {
    return () => {
      if (isSupported) window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
    setSpeakingId(null);
    setIsPaused(false);
    setWordRange(null);
    activeIdRef.current = null;
    activeTextRef.current = null;
    activeCharIndexRef.current = 0;
  }, [isSupported]);

  const startSpeakingFromChar = useCallback(
    (id, text, startChar = 0) => {
      if (!isSupported || !text) return;

      window.speechSynthesis.cancel();

      setSpeakingId(id);
      setIsPaused(false);
      activeIdRef.current = id;
      activeTextRef.current = text;

      // Slice text from current character index if resuming/updating speed mid-article
      const textToSpeak = startChar > 0 ? text.slice(startChar) : text;

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
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
          const absoluteIndex = startChar + event.charIndex;
          activeCharIndexRef.current = absoluteIndex;
          setWordRange({
            start: absoluteIndex,
            end: absoluteIndex + (event.charLength || 1),
          });
        }
      };

      utterance.onend = () => {
        setSpeakingId(null);
        setIsPaused(false);
        setWordRange(null);
        activeIdRef.current = null;
        activeTextRef.current = null;
        activeCharIndexRef.current = 0;
      };

      utterance.onerror = (e) => {
        // Ignore canceled errors triggered by speed adjustments
        if (e && e.error !== "canceled" && e.error !== "interrupted") {
          setSpeakingId(null);
          setIsPaused(false);
          setWordRange(null);
          activeIdRef.current = null;
          activeTextRef.current = null;
          activeCharIndexRef.current = 0;
        }
      };

      // Workaround for browser TTS pause/cancel bugs on mobile & desktop
      window.speechSynthesis.resume();
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 20);
    },
    [isSupported]
  );

  // If rate changes while actively speaking, dynamically update speech speed in real-time!
  useEffect(() => {
    if (isSupported && activeIdRef.current && activeTextRef.current && !isPausedRef.current) {
      startSpeakingFromChar(activeIdRef.current, activeTextRef.current, activeCharIndexRef.current);
    }
  }, [rate, isSupported, startSpeakingFromChar]);

  const speak = useCallback(
    (id, text) => {
      if (!isSupported) return;

      // Toggling active article stops speech
      if (speakingId === id) {
        stop();
        return;
      }

      startSpeakingFromChar(id, text, 0);
    },
    [isSupported, speakingId, stop, startSpeakingFromChar]
  );

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
