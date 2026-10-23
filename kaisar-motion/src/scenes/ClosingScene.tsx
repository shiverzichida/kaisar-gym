import React from 'react';
import {
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Background } from '../components/Background';
import { ShieldCheck, Award, Zap } from 'lucide-react';

export const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance
  const scale = interpolate(frame, [0, 30], [0.85, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    output: 'perceptual-scale',
  });
  const opacity = interpolate(frame, [0, 25], [0, 1], {
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
        justifyContent: 'center',
        padding: '60px 80px',
      }}
    >
      <Background />

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          maxWidth: '960px',
          opacity,
          scale,
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '9999px',
            border: '3px solid rgba(255, 192, 103, 0.6)',
            boxShadow: '0 0 40px rgba(255, 192, 103, 0.3)',
            overflow: 'hidden',
            margin: '0 auto 24px auto',
            backgroundColor: '#0F172A',
          }}
        >
          <Img
            src={staticFile('assets/logo.png')}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <h2
          style={{
            fontSize: '42px',
            fontWeight: 900,
            color: '#FFFFFF',
            margin: '0 0 16px 0',
            letterSpacing: '-0.02em',
          }}
        >
          Siap Mengawal Kaisar Gym Menuju Standar Mega-Gym Modern
        </h2>

        <p
          style={{
            fontSize: '18px',
            color: '#CBD5E1',
            lineHeight: '1.6',
            margin: '0 auto 36px auto',
            maxWidth: '800px',
          }}
        >
          Kombinasi Swing Barrier Gate SUS304, Dual Face Dome AI, dan Enterprise POS Kaisar Gym memberikan proteksi omset 100%, efisiensi staf maksimal, dan gengsi tak tertandingi di Pontianak.
        </p>

        {/* Zag Digital Indonesia Footer Signature */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '20px',
            padding: '16px 36px',
            borderRadius: '24px',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '14px',
              border: '2px solid rgba(59, 130, 246, 0.5)',
              overflow: 'hidden',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
            }}
          >
            <Img
              src={staticFile('assets/zag-logo.png')}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block' }}>
              Konsultan &amp; Pengembang Teknologi
            </span>
            <span style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.02em', marginTop: '2px', display: 'block' }}>
              ZAG DIGITAL INDONESIA
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFC067', marginTop: '2px', display: 'block' }}>
              Smart Connected Gym Solutions • Pontianak
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
