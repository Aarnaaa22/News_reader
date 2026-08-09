import React from "react";

function CategoryFilter({ categories, activeCategory, onSelect, showBookmarkedOnly, onToggleBookmarkedOnly, bookmarkCount }) {
  return (
    <div className="anr-filters" role="group" aria-label="Filter articles">
      <button
        type="button"
        className={`anr-chip ${activeCategory === "All" ? "is-active" : ""}`}
        onClick={() => onSelect("All")}
        aria-pressed={activeCategory === "All"}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          className={`anr-chip ${activeCategory === cat ? "is-active" : ""}`}
          onClick={() => onSelect(cat)}
          aria-pressed={activeCategory === cat}
        >
          {cat}
        </button>
      ))}
      <button
        type="button"
        className={`anr-chip anr-chip-bookmark ${showBookmarkedOnly ? "is-active" : ""}`}
        onClick={onToggleBookmarkedOnly}
        aria-pressed={showBookmarkedOnly}
      >
        &#9733; Bookmarked ({bookmarkCount})
      </button>
    </div>
  );
}

export default CategoryFilter;
