import { useEffect } from "react";

// Registers a single global keyboard shortcut.
// key: the KeyboardEvent.key value to match (case-insensitive), e.g. "c", "/", "Escape"
// handler: called when the key is pressed and no text input/textarea is focused
//          (unless allowInInputs is true, e.g. for Escape)
export default function useKeyboardShortcut(key, handler, { allowInInputs = false } = {}) {
  useEffect(() => {
    function onKeyDown(event) {
      const target = event.target;
      const isTyping =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (isTyping && !allowInInputs) return;
      if (event.key.toLowerCase() !== key.toLowerCase()) return;

      handler(event);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [key, handler, allowInInputs]);
}
