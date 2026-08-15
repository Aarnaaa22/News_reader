import React from "react";

function Header({ onOpenHelp }) {
  // Today's date formatted as a classic newspaper date line (e.g. "Saturday, August 15, 2026")
  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="anr-header">
      <div className="anr-header-rule" aria-hidden="true" />
      <div className="anr-header-inner">
        <div className="anr-header-brand">
          <span className="anr-logo" aria-hidden="true">
            <svg viewBox="0 0 40 40" width="36" height="36">
              <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <path
                d="M13 15 a7 7 0 0 1 14 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="20" cy="24" r="2.5" fill="currentColor" />
            </svg>
          </span>
          <div>
            <h1 className="anr-title">Accessible News Reader</h1>
            <div className="anr-header-subline">
              <p className="anr-subtitle">News you can hear, see, and read your way</p>
              <span className="anr-date-dot" aria-hidden="true">&bull;</span>
              <time className="anr-header-date" dateTime={new Date().toISOString().slice(0, 10)}>
                {todayDate}
              </time>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="anr-help-btn"
          onClick={onOpenHelp}
          aria-label="Show keyboard shortcuts"
        >
          <span aria-hidden="true">?</span>
        </button>
      </div>
      <div className="anr-header-rule" aria-hidden="true" />
    </header>
  );
}

export default Header;
