'use client';

import React, { useState } from 'react';
import { formatRp } from '@/lib/api';
import { TrendingUp, ChevronDown } from 'lucide-react';

interface DailyDataPoint {
  date: string;
  revenue: number;
}

const defaultMonthlyData: DailyDataPoint[] = [
  { date: '2026-10-01', revenue: 23500000 },
  { date: '2026-10-02', revenue: 14200000 },
  { date: '2026-10-03', revenue: 18600000 },
  { date: '2026-10-04', revenue: 7800000 },
  { date: '2026-10-05', revenue: 42100000 },
  { date: '2026-10-06', revenue: 31400000 },
  { date: '2026-10-07', revenue: 27500000 },
  { date: '2026-10-08', revenue: 18700000 },
  { date: '2026-10-09', revenue: 27200000 },
  { date: '2026-10-10', revenue: 29400000 },
  { date: '2026-10-11', revenue: 3500000 },
  { date: '2026-10-17', revenue: 1200000 },
  { date: '2026-10-18', revenue: 2450000 },
  { date: '2026-10-19', revenue: 3768100 },
];

export default function MonthlyRevenueChart({
  analyticsData,
}: {
  analyticsData?: any;
}) {
  const [selectedMonth, setSelectedMonth] = useState('October 2026');
  const [chartMode, setChartMode] = useState<'line' | 'category'>('line');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data = defaultMonthlyData;
  const maxY = 45000000;
  const ySteps = [45000000, 40000000, 35000000, 30000000, 25000000, 20000000, 15000000, 10000000, 5000000, 0];

  // SVG Chart Dimensions
  const svgWidth = 900;
  const svgHeight = 320;
  const padLeft = 85;
  const padRight = 35;
  const padTop = 30;
  const padBottom = 65;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  // Calculate points coordinates
  const points = data.map((d, i) => {
    const x = padLeft + (i / (data.length - 1)) * chartW;
    const y = padTop + chartH - (d.revenue / maxY) * chartH;
    return { ...d, x, y };
  });

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  // Build smooth bezier curve path
  const buildSmoothPath = () => {
    if (points.length === 0) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx = (p0.x + p1.x) / 2;
      path += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const linePath = buildSmoothPath();
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`
    : '';

  // Category breakdown
  const membershipRev = analyticsData?.summary?.membershipRevenue || 1673000;
  const ptRev = analyticsData?.summary?.ptRevenue || 2100000;
  const retailRev = analyticsData?.summary?.retailRevenue || 50000;
  const totalCat = membershipRev + ptRev + retailRev || 3823000;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-5 shadow-lg relative overflow-hidden">
      {/* Top Header Row matching modern SaaS dashboard */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/10 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white font-serif tracking-tight flex items-center gap-2">
              <span>Pendapatan Bulanan</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Grafik histori omset harian kasir &amp; membership gym
            </p>
          </div>
        </div>

        {/* Right: Dropdown Bulan Selector matching reference image */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 font-sans">Bulan:</span>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-[#0F172A] hover:bg-[#1E293B] border border-white/15 focus:border-[#FFC067] text-white text-xs font-bold py-1.5 pl-3 pr-8 rounded-xl cursor-pointer focus:outline-none transition shadow-sm"
              >
                <option value="October 2026">October 2026</option>
                <option value="September 2026">September 2026</option>
                <option value="August 2026">August 2026</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-[#0B132B] border border-white/10 text-xs">
            <button
              onClick={() => setChartMode('line')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                chartMode === 'line'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Harian (Line)
            </button>
            <button
              onClick={() => setChartMode('category')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                chartMode === 'category'
                  ? 'bg-[#FFC067]/20 text-[#FFC067] border border-[#FFC067]/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Kategori
            </button>
          </div>
        </div>
      </div>

      {chartMode === 'line' ? (
        <div className="relative z-10">
          {/* Legend row with fixed height to prevent ANY layout shift/jitter */}
          <div className="flex items-center justify-between mb-2 min-h-[32px]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 rounded border-2 border-emerald-500 bg-emerald-500/30 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <span className="text-xs font-bold text-slate-200">Pendapatan</span>
            </div>

            {/* Stable header info badge (zero layout shift) */}
            <div
              className={`text-xs font-bold px-3 py-1 rounded-lg bg-[#0F172A] border border-emerald-500/40 text-emerald-300 transition-opacity duration-150 ${
                hoveredPoint ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <span>{hoveredPoint?.date || '2026-10-01'}</span>: <span className="font-mono">{formatRp(hoveredPoint?.revenue || 0)}</span>
            </div>
          </div>

          {/* Responsive SVG Chart */}
          <div className="w-full overflow-x-auto">
            <div className="min-w-[650px] w-full">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto select-none"
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <defs>
                  <linearGradient id="curveAreaGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
                    <stop offset="50%" stopColor="#10B981" stopOpacity="0.20" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
                  </linearGradient>
                  <filter id="pointGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10B981" floodOpacity="0.8" />
                  </filter>
                </defs>

                {/* Horizontal Grid Lines & Y-Labels (passive) */}
                {ySteps.map((val) => {
                  const y = padTop + chartH - (val / maxY) * chartH;
                  return (
                    <g key={val} pointerEvents="none">
                      <line
                        x1={padLeft}
                        y1={y}
                        x2={svgWidth - padRight}
                        y2={y}
                        stroke="#334155"
                        strokeOpacity="0.35"
                        strokeWidth="1"
                      />
                      <text
                        x={padLeft - 12}
                        y={y + 4}
                        textAnchor="end"
                        className="text-[11px] font-mono fill-slate-400 select-none"
                      >
                        {val.toLocaleString('id-ID')}
                      </text>
                    </g>
                  );
                })}

                {/* Bottom Baseline */}
                <line
                  x1={padLeft}
                  y1={padTop + chartH}
                  x2={svgWidth - padRight}
                  y2={padTop + chartH}
                  stroke="#64748B"
                  strokeWidth="1.5"
                  pointerEvents="none"
                />

                {/* Shaded Area under Curve */}
                <path d={areaPath} fill="url(#curveAreaGreen)" pointerEvents="none" />

                {/* Green Smooth Spline Curve */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pointerEvents="none"
                />

                {/* Passive Dots on Curve */}
                {points.map((pt, idx) => (
                  <circle
                    key={`dot-${pt.date}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredIndex === idx ? 6.5 : 4}
                    fill={hoveredIndex === idx ? '#FFFFFF' : '#FFFFFF'}
                    stroke="#10B981"
                    strokeWidth={hoveredIndex === idx ? 3 : 2.5}
                    pointerEvents="none"
                    filter={hoveredIndex === idx ? 'url(#pointGlow)' : undefined}
                    className="transition-all duration-150"
                  />
                ))}

                {/* X Axis Date Labels (pointer-events-none to prevent font/glyph boundary jitter) */}
                {points.map((pt, idx) => {
                  const isHovered = hoveredIndex === idx;
                  return (
                    <text
                      key={`label-${pt.date}`}
                      x={pt.x}
                      y={padTop + chartH + 18}
                      textAnchor="end"
                      transform={`rotate(-45, ${pt.x}, ${padTop + chartH + 18})`}
                      pointerEvents="none"
                      className={`text-[9.5px] font-mono select-none transition-colors duration-150 ${
                        isHovered ? 'fill-emerald-300 font-bold' : 'fill-slate-400'
                      }`}
                    >
                      {pt.date}
                    </text>
                  );
                })}

                {/* Active Hover Guide Line & Floating Tooltip */}
                {hoveredPoint && (
                  <g pointerEvents="none">
                    {/* Vertical Dash Guideline */}
                    <line
                      x1={hoveredPoint.x}
                      y1={padTop}
                      x2={hoveredPoint.x}
                      y2={padTop + chartH}
                      stroke="#10B981"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      opacity="0.75"
                    />
                    {/* Floating Tooltip Box */}
                    <g
                      transform={`translate(${Math.min(
                        Math.max(hoveredPoint.x, padLeft + 65),
                        svgWidth - padRight - 65
                      )}, ${Math.max(padTop + 24, hoveredPoint.y - 22)})`}
                    >
                      <rect
                        x="-65"
                        y="-14"
                        width="130"
                        height="28"
                        rx="8"
                        fill="#0A1128"
                        stroke="#10B981"
                        strokeWidth="1.5"
                        className="shadow-2xl"
                      />
                      <text
                        textAnchor="middle"
                        y="4"
                        fill="#34D399"
                        fontSize="11"
                        fontWeight="bold"
                        className="font-mono"
                      >
                        {formatRp(hoveredPoint.revenue)}
                      </text>
                    </g>
                  </g>
                )}

                {/* Transparent Hit Slices - Solid vertical zones that eliminate ANY jittering */}
                {points.map((pt, idx) => {
                  const sliceWidth = chartW / (points.length - 1);
                  const xStart = idx === 0
                    ? padLeft - 15
                    : pt.x - sliceWidth / 2;
                  const xSpan = idx === 0 || idx === points.length - 1
                    ? sliceWidth / 2 + 15
                    : sliceWidth;

                  return (
                    <rect
                      key={`slice-${pt.date}`}
                      x={xStart}
                      y={padTop}
                      width={xSpan}
                      height={chartH + padBottom}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(idx)}
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      ) : (
        /* Category Breakdown View */
        <div className="relative z-10 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-b from-[#0F172A] to-[#0A1128] border border-emerald-500/30 space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Paket Membership Gym
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {formatRp(membershipRev)}
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className="bg-emerald-400 h-2 rounded-full"
                style={{ width: `${Math.round((membershipRev / totalCat) * 100)}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 block">
              {Math.round((membershipRev / totalCat) * 100)}% dari total pendapatan bulanan
            </span>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-b from-[#0F172A] to-[#0A1128] border border-indigo-500/30 space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Paket Personal Trainer (PT)
            </span>
            <div className="text-2xl font-black text-indigo-400 font-mono">
              {formatRp(ptRev)}
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className="bg-indigo-400 h-2 rounded-full"
                style={{ width: `${Math.round((ptRev / totalCat) * 100)}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 block">
              {Math.round((ptRev / totalCat) * 100)}% dari total pendapatan bulanan
            </span>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-b from-[#0F172A] to-[#0A1128] border border-amber-500/30 space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Retail Kasir, Suplemen &amp; Daily Pass
            </span>
            <div className="text-2xl font-black text-amber-400 font-mono">
              {formatRp(retailRev)}
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className="bg-amber-400 h-2 rounded-full"
                style={{ width: `${Math.max(5, Math.round((retailRev / totalCat) * 100))}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 block">
              {Math.round((retailRev / totalCat) * 100)}% dari total pendapatan bulanan
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
