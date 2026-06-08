/**
 * SplashScreen
 *
 * Full-screen loading screen shown on initial app load.
 *
 * Props
 * ─────
 * onDone  () => void   Called after the exit animation completes (~3.15 s total).
 *                      Mount this component until onDone fires, then unmount it.
 *
 * Client logo
 * ───────────
 * Swap LOGO_LIGHT / LOGO_DARK below per deployment.
 * The PAI symbol (constellation) is inline SVG — replace DOT_PATHS or the
 * entire <svg> block with the client's icon if needed.
 *
 * Theme detection
 * ───────────────
 * Reads localStorage key "pai-theme". Value "dark" → dark mode, anything else → light.
 *
 * Timeline
 * ────────
 * 0 ms      mount
 * 120 ms    6 constellation dots pop in (staggered 110 ms each)
 * 860 ms    PAI wordmark rises in
 * 2 600 ms  fade-out begins (550 ms ease)
 * 3 150 ms  onDone() fires → unmount
 */

import React, { useState, useEffect } from 'react';

// ─── Client logo — swap these two paths per deployment ───────────────────────
const LOGO_LIGHT = '/assets/logo/pai-wordmark-black.svg';
const LOGO_DARK  = '/assets/logo/pai-wordmark-white.svg';
// ─────────────────────────────────────────────────────────────────────────────

const DOT_PATHS = [
  'M45.6001 5.86863C43.7483 7.72044 43.7483 10.7228 45.6001 12.5746C47.4519 14.4264 50.4543 14.4264 52.3061 12.5746C54.1579 10.7228 54.1579 7.72044 52.3061 5.86863C50.4543 4.01682 47.4519 4.01682 45.6001 5.86863Z',
  'M31.172 15.7265C28.553 18.3455 28.553 22.5917 31.172 25.2107C33.7909 27.8297 38.0372 27.8297 40.6562 25.2107C43.2752 22.5917 43.2752 18.3455 40.6562 15.7265C38.0372 13.1075 33.7909 13.1075 31.172 15.7265Z',
  'M45.2432 32.5381C43.7681 34.0132 43.7681 36.4048 45.2432 37.8799C46.7183 39.355 49.1099 39.355 50.585 37.8799C52.0601 36.4048 52.0601 34.0132 50.585 32.5381C49.1099 31.063 46.7183 31.063 45.2432 32.5381Z',
  'M17.714 29.9422C14.7862 32.8701 14.786 37.6173 17.7138 40.5452C20.6417 43.473 25.3889 43.4728 28.3168 40.545C31.2447 37.6171 31.2449 32.8699 28.317 29.942C25.3891 27.0141 20.6419 27.0143 17.714 29.9422Z',
  'M31.3126 43.5624C28.6936 46.1814 28.6936 50.4276 31.3126 53.0466C33.9316 55.6656 38.1778 55.6656 40.7968 53.0466C43.4158 50.4276 43.4158 46.1814 40.7968 43.5624C38.1778 40.9434 33.9316 40.9434 31.3126 43.5624Z',
  'M45.7251 57.8374C43.8733 59.6892 43.8733 62.6916 45.7251 64.5434C47.5769 66.3952 50.5793 66.3952 52.4311 64.5434C54.2829 62.6916 54.2829 59.6892 52.4311 57.8374C50.5793 55.9856 47.5769 55.9856 45.7251 57.8374Z',
];

const DOT_STAGGER_MS = 110;
const ALL_DOTS_MS    = DOT_STAGGER_MS * DOT_PATHS.length; // 660 ms

