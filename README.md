# Accessible News Reader — Advanced

A more fully-featured version of the accessible news reader: persisted
settings, word-by-word read-aloud highlighting, bookmarks, search and
category filtering, voice/speed selection, and keyboard shortcuts.

## File structure

```
src/
├── context/
│   └── SettingsContext.js     # all accessibility + preference state, localStorage-backed
├── hooks/
│   ├── useLocalStorage.js     # generic persisted state
│   ├── useSpeech.js           # speech synthesis + word-boundary tracking + voices
│   └── useKeyboardShortcut.js # single global key-binding hook
├── components/
│   ├── Header.js
│   ├── Controls.js            # contrast / font / easy mode / motion / voice / speed
│   ├── SearchBar.js
│   ├── CategoryFilter.js      # category chips + "bookmarked only" filter
│   ├── ArticleCard.js         # word-highlighted read-aloud, bookmark, pause/resume
│   ├── EmptyState.js
│   ├── SkipToContent.js
│   └── KeyboardShortcutsModal.js
├── data/
│   └── articles.js            # 8 dummy articles across 4 categories
├── utils/
│   ├── estimateReadingTime.js
│   └── splitWords.js          # tokenizes article text for highlight matching
├── App.js
├── App.css
└── index.js
```

## New features over the basic version

- **Persisted settings** — contrast, font size, easy mode, reduce motion,
  speech rate, voice choice, and bookmarks all survive a page reload via
  `useLocalStorage`.
- **Word-by-word read-aloud highlighting** — `useSpeech` listens to the
  utterance's `boundary` event and reports the character range of the
  word currently being spoken; `ArticleCard` maps that back onto the
  article text and highlights the matching word live.
- **Pause / resume** — in addition to stop, each playing article gets a
  pause button using `speechSynthesis.pause()` / `.resume()`.
- **Voice and speed controls** — pick from any voice installed in the
  browser and adjust reading speed from 0.5x to 1.5x.
- **Bookmarks** — star any article; filter to bookmarked-only.
- **Search and category filters** — live text search plus category chips,
  combinable with the bookmark filter. An empty state appears with a
  "clear filters" action when nothing matches.
- **Keyboard shortcuts** — `/` focuses search, `C` toggles contrast, `+`/`-`
  change text size, `E` toggles easy mode, `Esc` stops reading (or closes
  the shortcuts dialog), `?` opens a shortcuts reference dialog.
- **Reduce motion** — a toggle that disables all CSS transitions and
  animations for users sensitive to motion.
- **Skip-to-content link** — a link, hidden until focused, that lets
  keyboard users jump past the header and controls straight to the
  article list.
- **Live region announcements** — a visually-hidden `aria-live="polite"`
  element announces when reading starts, pauses, or stops, for screen
  reader users who aren't looking at the "Reading aloud" badge.
- **Reading time estimates** — each card shows an estimated read time
  based on word count.

## Requirements

- Node.js 16+ and npm

## How to run

```bash
npm install
npm start
```

Opens at `http://localhost:3000`. Run `npm run build` for a production
build.

## Notes on the word-highlighting implementation

The spoken utterance for each article is `"{title}. By {author}. {content}"`,
but only the `content` paragraph is rendered word-by-word in the UI. Since
the `boundary` event's `charIndex` counts from the start of the *whole*
utterance, `ArticleCard` subtracts the known length of the `"{title}. By
{author}. "` prefix before matching the index against `content`'s word
offsets (computed once via `splitWords`). Boundary event support and
granularity (word vs. sentence) vary slightly by browser/engine, so
highlighting may be less precise in some browsers — it degrades
gracefully to no highlight rather than breaking playback.
