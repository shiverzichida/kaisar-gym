import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export const Background: React.FC<{ accentColor?: string }> = ({
  accentColor = '#FFC067',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Gentle ambient pulse
  const pulse = interpolate(
    Math.sin((frame / fps) * Math.PI * 0.5),
    [-1, 1],
    [0.15, 0.28]
  );

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#070D1E',
        backgroundImage: `
          radial-gradient(circle at 50% 20%, rgba(255, 192, 103, ${pulse}) 0%, transparent 60%),
          radial-gradient(circle at 85% 85%, rgba(52, 211, 153, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 15% 85%, rgba(59, 130, 246, 0.12) 0%, transparent 50%)
        `,
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Subtle Grid Lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 0.8,
        }}
      />

      {/* Top Gold Horizon Glow */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #FFC067, transparent)',
          opacity: 0.8,
        }}
      />
    </div>
  );
};
