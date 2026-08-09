import React from "react";
import { useSettings, MIN_FONT, MAX_FONT } from "../context/SettingsContext";

// Reads and writes almost everything straight from SettingsContext, so
// App doesn't need to thread a dozen props down manually. Voice list is
// the one thing that has to come from the useSpeech hook (App owns it),
// so it's still passed in as a prop.
function Controls({ voices }) {
  const {
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
    language,
    setLanguage,
  } = useSettings();

  return (
    <section className="anr-controls" aria-label="Accessibility settings">
      <div className="anr-control-group">
        <span className="anr-control-label" id="contrast-label">
          Contrast
        </span>
        <button
          type="button"
          className={`anr-toggle-btn ${highContrast ? "is-on" : ""}`}
          aria-pressed={highContrast}
          aria-labelledby="contrast-label"
          onClick={toggleContrast}
        >
          {highContrast ? "High contrast: on" : "High contrast: off"}
        </button>
      </div>

      <div className="anr-control-group">
        <span className="anr-control-label" id="font-label">
          Text size
        </span>
        <div className="anr-font-controls" role="group" aria-labelledby="font-label">
          <button
            type="button"
            className="anr-icon-btn"
            onClick={decreaseFont}
            disabled={fontLevel <= MIN_FONT}
            aria-label="Decrease text size"
          >
            A&minus;
          </button>
          <button
            type="button"
            className="anr-icon-btn anr-reset-btn"
            onClick={resetFont}
            aria-label="Reset text size to default"
          >
            Reset
          </button>
          <button
            type="button"
            className="anr-icon-btn"
            onClick={increaseFont}
            disabled={fontLevel >= MAX_FONT}
            aria-label="Increase text size"
          >
            A+
          </button>
        </div>
      </div>

      <div className="anr-control-group">
        <span className="anr-control-label" id="easy-label">
          Easy mode
        </span>
        <button
          type="button"
          className={`anr-toggle-btn ${easyMode ? "is-on" : ""}`}
          aria-pressed={easyMode}
          aria-labelledby="easy-label"
          onClick={toggleEasyMode}
        >
          {easyMode ? "Easy mode: on" : "Easy mode: off"}
        </button>
      </div>

      <div className="anr-control-group">
        <span className="anr-control-label" id="motion-label">
          Motion
        </span>
        <button
          type="button"
          className={`anr-toggle-btn ${reduceMotion ? "is-on" : ""}`}
          aria-pressed={reduceMotion}
          aria-labelledby="motion-label"
          onClick={toggleReduceMotion}
        >
          {reduceMotion ? "Reduce motion: on" : "Reduce motion: off"}
        </button>
      </div>

      <div className="anr-control-group anr-control-group-wide">
        <span className="anr-control-label" id="rate-label">
          Reading speed: {speechRate.toFixed(1)}x
        </span>
        <input
          id="rate-slider"
          type="range"
          min="0.5"
          max="1.5"
          step="0.1"
          value={speechRate}
          onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
          aria-labelledby="rate-label"
          className="anr-slider"
        />
      </div>

      {voices.length > 0 && (
        <div className="anr-control-group anr-control-group-wide">
          <span className="anr-control-label" id="voice-label">
            Voice
          </span>
          <select
            id="voice-select"
            className="anr-select"
            value={voiceURI || ""}
            onChange={(e) => setVoiceURI(e.target.value || null)}
            aria-labelledby="voice-label"
          >
            <option value="">System default</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="anr-control-group anr-control-group-wide">
        <span className="anr-control-label" id="language-label">
          Language: {language === 'en' ? 'English' : language === 'hi' ? 'Hindi' : 'Marathi'}
        </span>
        <select
          id="language-select"
          className="anr-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          aria-labelledby="language-label"
        >
          <option value="en">English (en)</option>
          <option value="hi">Hindi (hi)</option>
          <option value="mr">Marathi (mr)</option>
        </select>
      </div>
    </section>
  );
}

export default Controls;
