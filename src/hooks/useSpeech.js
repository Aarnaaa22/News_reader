import { useState, useEffect, useRef, useCallback } from "react";

// Wraps the Web Speech API with:
//  - a queue of one utterance at a time, tracked by an arbitrary "id"
//  - live word-boundary tracking (via the utterance's `boundary` event)
//    so callers can highlight the word currently being spoken
//  - a list of installed voices, refreshed once they load
//  - adjustable rate (0.5x - 1.5x) and voice selection
export default function useSpeech({ rate = 1, voiceURI = null, language = 'en' } = {}) {
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const [speakingId, setSpeakingId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [wordRange, setWordRange] = useState(null); // { start, end } char indices in current text
  const [voices, setVoices] = useState([]);
  const [voiceError, setVoiceError] = useState(null);

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

      // Helper function to speak using browser Web Speech API as primary or fallback
      const speakWithWebSpeech = () => {
        if (!isSupported) {
          setSpeakingId(null);
          return;
        }

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

        utterance.onboundary = (event) => {
          if (event.name === "word" || event.charLength !== undefined) {
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
        window.speechSynthesis.speak(utterance);
      };

      // --- Use ElevenLabs Backend for Hindi & Marathi ---
      if (language === 'hi' || language === 'mr') {
        fetch("http://localhost:5000/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, language }),
        })
          .then((res) => {
            if (!res.ok) throw new Error("Backend response not ok");
            return res.blob();
          })
          .then((blob) => {
            if (audioRef.current === false) return; 
            
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            
            audio.onended = () => {
              setSpeakingId(null);
              setIsPaused(false);
            };
            audio.onerror = () => {
              setSpeakingId(null);
              setIsPaused(false);
              setVoiceError("Backend audio playback error. Falling back to browser speech.");
              setTimeout(() => setVoiceError(null), 4000);
              speakWithWebSpeech();
            };

            audioRef.current = audio;
            audio.play();
          })
          .catch((err) => {
            console.error("TTS fetch error:", err);
            setVoiceError("TTS backend offline. Using browser voice fallback.");
            setTimeout(() => setVoiceError(null), 4000);
            speakWithWebSpeech();
          });

        return;
      }

      // --- Use Web Speech API for other languages ---
      speakWithWebSpeech();
    },
    [isSupported, speakingId, rate, voiceURI, language, stop]
  );

  return { isSupported, speakingId, isPaused, wordRange, voices, voiceError, speak, stop, togglePause };
}
