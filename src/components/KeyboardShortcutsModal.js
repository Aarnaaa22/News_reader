import React, { useEffect, useRef } from "react";

const SHORTCUTS = [
  { keys: "/", desc: "Focus the search box" },
  { keys: "C", desc: "Toggle high contrast mode" },
  { keys: "+", desc: "Increase text size" },
  { keys: "-", desc: "Decrease text size" },
  { keys: "E", desc: "Toggle easy mode" },
  { keys: "Esc", desc: "Stop reading aloud / close this dialog" },
  { keys: "?", desc: "Open this shortcuts list" },
];

function KeyboardShortcutsModal({ onClose }) {
  const closeBtnRef = useRef(null);

  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  return (
    <div className="anr-modal-backdrop" onClick={onClose}>
      <div
        className="anr-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="anr-modal-header">
          <h2 id="shortcuts-title" className="anr-modal-title">
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            ref={closeBtnRef}
            className="anr-icon-btn"
            onClick={onClose}
            aria-label="Close keyboard shortcuts dialog"
          >
            &times;
          </button>
        </div>
        <dl className="anr-shortcuts-list">
          {SHORTCUTS.map((s) => (
            <div className="anr-shortcut-row" key={s.keys}>
              <dt>
                <kbd>{s.keys}</kbd>
              </dt>
              <dd>{s.desc}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

export default KeyboardShortcutsModal;
