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
import { ShieldCheck, Cpu, Zap } from 'lucide-react';

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo entrance animation
  const logoScale = interpolate(frame, [0, 25], [0.3, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    output: 'perceptual-scale',
  });

  const logoOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Text entrance
  const textTranslateY = interpolate(frame, [15, 40], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const textOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Badge entrance
  const badgeScale = interpolate(frame, [30, 50], [0.8, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    output: 'perceptual-scale',
  });

  const badgeOpacity = interpolate(frame, [30, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Exit transition
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
        alignItems: 'center',
        justifyContent: 'center',
        opacity: exitOpacity,
      }}
    >
      <Background />

      {/* Main Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '0 80px',
        }}
      >
        {/* Creator Pill with Logo */}
        <div
          style={{
            opacity: logoOpacity,
            scale: logoScale,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 24px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 192, 103, 0.12)',
            border: '1px solid rgba(255, 192, 103, 0.4)',
            color: '#FFC067',
            fontSize: '15px',
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '28px',
            boxShadow: '0 0 20px rgba(255, 192, 103, 0.2)',
          }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              overflow: 'hidden',
            }}
          >
            <Img
              src={staticFile('assets/zag-logo.png')}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <span>Zag Digital Indonesia • Master Proposal</span>
        </div>

        {/* Dual Partner Logos (Zag Digital × Kaisar Gym) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            marginBottom: '26px',
            opacity: logoOpacity,
            scale: logoScale,
          }}
        >
          {/* Zag Digital Logo */}
          <div
            style={{
              width: '130px',
              height: '130px',
              borderRadius: '26px',
              border: '2px solid rgba(59, 130, 246, 0.6)',
              boxShadow: '0 0 35px rgba(59, 130, 246, 0.35)',
              overflow: 'hidden',
              backgroundColor: '#0F172A',
            }}
          >
            <Img
              src={staticFile('assets/zag-logo.png')}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Connection Symbol */}
          <div
            style={{
              fontSize: '32px',
              fontWeight: 900,
              color: '#FFC067',
              textShadow: '0 0 15px rgba(255, 192, 103, 0.5)',
            }}
          >
            ×
          </div>

          {/* Kaisar Gym Logo */}
          <div
            style={{
              width: '130px',
              height: '130px',
              borderRadius: '9999px',
              border: '3px solid rgba(255, 192, 103, 0.6)',
              boxShadow: '0 0 40px rgba(255, 192, 103, 0.35)',
              overflow: 'hidden',
              backgroundColor: '#0F172A',
            }}
          >
            <Img
              src={staticFile('assets/logo.png')}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* Big Title */}
        <div
          style={{
            opacity: textOpacity,
            translate: `0px ${textTranslateY}px`,
          }}
        >
          <h1
            style={{
              fontSize: '48px',
              fontWeight: 900,
              color: '#FFFFFF',
              margin: '0 0 16px 0',
              letterSpacing: '-0.02em',
              textShadow: '0 4px 20px rgba(0,0,0,0.8)',
            }}
          >
            MODERNISASI GERBANG &amp; SISTEM POS
          </h1>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#FFC067',
              margin: '0 0 34px 0',
              letterSpacing: '0.02em',
            }}
          >
            Swing Barrier Gate Bidirectional × Enterprise Gym Management POS
          </h2>
        </div>

        {/* 3 Highlight Badges */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            opacity: badgeOpacity,
            scale: badgeScale,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 24px',
              borderRadius: '16px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#E2E8F0',
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={20} color="#34D399" />
            <span>100% Zero Illegal Access</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 24px',
              borderRadius: '16px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#E2E8F0',
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            <Cpu size={20} color="#FFC067" />
            <span>Dual Face Dome AI (IN &amp; OUT)</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 24px',
              borderRadius: '16px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#E2E8F0',
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            <Zap size={20} color="#60A5FA" />
            <span>Real-Time POS Sync (≤ 0.4s)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
