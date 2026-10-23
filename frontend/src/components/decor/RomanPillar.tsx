'use client';

import React from 'react';

export default function RomanPillar({
  side = 'left',
  className = '',
}: {
  side?: 'left' | 'right';
  className?: string;
}) {
  return (
    <div
      className={`hidden 2xl:flex flex-col items-center w-12 shrink-0 select-none pointer-events-none opacity-85 transition-opacity duration-300 hover:opacity-100 ${className}`}
      aria-hidden="true"
    >
      {/* Capital (Top Crown / Molding) */}
      <div className="w-full h-14 flex flex-col items-center justify-end relative">
        {/* Abacus top slab */}
        <div className="w-11 h-2 rounded-t-sm bg-gradient-to-r from-[#78350F] via-[#FBBF24] to-[#78350F] shadow-[0_2px_8px_rgba(245,158,11,0.3)]" />
        {/* Echinus / Scroll molding */}
        <div className="w-10 h-3 bg-gradient-to-b from-[#1E293B] to-[#0F172A] border-x border-b border-[#F59E0B]/50 flex items-center justify-between px-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FBBF24]/80 shadow-[0_0_4px_#F59E0B]" />
          <div className="w-3 h-0.5 bg-[#FBBF24]/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#FBBF24]/80 shadow-[0_0_4px_#F59E0B]" />
        </div>
        {/* Necking ring */}
        <div className="w-8 h-1.5 bg-gradient-to-r from-[#92400E] via-[#FDE68A] to-[#92400E]" />
      </div>

      {/* Fluted Shaft (Vertical Column) */}
      <div className="w-8 flex-1 min-h-[500px] relative bg-gradient-to-r from-[#0B132B] via-[#152244] to-[#0B132B] border-x border-[#F59E0B]/40 shadow-[inset_0_0_12px_rgba(0,0,0,0.8)] flex justify-evenly px-0.5">
        {/* Flute lines */}
        <div className="w-[1.5px] h-full bg-gradient-to-b from-[#F59E0B]/30 via-white/10 to-[#F59E0B]/20 shadow-[1px_0_2px_rgba(0,0,0,0.8)]" />
        <div className="w-[1.5px] h-full bg-gradient-to-b from-[#F59E0B]/40 via-white/15 to-[#F59E0B]/30 shadow-[1px_0_2px_rgba(0,0,0,0.8)]" />
        <div className="w-[1.5px] h-full bg-gradient-to-b from-[#F59E0B]/50 via-white/20 to-[#F59E0B]/40 shadow-[1px_0_2px_rgba(0,0,0,0.8)]" />
        <div className="w-[1.5px] h-full bg-gradient-to-b from-[#F59E0B]/40 via-white/15 to-[#F59E0B]/30 shadow-[1px_0_2px_rgba(0,0,0,0.8)]" />
        <div className="w-[1.5px] h-full bg-gradient-to-b from-[#F59E0B]/30 via-white/10 to-[#F59E0B]/20 shadow-[1px_0_2px_rgba(0,0,0,0.8)]" />
      </div>

      {/* Plinth / Base (Bottom Molding) */}
      <div className="w-full h-14 flex flex-col items-center justify-start relative">
        {/* Torus upper ring */}
        <div className="w-8 h-1.5 bg-gradient-to-r from-[#92400E] via-[#FDE68A] to-[#92400E]" />
        {/* Base block */}
        <div className="w-10 h-3 bg-gradient-to-t from-[#1E293B] to-[#0F172A] border-x border-t border-[#F59E0B]/50" />
        {/* Bottom plinth slab */}
        <div className="w-11 h-3 rounded-b-sm bg-gradient-to-r from-[#78350F] via-[#FBBF24] to-[#78350F] shadow-[0_-2px_8px_rgba(245,158,11,0.3)]" />
      </div>
    </div>
  );
}
