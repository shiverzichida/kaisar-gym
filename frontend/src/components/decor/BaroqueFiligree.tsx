'use client';

import React from 'react';

export const BaroqueCorner = ({
  position = 'top-left',
  className = '',
  size = 48,
}: {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
  size?: number;
}) => {
  const rotation = {
    'top-left': 'rotate(0deg)',
    'top-right': 'rotate(90deg)',
    'bottom-right': 'rotate(180deg)',
    'bottom-left': 'rotate(270deg)',
  }[position];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: rotation }}
      className={`pointer-events-none absolute select-none ${className}`}
    >
      <defs>
        <linearGradient id="goldFiligreeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="35%" stopColor="#F59E0B" />
          <stop offset="70%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#F59E0B" floodOpacity="0.5" />
        </filter>
      </defs>
      <g filter="url(#goldGlow)" stroke="url(#goldFiligreeGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Outer Corner Frame */}
        <path d="M 6 50 L 6 12 Q 6 6 12 6 L 50 6" strokeWidth="3" />
        <path d="M 12 50 L 12 18 Q 12 12 18 12 L 50 12" strokeWidth="1.5" opacity="0.8" />
        
        {/* Baroque Acanthus Scrolls */}
        <path d="M 6 6 Q 25 25 28 42 Q 30 52 24 56 Q 16 58 16 46 Q 16 34 32 30 Q 45 28 55 20 Q 62 14 55 8 Q 48 2 38 12" fill="url(#goldFiligreeGrad)" fillOpacity="0.25" />
        <path d="M 6 6 Q 25 25 42 28 Q 52 30 56 24 Q 58 16 46 16 Q 34 16 30 32 Q 28 45 20 55 Q 14 62 8 55 Q 2 48 12 38" fill="url(#goldFiligreeGrad)" fillOpacity="0.25" />
        
        {/* Inner flourish rosette */}
        <circle cx="22" cy="22" r="4.5" fill="url(#goldFiligreeGrad)" />
        <circle cx="22" cy="22" r="2" fill="#FEF3C7" />
        <circle cx="36" cy="14" r="2" fill="url(#goldFiligreeGrad)" />
        <circle cx="14" cy="36" r="2" fill="url(#goldFiligreeGrad)" />
      </g>
    </svg>
  );
};

export const BaroqueBottomOrnament = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`pointer-events-none flex items-center justify-center select-none ${className}`}>
      <svg
        width="280"
        height="32"
        viewBox="0 0 280 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-[320px] drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]"
      >
        <defs>
          <linearGradient id="goldHGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#78350F" stopOpacity="0" />
            <stop offset="25%" stopColor="#D97706" />
            <stop offset="50%" stopColor="#FDE68A" />
            <stop offset="75%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Horizontal wing rules */}
        <path d="M 10 16 L 110 16" stroke="url(#goldHGrad)" strokeWidth="2" />
        <path d="M 170 16 L 270 16" stroke="url(#goldHGrad)" strokeWidth="2" />
        {/* Central classical palmette / anthemion motif */}
        <path
          d="M 140 4 Q 135 12 124 14 Q 116 16 122 22 Q 130 26 136 18 L 140 28 L 144 18 Q 150 26 158 22 Q 164 16 156 14 Q 145 12 140 4 Z"
          fill="url(#goldHGrad)"
        />
        <circle cx="140" cy="16" r="3.5" fill="#FEF3C7" />
        <circle cx="118" cy="16" r="2" fill="#F59E0B" />
        <circle cx="162" cy="16" r="2" fill="#F59E0B" />
      </svg>
    </div>
  );
};
