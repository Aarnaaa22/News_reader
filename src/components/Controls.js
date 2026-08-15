import React from "react";
import { useSettings, MIN_FONT, MAX_FONT } from "../context/SettingsContext";

// Reads and writes settings from SettingsContext.
// Supports mobile hamburger drawer state via isOpen & onClose props.
function Controls({ voices, isOpen, onClose }) {
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
    <section
      className={`anr-controls ${isOpen ? "is-mobile-open" : ""}`}
      aria-label="Accessibility settings"
    >
      {/* Mobile Drawer Header */}
      <div className="anr-controls-header-mobile">
        <h2 className="anr-controls-title-mobile">Reading Controls</h2>
        <button
          type="button"
          className="anr-controls-close-btn"
          onClick={onClose}
          aria-label="Close accessibility controls menu"
        >
          <span aria-hidden="true">&times;</span> Close
        </button>
      </div>

      {/* 1. Language Selection (Placed at top for instant visibility on mobile & desktop) */}
      <div className="anr-control-group anr-control-group-wide">
        <span className="anr-control-label" id="language-label">
          Language / भाषा / भाषा: {language === 'en' ? 'English' : language === 'hi' ? 'Hindi (हिंदी)' : 'Marathi (मराठी)'}
        </span>
        <select
          id="language-select"
          className="anr-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          aria-labelledby="language-label"
        >
          <option value="en">English (en)</option>
          <option value="hi">Hindi - हिंदी (hi)</option>
          <option value="mr">Marathi - मराठी (mr)</option>
        </select>
      </div>

      {/* 2. Voice Selection */}
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

      {/* 3. Contrast Toggle */}
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

      {/* 4. Text Size Stepper */}
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

      {/* 5. Easy Mode Toggle */}
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

      {/* 6. Motion Toggle */}
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

      {/* 7. Reading Speed Slider */}
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
    </section>
  );
}

export default Controls;
