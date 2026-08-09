import React from "react";

// Visually hidden until focused. Lets keyboard and screen reader users
// jump straight past the header and controls to the article list.
function SkipToContent({ targetId = "main-content" }) {
  return (
    <a href={`#${targetId}`} className="anr-skip-link">
      Skip to articles
    </a>
  );
}

export default SkipToContent;
