import React, { forwardRef } from "react";

// forwardRef so App can focus this input in response to the "/" keyboard shortcut.
const SearchBar = forwardRef(function SearchBar({ value, onChange }, ref) {
  return (
    <div className="anr-search">
      <label htmlFor="anr-search-input" className="anr-search-label">
        Search articles
      </label>
      <div className="anr-search-input-wrap">
        <span aria-hidden="true" className="anr-search-icon">
          &#128269;
        </span>
        <input
          ref={ref}
          id="anr-search-input"
          type="search"
          className="anr-search-input"
          placeholder="Search by title or keyword… (press / to focus)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <button
            type="button"
            className="anr-search-clear"
            onClick={() => onChange("")}
            aria-label="Clear search"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
});

export default SearchBar;