export default function SplashScreen({ onDone }) {
  const isDark = (localStorage.getItem('pai-theme') || 'light') === 'dark';
  const [phase, setPhase] = useState('idle'); // idle | dots | logo | out

  const after = (...phases) => phases.includes(phase);

  useEffect(() => {
    const t0 = setTimeout(() => setPhase('dots'), 120);
    const t1 = setTimeout(() => setPhase('logo'), 120 + ALL_DOTS_MS + 120);
    const t2 = setTimeout(() => setPhase('out'),  2600);
    const t3 = setTimeout(() => onDone(),          3150);
    return () => [t0, t1, t2, t3].forEach(clearTimeout);
  }, [onDone]);

  const dotColor = isDark ? '#FFFFFF' : '#101010';
  const barTrack = isDark ? 'rgba(255,255,255,0.07)' : '#E8E8F4';
  const logoSrc  = isDark ? LOGO_DARK : LOGO_LIGHT;

  return (
    <>
      <style>{`
        @keyframes splash-dot-pop {
          0%   { opacity: 0; transform: scale(0.25); }
          70%  { opacity: 1; transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes splash-symbol-float {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-5px); }
        }
        @keyframes splash-symbol-glow {
          0%, 100% { filter: drop-shadow(0 0 0px rgba(99,96,216,0)); }
          50%       { filter: drop-shadow(0 0 12px rgba(99,96,216,0.55)); }
        }
        @keyframes splash-logo-rise {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splash-bar {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes splash-blob-a {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33%      { transform: translate(35px, -22px) scale(1.08); }
          66%      { transform: translate(-18px, 28px) scale(0.95); }
        }
        @keyframes splash-blob-b {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          40%      { transform: translate(-28px, 18px) scale(1.1); }
          70%      { transform: translate(22px, -32px) scale(1.05); }
        }
        @keyframes splash-blob-c {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50%      { transform: translate(14px, 22px) scale(1.12); }
        }
      `}</style>

      {/* ── Backdrop ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: isDark ? '#0D0D18' : '#F7F7FF',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 24, overflow: 'hidden',
        opacity: phase === 'out' ? 0 : 1,
        transition: 'opacity 550ms ease',
      }}>

        {/* ── Ambient blobs ── */}
        <div style={{
          position: 'absolute', width: 520, height: 520, top: '-8%', left: '8%',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(99,96,216,0.40) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(99,96,216,0.32) 0%, transparent 60%)',
          animation: 'splash-blob-a 9s ease-in-out infinite',
          pointerEvents: 'none', filter: 'blur(48px)',
        }} />
        <div style={{
          position: 'absolute', width: 440, height: 440, bottom: '-5%', right: '8%',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(71,173,203,0.32) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(71,173,203,0.26) 0%, transparent 60%)',
          animation: 'splash-blob-b 11s ease-in-out infinite',
          pointerEvents: 'none', filter: 'blur(56px)',
        }} />
        <div style={{
          position: 'absolute', width: 320, height: 320, top: '50%', left: '52%',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(99,96,216,0.22) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(99,96,216,0.20) 0%, transparent 60%)',
          animation: 'splash-blob-c 13s ease-in-out infinite',
          pointerEvents: 'none', filter: 'blur(64px)',
        }} />

        {/* ── Brand lockup: PAI symbol + wordmark ── */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 20,
          position: 'relative', zIndex: 1,
        }}>
          {/* PAI symbol (constellation) */}
          <svg
            width="58" height="71" viewBox="0 0 58 71" fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              animation: after('logo', 'out')
                ? 'splash-symbol-float 3.2s ease-in-out infinite, splash-symbol-glow 3.2s ease-in-out infinite'
                : 'none',
            }}
          >
            {DOT_PATHS.map((d, i) => (
              <path
                key={i}
                d={d}
                fill={dotColor}
                style={{
                  opacity: 0,
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  animation: after('dots', 'logo', 'out')
                    ? `splash-dot-pop 350ms cubic-bezier(0.34,1.3,0.64,1) ${i * DOT_STAGGER_MS}ms forwards`
                    : 'none',
                }}
              />
            ))}
          </svg>

          {/* Client wordmark */}
          <img
            src={logoSrc}
            height={28}
            alt="Logo"
            style={{
              animation: after('logo', 'out')
                ? 'splash-logo-rise 480ms cubic-bezier(0.22,1,0.36,1) forwards'
                : 'none',
              opacity: after('idle', 'dots') ? 0 : undefined,
            }}
          />
        </div>

        {/* ── Progress bar ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
          background: barTrack,
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #6360D8 0%, #47ADCB 100%)',
            transformOrigin: 'left center',
            transform: 'scaleX(0)',
            animation: after('dots', 'logo', 'out')
              ? 'splash-bar 2200ms cubic-bezier(0.4,0,0.6,1) forwards'
              : 'none',
          }} />
        </div>
      </div>
    </>
  );
}
