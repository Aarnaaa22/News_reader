import React from "react";

function EmptyState({ onClear }) {
  return (
    <div className="anr-empty" role="status">
      <p className="anr-empty-title">No articles match your filters</p>
      <p className="anr-empty-body">Try a different search term or category.</p>
      <button type="button" className="anr-toggle-btn" onClick={onClear}>
        Clear filters
      </button>
    </div>
  );
}

export default EmptyState;
