import React, { useEffect } from "react";
import { useSettings } from "../context/SettingsContext";

function FamilyIntro({ onFinish }) {
  const { reduceMotion } = useSettings();

  useEffect(() => {
    // Total intro duration: ~3.5s standard, ~1.5s when reduceMotion is active
    const duration = reduceMotion ? 1500 : 3500;
    const timer = setTimeout(() => {
      onFinish();
    }, duration);

    return () => clearTimeout(timer);
  }, [onFinish, reduceMotion]);

  return (
    <div className={`anr-family-intro ${reduceMotion ? "is-reduced-motion" : ""}`}>
      <style>{`
        .anr-family-intro {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: var(--bg, #f7f4ed);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          user-select: none;
        }

        .anr-family-card {
          background: var(--surface, #ffffff);
          border: 2px solid var(--border, #e2d9cd);
          border-radius: 28px;
          padding: 2.8rem 2.4rem 2.4rem;
          max-width: 650px;
          width: 100%;
          text-align: center;
          box-shadow: 0 16px 44px rgba(60, 40, 20, 0.1);
          position: relative;
        }

        .anr-family-svg {
          width: 100%;
          height: auto;
          max-height: 310px;
          display: block;
          margin: 0 auto 1.4rem auto;
        }

        .anr-family-title {
          font-family: var(--font-serif, "Lora", serif);
          font-size: 2.25em;
          font-weight: 700;
          color: var(--text, #231f20);
          margin: 0 0 8px 0;
          line-height: 1.2;
        }

        .anr-family-subline {
          font-family: var(--font-sans, "Atkinson Hyperlegible", sans-serif);
          font-size: 1.15em;
          color: var(--text-muted, #5c534e);
          margin: 0;
          animation: anr-subline-fade 0.7s ease-out 0.4s both;
        }

        /* Reunion Walk-In & Sit Animation */
        .anr-fig-arriving {
          animation: anr-reunion-walk-in 1.5s cubic-bezier(0.25, 1, 0.5, 1) 0.5s both;
        }

        .anr-reunion-heart {
          animation: anr-heart-appear 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) 2.0s both;
          transform-origin: 275px 45px;
        }

        @keyframes anr-reunion-walk-in {
          0% {
            transform: translate(-190px, -15px);
            opacity: 0;
          }
          35% {
            transform: translate(-120px, -18px);
            opacity: 1;
          }
          75% {
            transform: translate(-25px, -12px);
          }
          100% {
            transform: translate(0px, 0px);
            opacity: 1;
          }
        }

        @keyframes anr-heart-appear {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes anr-subline-fade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* Reduced Motion Mode Overrides */
        .anr-family-intro.is-reduced-motion .anr-family-card,
        .anr-family-intro.is-reduced-motion .anr-fig-arriving,
        .anr-family-intro.is-reduced-motion .anr-reunion-heart,
        .anr-family-intro.is-reduced-motion .anr-family-subline {
          animation: none !important;
          transform: none !important;
          opacity: 1 !important;
        }
      `}</style>

      <div className="anr-family-card">
        {/* Screen Reader & Keyboard Only Skip Button (Reachable via Tab) */}
        <button
          type="button"
          onClick={onFinish}
          className="anr-sr-only"
        >
          Skip family introduction
        </button>

        <svg
          className="anr-family-svg"
          viewBox="0 0 500 240"
          width="100%"
          height="auto"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Illustration of a family reunion on a cozy sofa, with a family member arriving to join everyone"
        >
          {/* Rug / Floor Line */}
          <rect x="25" y="205" width="450" height="6" rx="3" fill="var(--border, #e2d9cd)" />

          {/* Cozy Lamp & Side Table (Left side) */}
          <line x1="45" y1="165" x2="35" y2="205" stroke="var(--text-muted, #5c534e)" strokeWidth="3" strokeLinecap="round" />
          <line x1="45" y1="165" x2="55" y2="205" stroke="var(--text-muted, #5c534e)" strokeWidth="3" strokeLinecap="round" />
          <rect x="28" y="160" width="34" height="6" rx="3" fill="var(--text-muted, #5c534e)" />
          <rect x="38" y="146" width="10" height="14" rx="2.5" fill="var(--accent, #c84b31)" />
          <line x1="68" y1="160" x2="68" y2="65" stroke="var(--text-muted, #5c534e)" strokeWidth="3" />
          <path d="M52 65 L84 65 L78 45 L58 45 Z" fill="var(--warm-bg, #fef3c7)" stroke="var(--warm, #d97706)" strokeWidth="2.5" />

          {/* Large Cozy Sofa */}
          {/* Backrest */}
          <rect x="100" y="75" width="355" height="95" rx="18" fill="var(--warm-bg, #fef3c7)" stroke="var(--warm, #d97706)" strokeWidth="3" />
          {/* Cushion Division Lines */}
          <line x1="185" y1="85" x2="185" y2="145" stroke="var(--border, #e2d9cd)" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="270" y1="85" x2="270" y2="145" stroke="var(--border, #e2d9cd)" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="355" y1="85" x2="355" y2="145" stroke="var(--border, #e2d9cd)" strokeWidth="2" strokeDasharray="4 4" />

          {/* Sofa Seat Cushion */}
          <rect x="90" y="145" width="375" height="42" rx="12" fill="var(--surface, #ffffff)" stroke="var(--warm, #d97706)" strokeWidth="3" />
          {/* Left & Right Armrests */}
          <rect x="80" y="120" width="26" height="60" rx="11" fill="var(--warm-bg, #fef3c7)" stroke="var(--warm, #d97706)" strokeWidth="3" />
          <rect x="444" y="120" width="26" height="60" rx="11" fill="var(--warm-bg, #fef3c7)" stroke="var(--warm, #d97706)" strokeWidth="3" />
          {/* Sofa Legs */}
          <rect x="105" y="187" width="10" height="15" rx="2" fill="var(--text-muted, #5c534e)" />
          <rect x="435" y="187" width="10" height="15" rx="2" fill="var(--text-muted, #5c534e)" />

          {/* Floating Warm Heart appearing over the reunited family */}
          <g className="anr-reunion-heart">
            <path
              d="M275 42 C275 36, 267 31, 261 37 C254 44, 275 56, 275 56 C275 56, 296 44, 289 37 C283 31, 275 36, 275 42 Z"
              fill="var(--accent, #c84b31)"
            />
          </g>

          {/* Seated Family Members Waiting & Smiling */}

          {/* Figure 1: Grandparent 1 (seated x = 145, looking right at arrival) */}
          <g className="anr-fig-grandparent1">
            <path d="M125 132 C125 110, 165 110, 165 132 L165 168 L125 168 Z" fill="var(--accent, #c84b31)" />
            <circle cx="145" cy="95" r="16" fill="var(--bg, #f7f4ed)" stroke="var(--accent, #c84b31)" strokeWidth="2.5" />
            <path d="M130 95 C130 78, 160 78, 160 95 Z" fill="var(--border, #e2d9cd)" />
            <circle cx="145" cy="95" r="1.5" fill="var(--text, #231f20)" />
            <circle cx="153" cy="95" r="1.5" fill="var(--text, #231f20)" />
            <path d="M144 102 Q150 106 156 102" fill="none" stroke="var(--text, #231f20)" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* Figure 2: Parent 1 (seated x = 225, looking right at arrival) */}
          <g className="anr-fig-parent1">
            <path d="M205 128 C205 105, 245 105, 245 128 L245 168 L205 168 Z" fill="var(--text, #231f20)" />
            <circle cx="225" cy="90" r="17" fill="var(--bg, #f7f4ed)" stroke="var(--text, #231f20)" strokeWidth="2.5" />
            <path d="M208 90 C208 72, 242 72, 242 90 Z" fill="var(--text, #231f20)" />
            <circle cx="224" cy="90" r="1.5" fill="var(--surface, #ffffff)" />
            <circle cx="233" cy="90" r="1.5" fill="var(--surface, #ffffff)" />
            <path d="M223 97 Q229 101 235 97" fill="none" stroke="var(--surface, #ffffff)" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* Figure 3: Child (seated x = 305, looking right with excitement) */}
          <g className="anr-fig-child">
            <path d="M290 138 C290 122, 320 122, 320 138 L320 168 L290 168 Z" fill="var(--warm, #d97706)" />
            <circle cx="305" cy="108" r="13" fill="var(--bg, #f7f4ed)" stroke="var(--warm, #d97706)" strokeWidth="2.5" />
            <path d="M293 108 C293 94, 317 94, 317 108 Z" fill="var(--accent, #c84b31)" />
            <circle cx="303" cy="108" r="1.4" fill="var(--text, #231f20)" />
            <circle cx="311" cy="108" r="1.4" fill="var(--text, #231f20)" />
            <path d="M302 114 Q307 118 312 114" fill="none" stroke="var(--text, #231f20)" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* Figure 4: ARRIVING REUNION FAMILY MEMBER (Walks in & Sits at x = 385!) */}
          <g className="anr-fig-arriving">
            <path d="M365 128 C365 105, 405 105, 405 128 L405 168 L365 168 Z" fill="var(--accent, #c84b31)" />
            <circle cx="385" cy="90" r="17" fill="var(--bg, #f7f4ed)" stroke="var(--accent, #c84b31)" strokeWidth="2.5" />
            <path d="M368 92 C368 74, 402 74, 402 92 Z" fill="var(--text, #231f20)" />
            {/* Eyes looking left at family */}
            <circle cx="377" cy="90" r="1.5" fill="var(--text, #231f20)" />
            <circle cx="386" cy="90" r="1.5" fill="var(--text, #231f20)" />
            {/* Warm reunion smile */}
            <path d="M376 97 Q382 101 388 97" fill="none" stroke="var(--text, #231f20)" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        </svg>

        <h1 className="anr-family-title">Accessible News Reader</h1>
        <p className="anr-family-subline">Built with care, for every generation</p>
      </div>
    </div>
  );
}

export default FamilyIntro;
