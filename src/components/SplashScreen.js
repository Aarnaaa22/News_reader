import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSettings } from "../context/SettingsContext";

/**
 * SplashScreen component displayed when the application first loads.
 *
 * Requirements & Accessibility Features:
 * - Displays a centered, warm welcome message using the project's Atkinson Hyperlegible font
 *   and CSS custom variables so themes (high contrast, easy mode, text scale) match automatically.
 * - Auto-advances after 2 seconds:
 *   - Normal motion: curtain effect where left and right solid panels slide open.
 *   - Reduced motion (`reduceMotion` === true): skips sliding motion entirely and reveals after 2 seconds.
 * - Allows users to skip wait at any time by clicking anywhere or pressing Enter / Space.
 * - Uses `role="status"` and `aria-live="polite"` to announce the welcome message to screen readers
 *   without trapping focus or forcing repeated announcements.
 * - Auto-focuses on mount for instant keyboard interaction.
 */
function SplashScreen({ onFinish }) {
  const { reduceMotion, highContrast, easyMode, fontScale } = useSettings();
  const [isExiting, setIsExiting] = useState(false);

  const timerRef = useRef(null);
  const exitTimerRef = useRef(null);
  const splashRef = useRef(null);

  // Auto-focus container on mount so keyboard users (Enter/Space) can immediately skip
  useEffect(() => {
    if (splashRef.current) {
      splashRef.current.focus();
    }
  }, []);

  // Cleanly complete the splash screen lifecycle and notify parent
  const finish = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    if (onFinish) onFinish();
  }, [onFinish]);

  // Initiate exit animation or immediate finish based on reduceMotion setting
  const triggerExit = useCallback(() => {
    if (reduceMotion) {
      finish();
    } else {
      setIsExiting(true);
      // Wait for the calm 800ms curtain slide animation to complete before unmounting
      exitTimerRef.current = setTimeout(() => {
        finish();
      }, 800);
    }
  }, [reduceMotion, finish]);

  // Handle user skip action (click or Enter/Space keyboard press)
  const handleSkip = useCallback(() => {
    if (isExiting) {
      // If already sliding open, second click/key immediately finishes
      finish();
    } else {
      // Cancel automatic wait timer and start reveal sequence immediately
      if (timerRef.current) clearTimeout(timerRef.current);
      triggerExit();
    }
  }, [isExiting, finish, triggerExit]);

  // Keyboard accessibility listener for Enter and Space keys
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      handleSkip();
    }
  };

  // Set 2-second automatic timer on initial mount
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      triggerExit();
    }, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [triggerExit]);

  return (
    <div
      className={`anr-app ${highContrast ? "anr-contrast" : ""} ${easyMode ? "anr-easy" : ""} ${
        reduceMotion ? "anr-reduce-motion" : ""
      }`}
      style={{ "--anr-font-scale": fontScale }}
    >
      <div
        ref={splashRef}
        className={`anr-splash ${isExiting ? "is-exiting" : ""}`}
        role="status"
        aria-live="polite"
        tabIndex={0}
        onClick={handleSkip}
        onKeyDown={handleKeyDown}
        aria-label="Welcome screen. Click or press Enter or Space to skip wait."
      >
        {/* Left solid curtain panel */}
        <div className="anr-splash-panel anr-splash-panel-left" aria-hidden="true" />

        {/* Right solid curtain panel */}
        <div className="anr-splash-panel anr-splash-panel-right" aria-hidden="true" />

        {/* Centered welcome message */}
        <div className="anr-splash-content">
          <h1 className="anr-splash-title">Your Daily Dose of News</h1>
          <p className="anr-splash-subtitle">Simple. Clear. Ready when you are.</p>
          <span className="anr-splash-skip-note" aria-hidden="true">
            Click anywhere or press Enter to skip
          </span>
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;

