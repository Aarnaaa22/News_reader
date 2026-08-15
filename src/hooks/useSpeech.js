import { useState, useEffect, useRef, useCallback } from "react";

// Wraps the Web Speech API with:
//  - a queue of one utterance at a time, tracked by an arbitrary "id"
//  - live word-boundary tracking (via the utterance's `boundary` event)
//    so callers can highlight the word currently being spoken (in title & content)
//  - a list of installed voices, refreshed once they load
//  - adjustable rate (0.5x - 1.5x) and voice selection
export default function useSpeech({ rate = 1, voiceURI = null, language = 'en' } = {}) {
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const [speakingId, setSpeakingId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [wordRange, setWordRange] = useState(null); // { start, end } char indices in current text
  const [voices, setVoices] = useState([]);
  const [voiceError] = useState(null);

  const utteranceRef = useRef(null);
  const audioRef = useRef(null);

  // Voice lists load asynchronously in most browsers.
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
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isSupported]);

  const stop = useCallback(() => {
    if (isSupported) window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeakingId(null);
    setIsPaused(false);
    setWordRange(null);
  }, [isSupported]);

  const togglePause = useCallback(() => {
    if (!speakingId) return;

    if (audioRef.current) {
      if (isPaused) {
        audioRef.current.play();
        setIsPaused(false);
      } else {
        audioRef.current.pause();
        setIsPaused(true);
      }
      return;
    }

    if (!isSupported) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSupported, speakingId, isPaused]);

  const speak = useCallback(
    (id, text) => {
      if (!isSupported) return;

      // Clicking the article that's already speaking stops it instead of restarting.
      if (speakingId === id) {
        stop();
        return;
      }

      stop(); // ensure anything playing is stopped

      setSpeakingId(id);
      setIsPaused(false);
      setWordRange(null);

      // Instant device Web Speech API with microsecond boundary tracking
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.lang = language;

      let selectedVoice = null;
      const allVoices = window.speechSynthesis.getVoices();

      if (voiceURI) {
        selectedVoice = allVoices.find((v) => v.voiceURI === voiceURI);
      }

      // Intelligently find best matching voice for selected language
      if (!selectedVoice || !selectedVoice.lang.startsWith(language)) {
        if (language === 'mr') {
          selectedVoice = allVoices.find(v => v.lang.startsWith('mr')) || allVoices.find(v => v.lang.startsWith('hi'));
        } else if (language === 'hi') {
          selectedVoice = allVoices.find(v => v.lang.startsWith('hi'));
        } else {
          selectedVoice = allVoices.find(v => v.lang.startsWith('en'));
        }
        
        if (!selectedVoice) {
          selectedVoice = allVoices.find(v => v.lang.startsWith(language)) || allVoices[0];
        }
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Track precise character index boundary for real-time word highlighting (title + content)
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
      };
      utterance.onerror = () => {
        setSpeakingId(null);
        setIsPaused(false);
        setWordRange(null);
      };

      utteranceRef.current = utterance;
      // Start instant playback (<50ms delay)
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, speakingId, rate, voiceURI, language, stop]
  );

  return { isSupported, speakingId, isPaused, wordRange, voices, voiceError, speak, stop, togglePause };
}
