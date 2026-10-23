'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronsRight, ChevronsLeft } from 'lucide-react';

interface TableScrollWrapperProps {
  children: React.ReactNode;
  className?: string;
  label?: string;
}

export default function TableScrollWrapper({
  children,
  className = '',
  label = 'Geser Tabel',
}: TableScrollWrapperProps) {
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [clientWidth, setClientWidth] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const isSyncingRef = useRef(false);

  const measure = useCallback(() => {
    if (!tableContainerRef.current) return;
    const sW = tableContainerRef.current.scrollWidth;
    const cW = tableContainerRef.current.clientWidth;
    const sL = tableContainerRef.current.scrollLeft;
    setScrollWidth(sW);
    setClientWidth(cW);
    setScrollLeft(sL);
  }, []);

  useEffect(() => {
    measure();
    const container = tableContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(container);

    // Also observe the first child (usually table or div)
    if (container.firstElementChild) {
      observer.observe(container.firstElementChild);
    }

    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  // Sync Top -> Table
  const handleTopScroll = () => {
    if (isSyncingRef.current) return;
    if (!topScrollRef.current || !tableContainerRef.current) return;
    isSyncingRef.current = true;
    tableContainerRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    setScrollLeft(topScrollRef.current.scrollLeft);
    requestAnimationFrame(() => {
      isSyncingRef.current = false;
    });
  };

  // Sync Table -> Top
  const handleTableScroll = () => {
    if (isSyncingRef.current) return;
    if (!topScrollRef.current || !tableContainerRef.current) return;
    isSyncingRef.current = true;
    topScrollRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
    setScrollLeft(tableContainerRef.current.scrollLeft);
    requestAnimationFrame(() => {
      isSyncingRef.current = false;
    });
  };

  const scrollByDelta = (delta: number) => {
    if (!tableContainerRef.current) return;
    tableContainerRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const scrollToEdge = (toEnd: boolean) => {
    if (!tableContainerRef.current) return;
    tableContainerRef.current.scrollTo({
      left: toEnd ? scrollWidth : 0,
      behavior: 'smooth',
    });
  };

  const isOverflowing = scrollWidth > clientWidth + 2;
  const maxScroll = Math.max(0, scrollWidth - clientWidth);
  const isAtStart = scrollLeft <= 5;
  const isAtEnd = scrollLeft >= maxScroll - 5;

  return (
    <div className={`w-full relative ${className}`}>
      {/* ══════════════ TOP HORIZONTAL SCROLLBAR BAR ══════════════ */}
      {isOverflowing && (
        <div className="bg-[#070D1E] border-b border-white/10 px-3 py-2 flex items-center justify-between gap-3 text-xs select-none">
          {/* Label Indicator */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold text-slate-300 text-[11px] tracking-wide flex items-center gap-1.5">
              <span>↔</span>
              <span>{label}</span>
            </span>
            <span className="text-[10px] text-slate-500 hidden sm:inline font-mono">
              ({Math.round((scrollLeft / (maxScroll || 1)) * 100)}%)
            </span>
          </div>

          {/* Top Horizontal Scrollbar Slider */}
          <div
            ref={topScrollRef}
            onScroll={handleTopScroll}
            className="overflow-x-auto overflow-y-hidden flex-1 mx-2 h-3.5 scrollbar-thin scrollbar-thumb-cyan-500/80 hover:scrollbar-thumb-cyan-400 scrollbar-track-white/5 rounded-full"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#06b6d4 rgba(255,255,255,0.05)',
            }}
          >
            <div style={{ width: `${scrollWidth}px`, height: '1px' }} />
          </div>

          {/* Quick Scroll Arrow Navigation Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => scrollToEdge(false)}
              disabled={isAtStart}
              className={`p-1 rounded-lg border transition ${
                isAtStart
                  ? 'border-white/5 text-slate-600 cursor-not-allowed opacity-40'
                  : 'border-white/10 bg-[#0F172A] hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
              title="Ke Awal Kolom (Kiri)"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollByDelta(-240)}
              disabled={isAtStart}
              className={`p-1 rounded-lg border transition ${
                isAtStart
                  ? 'border-white/5 text-slate-600 cursor-not-allowed opacity-40'
                  : 'border-white/10 bg-[#0F172A] hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
              title="Geser Kiri (-240px)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollByDelta(240)}
              disabled={isAtEnd}
              className={`p-1 rounded-lg border transition ${
                isAtEnd
                  ? 'border-white/5 text-slate-600 cursor-not-allowed opacity-40'
                  : 'border-white/10 bg-[#0F172A] hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
              title="Geser Kanan (+240px)"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollToEdge(true)}
              disabled={isAtEnd}
              className={`p-1 rounded-lg border transition ${
                isAtEnd
                  ? 'border-white/5 text-slate-600 cursor-not-allowed opacity-40'
                  : 'border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold'
              }`}
              title="Ke Kolom Aksi / Ujung Kanan"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ MAIN SCROLLABLE TABLE CONTAINER ══════════════ */}
      <div
        ref={tableContainerRef}
        onScroll={handleTableScroll}
        className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
      >
        {children}
      </div>
    </div>
  );
}
