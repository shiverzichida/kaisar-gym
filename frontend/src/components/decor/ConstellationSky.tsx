'use client';

import React from 'react';

export default function ConstellationSky({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      {/* Deep cosmic nebula glow gradients */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-600/10 blur-[100px]" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[130px]" />
      <div className="absolute -bottom-20 left-1/3 w-[600px] h-80 rounded-full bg-indigo-700/15 blur-[120px]" />

      {/* Constellation Star Lines SVG */}
      <svg
        className="absolute inset-0 w-full h-full opacity-35"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="starLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#818CF8" stopOpacity="0.5" />
          </linearGradient>
          <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Constellation Cluster Right Header (Cassiopeia / Orion shape) */}
        <g stroke="url(#starLineGrad)" strokeWidth="0.8" strokeDasharray="3 3">
          <line x1="72%" y1="12%" x2="78%" y2="8%" />
          <line x1="78%" y1="8%" x2="84%" y2="14%" />
          <line x1="84%" y1="14%" x2="90%" y2="9%" />
          <line x1="90%" y1="9%" x2="95%" y2="16%" />
          <line x1="78%" y1="8%" x2="82%" y2="22%" />
          <line x1="82%" y1="22%" x2="88%" y2="28%" />
          <line x1="88%" y1="28%" x2="84%" y2="14%" />
        </g>

        {/* Constellation Cluster Left Top */}
        <g stroke="url(#starLineGrad)" strokeWidth="0.8" strokeDasharray="2 4">
          <line x1="32%" y1="18%" x2="38%" y2="12%" />
          <line x1="38%" y1="12%" x2="44%" y2="16%" />
          <line x1="44%" y1="16%" x2="48%" y2="22%" />
          <line x1="48%" y1="22%" x2="42%" y2="26%" />
          <line x1="42%" y1="26%" x2="32%" y2="18%" />
        </g>

        {/* Glowing Major Stars */}
        <g filter="url(#starGlow)">
          <circle cx="72%" cy="12%" r="2.2" fill="#FDE68A" />
          <circle cx="78%" cy="8%" r="3" fill="#FFFFFF" />
          <circle cx="84%" cy="14%" r="2.5" fill="#60A5FA" />
          <circle cx="90%" cy="9%" r="2.8" fill="#FBBF24" />
          <circle cx="95%" cy="16%" r="2" fill="#FFFFFF" />
          <circle cx="82%" cy="22%" r="2" fill="#93C5FD" />
          <circle cx="88%" cy="28%" r="2.6" fill="#FDE68A" />

          <circle cx="32%" cy="18%" r="2.2" fill="#FFFFFF" />
          <circle cx="38%" cy="12%" r="2.6" fill="#FBBF24" />
          <circle cx="44%" cy="16%" r="2" fill="#60A5FA" />
          <circle cx="48%" cy="22%" r="2.4" fill="#FFFFFF" />
          <circle cx="42%" cy="26%" r="2" fill="#FDE68A" />

          {/* Random Ambient Star Dust */}
          <circle cx="15%" cy="35%" r="1" fill="#FFFFFF" opacity="0.6" />
          <circle cx="24%" cy="48%" r="1.5" fill="#FDE68A" opacity="0.7" />
          <circle cx="58%" cy="8%" r="1.2" fill="#93C5FD" opacity="0.6" />
          <circle cx="64%" cy="26%" r="1.4" fill="#FFFFFF" opacity="0.8" />
          <circle cx="18%" cy="75%" r="1" fill="#FBBF24" opacity="0.5" />
          <circle cx="52%" cy="85%" r="1.5" fill="#FFFFFF" opacity="0.7" />
          <circle cx="75%" cy="70%" r="1.2" fill="#60A5FA" opacity="0.6" />
          <circle cx="92%" cy="65%" r="1.4" fill="#FDE68A" opacity="0.7" />
          <circle cx="85%" cy="92%" r="1" fill="#FFFFFF" opacity="0.5" />
        </g>
      </svg>
    </div>
  );
}
