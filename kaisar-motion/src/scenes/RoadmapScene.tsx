import React from 'react';
import {
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Background } from '../components/Background';
import { Wrench, Layers, Network, CheckSquare, Rocket } from 'lucide-react';

export const RoadmapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Header entrance
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const steps = [
    {
      day: 'Hari 1',
      title: 'Sipil & Pre-Instalasi',
      desc: 'Pengeboran dynabolt baja ke lantai, penarikan pipa conduit, kabel power AC220V & kabel LAN Cat6.',
      icon: Wrench,
      color: '#FFC067',
    },
    {
      day: 'Hari 2',
      title: 'Pemasangan Fisik',
      desc: 'Anchoring 2 pedestal SUS304, kalibrasi sayap akrilik, dan mounting 2 unit Reader Face Dome AI (IN/OUT).',
      icon: Layers,
      color: '#FFC067',
    },
    {
      day: 'Hari 3',
      title: 'Jaringan & API Sync',
      desc: 'Setting IP statis Entragate Controller, menghubungkan kabel relay trigger, pairing ke Server POS.',
      icon: Network,
      color: '#60A5FA',
    },
    {
      day: 'Hari 4',
      title: 'Testing UAT Menyeluruh',
      desc: 'Simulasi scan member aktif, expired, cuti, pending activation, uji buka dua arah & uji mati lampu.',
      icon: CheckSquare,
      color: '#34D399',
    },
    {
      day: 'Hari 5',
      title: 'Training & Go-Live',
      desc: 'Pelatihan staf kasir/coach mengenai SOP operasional gate, sinkronisasi wajah member & Go-Live resmi!',
      icon: Rocket,
      color: '#34D399',
    },
  ];

  // Exit
  const exitOpacity = interpolate(frame, [150, 180], [1, 0], {
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
        padding: '50px 80px',
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
          marginBottom: '40px',
          opacity: titleOpacity,
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
            marginBottom: '6px',
          }}
        >
          TIMELINE EKSEKUSI PROYEK
        </span>
        <h2
          style={{
            fontSize: '36px',
            fontWeight: 900,
            color: '#FFFFFF',
            margin: 0,
          }}
        >
          Roadmap 5 Hari Kerja: Dari Nol Sampai Siap Digunakan
        </h2>
      </div>

      {/* 5 Step Timeline Cards */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '16px',
          flex: 1,
        }}
      >
        {steps.map((st, i) => {
          const stepDelay = 10 + i * 10;
          const stepScale = interpolate(frame, [stepDelay, stepDelay + 20], [0.85, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: 'perceptual-scale',
          });
          const stepOpacity = interpolate(frame, [stepDelay, stepDelay + 18], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          const IconComp = st.icon;

          return (
            <div
              key={i}
              style={{
                opacity: stepOpacity,
                scale: stepScale,
                borderRadius: '20px',
                backgroundColor: '#0F172A',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '24px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 15px 30px rgba(0,0,0,0.4)',
              }}
            >
              <div>
                {/* Day Badge */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    backgroundColor: `${st.color}20`,
                    color: st.color,
                    fontSize: '12px',
                    fontWeight: 900,
                    marginBottom: '14px',
                    border: `1px solid ${st.color}40`,
                  }}
                >
                  <IconComp size={14} />
                  <span>{st.day}</span>
                </div>

                <h3
                  style={{
                    fontSize: '17px',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    margin: '0 0 10px 0',
                    lineHeight: '1.3',
                  }}
                >
                  {st.title}
                </h3>

                <p
                  style={{
                    fontSize: '12px',
                    color: '#94A3B8',
                    lineHeight: '1.5',
                    margin: 0,
                  }}
                >
                  {st.desc}
                </p>
              </div>

              {/* Step Number Indicator */}
              <div
                style={{
                  height: '4px',
                  borderRadius: '2px',
                  backgroundColor: st.color,
                  marginTop: '16px',
                  opacity: 0.8,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
