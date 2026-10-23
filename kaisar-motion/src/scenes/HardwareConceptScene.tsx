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
import { ArrowRight, ArrowLeft, ShieldCheck, Power, Cpu, Scan } from 'lucide-react';

export const HardwareConceptScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Left Quotation Card Animation
  const leftCardScale = interpolate(frame, [10, 35], [0.85, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    output: 'perceptual-scale',
  });
  const leftCardOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Right Flow Card Animation
  const rightCardScale = interpolate(frame, [25, 50], [0.85, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    output: 'perceptual-scale',
  });
  const rightCardOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Gate Swing Dynamic Indicator
  const swingAngle = interpolate(
    Math.sin((frame / fps) * Math.PI * 1.5),
    [-1, 1],
    [-25, 25]
  );

  // Exit
  const exitOpacity = interpolate(frame, [240, 270], [1, 0], {
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
          marginBottom: '36px',
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
          PENGADAAN HARDWARE &amp; REKAYASA SISTEM GERBANG
        </span>
        <h2
          style={{
            fontSize: '36px',
            fontWeight: 900,
            color: '#FFFFFF',
            margin: 0,
          }}
        >
          Swing Barrier Gate 1-Channel Bidirectional (Dual Face AI)
        </h2>
      </div>

      {/* Main Grid: Left (Proposal Quotation) | Right (Dual-Direction Mechanics) */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'grid',
          gridTemplateColumns: '1fr 1.25fr',
          gap: '30px',
          flex: 1,
        }}
      >
        {/* Left: Proposal Card */}
        <div
          style={{
            opacity: leftCardOpacity,
            scale: leftCardScale,
            borderRadius: '24px',
            backgroundColor: '#0F172A',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Rincian Investasi Paket
              </h3>
              <span
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(52, 211, 153, 0.15)',
                  border: '1px solid #34D399',
                  color: '#34D399',
                  fontSize: '13px',
                  fontWeight: 800,
                }}
              >
                All-In Pasang &amp; Setting
              </span>
            </div>

            {/* Quotation Image Preview */}
            <div
              style={{
                borderRadius: '14px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '16px',
                height: '170px',
                backgroundColor: '#070D1E',
              }}
            >
              <Img
                src={staticFile('assets/hardware-quotation.png')}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            {/* Hardware Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#CBD5E1' }}>
                <span>1. Swing Barrier Gate SS304 EGS012</span>
                <span style={{ fontWeight: 800, color: '#FFFFFF' }}>Rp 23.000.000</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#CBD5E1' }}>
                <span>2. Entragate IMS Controller (API)</span>
                <span style={{ fontWeight: 800, color: '#FFFFFF' }}>Rp 6.000.000</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#CBD5E1' }}>
                <span>3. Dual Reader Face Dome AI (IN &amp; OUT)</span>
                <span style={{ fontWeight: 800, color: '#FFFFFF' }}>Rp 10.000.000</span>
              </div>
            </div>
          </div>

          {/* Total Price Banner */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 192, 103, 0.12)',
              border: '1px solid rgba(255, 192, 103, 0.4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#FFC067' }}>
              TOTAL PENGADAAN &amp; PASANG
            </span>
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Rp 39.000.000
            </span>
          </div>
        </div>

        {/* Right: 1-Channel Bidirectional Mechanics */}
        <div
          style={{
            opacity: rightCardOpacity,
            scale: rightCardScale,
            borderRadius: '24px',
            backgroundColor: '#0F172A',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}
        >
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px 0' }}>
              Mekanisme 1 Lorong Dua Arah (Bidirectional)
            </h3>
            <p style={{ fontSize: '14px', color: '#94A3B8', margin: '0 0 20px 0' }}>
              Hemat tempat &amp; biaya: 1 pasang pedestal melayani arus masuk dan keluar bergantian.
            </p>

            {/* Visual Direction Blocks */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              {/* Sisi Masuk (ENTER) */}
              <div
                style={{
                  padding: '18px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(52, 211, 153, 0.08)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34D399', marginBottom: '8px' }}>
                  <ArrowRight size={18} />
                  <span style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase' }}>
                    ARAH MASUK (ENTER)
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#E2E8F0', lineHeight: '1.5' }}>
                  • Face Reader Luar mendeteksi wajah member.<br />
                  • Status aktif ➔ Daun akrilik mengayun buka ke <strong>DALAM</strong>.<br />
                  • Kecepatan respon ultra-cepat ≤ 0.4 detik.
                </div>
              </div>

              {/* Sisi Keluar (EXIT) */}
              <div
                style={{
                  padding: '18px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(96, 165, 250, 0.08)',
                  border: '1px solid rgba(96, 165, 250, 0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60A5FA', marginBottom: '8px' }}>
                  <ArrowLeft size={18} />
                  <span style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase' }}>
                    ARAH KELUAR (EXIT)
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#E2E8F0', lineHeight: '1.5' }}>
                  • Face Reader Dalam mendeteksi member selesai latihan.<br />
                  • Daun akrilik mengayun buka ke <strong>LUAR</strong>.<br />
                  • Sistem mencatat jam keluar &amp; durasi latihan riil.
                </div>
              </div>
            </div>
          </div>

          {/* Safety & Fail-Safe Footer Callout */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '16px',
              backgroundColor: '#070D1E',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(255, 192, 103, 0.2)', color: '#FFC067' }}>
              <Power size={20} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
                Fitur Keselamatan Gedung (Fail-Safe Emergency)
              </div>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                Jika terjadi pemadaman listrik atau alarm kebakaran, motor DC otomatis melepas kunci dan daun akrilik bebas didorong untuk evakuasi aman.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
