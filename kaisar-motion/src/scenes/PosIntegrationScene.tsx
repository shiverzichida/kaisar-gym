import React from 'react';
import {
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Background } from '../components/Background';
import {
  CheckCircle,
  XCircle,
  Clock,
  PauseCircle,
  Server,
  ScanFace,
  SlidersHorizontal,
} from 'lucide-react';

export const PosIntegrationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Flow animation pulses
  const flowProgress = interpolate(frame, [15, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const cardsScale = interpolate(frame, [40, 65], [0.85, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    output: 'perceptual-scale',
  });
  const cardsOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Exit
  const exitOpacity = interpolate(frame, [240, 270], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const statusRules = [
    {
      status: 'ACTIVE',
      action: 'ALLOW (Buka Gate)',
      desc: 'Paket lunas & masa aktif valid. Gate mengayun terbuka dalam ≤ 0.4s.',
      icon: CheckCircle,
      color: '#34D399',
      border: 'rgba(52, 211, 153, 0.3)',
      bg: 'rgba(52, 211, 153, 0.08)',
    },
    {
      status: 'MENUNGGU AKTIVASI',
      action: 'DENY (Tolak)',
      desc: 'Paket sudah dibeli tapi tanggal aktivasi belum tiba. Kasir bisa atur kapan mulai aktif.',
      icon: Clock,
      color: '#FFC067',
      border: 'rgba(255, 192, 103, 0.3)',
      bg: 'rgba(255, 192, 103, 0.08)',
    },
    {
      status: 'CUTI (FREEZE)',
      action: 'DENY (Tolak)',
      desc: 'Member sedang mengambil izin cuti resmi. Akses dikunci hingga masa cuti selesai.',
      icon: PauseCircle,
      color: '#60A5FA',
      border: 'rgba(96, 165, 250, 0.3)',
      bg: 'rgba(96, 165, 250, 0.08)',
    },
    {
      status: 'EXPIRED',
      action: 'DENY (Tolak)',
      desc: 'Masa membership habis. Buzzer merah berbunyi & kasir menawarkan perpanjangan.',
      icon: XCircle,
      color: '#F43F5E',
      border: 'rgba(244, 63, 94, 0.3)',
      bg: 'rgba(244, 63, 94, 0.08)',
    },
  ];

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
          marginBottom: '30px',
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
          LOGIKA BISNIS &amp; INTEGRASI REAL-TIME
        </span>
        <h2
          style={{
            fontSize: '36px',
            fontWeight: 900,
            color: '#FFFFFF',
            margin: 0,
          }}
        >
          Aliran Data: Reader Face ➔ Controller ➔ Backend POS Kaisar Gym
        </h2>
      </div>

      {/* Top Architecture Flow Bar */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 28px',
          borderRadius: '20px',
          backgroundColor: '#0F172A',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '26px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', borderRadius: '12px', backgroundColor: 'rgba(255, 192, 103, 0.15)', color: '#FFC067' }}>
            <ScanFace size={22} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>1. Face Dome AI</div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Scan Wajah / QR / RFID</div>
          </div>
        </div>

        <div style={{ color: '#FFC067', fontWeight: 800, fontSize: '14px' }}>➔ LAN ➔</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', borderRadius: '12px', backgroundColor: 'rgba(96, 165, 250, 0.15)', color: '#60A5FA' }}>
            <Server size={22} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>2. Entragate Controller</div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>HTTP POST /attendance API</div>
          </div>
        </div>

        <div style={{ color: '#FFC067', fontWeight: 800, fontSize: '14px' }}>➔ REST ➔</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', borderRadius: '12px', backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34D399' }}>
            <SlidersHorizontal size={22} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>3. Backend POS Kaisar Gym</div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Cek Status Member &amp; Sesi PT</div>
          </div>
        </div>
      </div>

      {/* 4 Status Decision Cards */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '18px',
          opacity: cardsOpacity,
          scale: cardsScale,
          marginBottom: '22px',
        }}
      >
        {statusRules.map((rule, idx) => {
          const IconComp = rule.icon;
          return (
            <div
              key={idx}
              style={{
                padding: '20px',
                borderRadius: '20px',
                backgroundColor: rule.bg,
                border: `1px solid ${rule.border}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: rule.color, marginBottom: '8px' }}>
                  <IconComp size={18} />
                  <span style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}>
                    {rule.status}
                  </span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
                  {rule.action}
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.4' }}>
                  {rule.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Kasir Override Callout */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '14px 22px',
          borderRadius: '16px',
          backgroundColor: '#0F172A',
          border: '1px solid rgba(255, 192, 103, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#CBD5E1' }}>
          💡 <strong style={{ color: '#FFC067' }}>Tombol Buka Gate Manual di POS Kasir:</strong> Resepsionis memiliki tombol 1-klik di layar POS untuk membuka gerbang bagi tamu VIP, trial class, atau teknisi tanpa perlu scan wajah.
        </span>
        <span style={{ padding: '6px 14px', borderRadius: '10px', backgroundColor: '#FFC067', color: '#070D1E', fontSize: '11px', fontWeight: 900 }}>
          KONTROL RESEPSIONIS
        </span>
      </div>
    </div>
  );
};
