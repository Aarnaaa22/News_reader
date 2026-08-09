import { useState, useEffect } from "react";

// Generic localStorage-backed state. Falls back silently to plain
// in-memory state if localStorage is unavailable (private browsing, etc).
export default function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore write failures (quota exceeded, disabled storage, etc.)
    }
  }, [key, value]);

  return [value, setValue];
}
