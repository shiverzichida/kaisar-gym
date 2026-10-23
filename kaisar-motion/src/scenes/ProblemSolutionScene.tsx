import React from 'react';
import {
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Background } from '../components/Background';
import { AlertCircle, CheckCircle2, Lock, Receipt, ScanFace } from 'lucide-react';

export const ProblemSolutionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleY = interpolate(frame, [0, 20], [-20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // 3 Cards Staggered Animation
  const cards = [
    {
      problem: 'Member Liar & Numpang Teman',
      problemDesc: 'Member expired atau tanpa tiket menyelinap saat jam ramai. Potensi rugi puluhan juta/bulan.',
      solution: '100% Zero Illegal Access',
      solutionDesc: 'Swing Barrier elektrik mengunci akses. Hanya member berstatus ACTIVE yang bisa masuk.',
      icon: Lock,
      color: '#34D399',
    },
    {
      problem: 'Kebocoran Kasir & Hitung Manual',
      problemDesc: 'Pencatatan kasir konvensional rawan selisih, nota hilang, dan tanpa rekonsiliasi shift.',
      solution: 'POS Kasir Otomatis & Nota A4',
      solutionDesc: 'Setiap transaksi cetak nota resmi berlogo & cap lunas. Rekonsiliasi modal kasir per shift.',
      icon: Receipt,
      color: '#FFC067',
    },
    {
      problem: 'Kartu Fisik Repot & Hilang',
      problemDesc: 'Member lupa bawa kartu, antre verifikasi manual di meja resepsionis membuat kasir menumpuk.',
      solution: 'Biometrik Face Dome AI',
      solutionDesc: 'Akses bebas sentuh cukup hadapkan wajah. Kecepatan verifikasi ultra-cepat ≤ 0.4 detik.',
      icon: ScanFace,
      color: '#60A5FA',
    },
  ];

  // Exit
  const exitOpacity = interpolate(frame, [180, 210], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '60px 80px',
        opacity: exitOpacity,
      }}
    >
      <Background />

      {/* Header */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          marginBottom: '50px',
          opacity: titleOpacity,
          translate: `0px ${titleY}px`,
        }}
      >
        <span
          style={{
            fontSize: '14px',
            fontWeight: 800,
            color: '#FFC067',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '8px',
          }}
        >
          ANALISIS OPERASIONAL &amp; RETURN OF INVESTMENT
        </span>
        <h2
          style={{
            fontSize: '38px',
            fontWeight: 900,
            color: '#FFFFFF',
            margin: 0,
          }}
        >
          Mengapa Kaisar Gym Perlu Bertransformasi Sekarang?
        </h2>
      </div>

      {/* 3 Split Cards */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          width: '100%',
        }}
      >
        {cards.map((c, i) => {
          const cardDelay = 15 + i * 15;
          const cardOpacity = interpolate(frame, [cardDelay, cardDelay + 20], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const cardScale = interpolate(frame, [cardDelay, cardDelay + 25], [0.85, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: 'perceptual-scale',
          });

          const IconComp = c.icon;

          return (
            <div
              key={i}
              style={{
                opacity: cardOpacity,
                scale: cardScale,
                borderRadius: '24px',
                backgroundColor: '#0F172A',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              {/* Problem Section (Top) */}
              <div style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#F43F5E',
                    fontSize: '13px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>Kondisi Saat Ini (Risiko)</span>
                </div>
                <h3
                  style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    margin: '0 0 8px 0',
                  }}
                >
                  {c.problem}
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#94A3B8',
                    lineHeight: '1.5',
                    margin: 0,
                  }}
                >
                  {c.problemDesc}
                </p>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: '1px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  marginBottom: '20px',
                }}
              />

              {/* Solution Section (Bottom) */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: c.color,
                    fontSize: '13px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Solusi Terpasang</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div
                    style={{
                      padding: '6px',
                      borderRadius: '10px',
                      backgroundColor: `${c.color}20`,
                      color: c.color,
                    }}
                  >
                    <IconComp size={18} />
                  </div>
                  <h4
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      color: c.color,
                      margin: 0,
                    }}
                  >
                    {c.solution}
                  </h4>
                </div>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#CBD5E1',
                    lineHeight: '1.5',
                    margin: 0,
                  }}
                >
                  {c.solutionDesc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
