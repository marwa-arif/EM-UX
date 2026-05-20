import React from 'react'

const EM_DOTS = [
  "M45.6001 5.86863C43.7483 7.72044 43.7483 10.7228 45.6001 12.5746C47.4519 14.4264 50.4543 14.4264 52.3061 12.5746C54.1579 10.7228 54.1579 7.72044 52.3061 5.86863C50.4543 4.01682 47.4519 4.01682 45.6001 5.86863Z",
  "M31.172 15.7265C28.553 18.3455 28.553 22.5917 31.172 25.2107C33.7909 27.8297 38.0372 27.8297 40.6562 25.2107C43.2752 22.5917 43.2752 18.3455 40.6562 15.7265C38.0372 13.1075 33.7909 13.1075 31.172 15.7265Z",
  "M45.2432 32.5381C43.7681 34.0132 43.7681 36.4048 45.2432 37.8799C46.7183 39.355 49.1099 39.355 50.585 37.8799C52.0601 36.4048 52.0601 34.0132 50.585 32.5381C49.1099 31.063 46.7183 31.063 45.2432 32.5381Z",
  "M17.714 29.9422C14.7862 32.8701 14.786 37.6173 17.7138 40.5452C20.6417 43.473 25.3889 43.4728 28.3168 40.545C31.2447 37.6171 31.2449 32.8699 28.317 29.942C25.3891 27.0141 20.6419 27.0143 17.714 29.9422Z",
  "M31.3126 43.5624C28.6936 46.1814 28.6936 50.4276 31.3126 53.0466C33.9316 55.6656 38.1778 55.6656 40.7968 53.0466C43.4158 50.4276 43.4158 46.1814 40.7968 43.5624C38.1778 40.9434 33.9316 40.9434 31.3126 43.5624Z",
  "M45.7251 57.8374C43.8733 59.6892 43.8733 62.6916 45.7251 64.5434C47.5769 66.3952 50.5793 66.3952 52.4311 64.5434C54.2829 62.6916 54.2829 59.6892 52.4311 57.8374C50.5793 55.9856 47.5769 55.9856 45.7251 57.8374Z",
];

export default function ErrorPage({ type = 'notFound', onReset, onHome }) {
  const isError = type === 'error';
  const code    = isError ? '500' : '404';
  const title   = isError ? 'Something went wrong' : 'Page not found';
  const desc    = isError
    ? 'An unexpected error occurred in the application. Reload the page or return to the dashboard.'
    : 'This page doesn\'t exist or may have been moved. Head back to the dashboard to continue.';

  return (
    <>
      <style>{`
        @keyframes ep-blob-a {
          0%,100% { transform: translate(0,0) scale(1); }
          40%     { transform: translate(30px,-20px) scale(1.07); }
          70%     { transform: translate(-15px,25px) scale(0.96); }
        }
        @keyframes ep-blob-b {
          0%,100% { transform: translate(0,0) scale(1); }
          50%     { transform: translate(-22px,18px) scale(1.09); }
        }
      `}</style>

      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden',
        background: 'var(--shell-bg)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter', system-ui",
        color: 'var(--pai-fg1)',
      }}>

        {/* Blobs */}
        <div style={{
          position: 'absolute', width: 480, height: 480,
          top: '-10%', left: '5%', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,96,216,0.14) 0%, transparent 65%)',
          filter: 'blur(56px)', pointerEvents: 'none',
          animation: 'ep-blob-a 10s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 380, height: 380,
          bottom: '-8%', right: '6%', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(71,173,203,0.12) 0%, transparent 65%)',
          filter: 'blur(64px)', pointerEvents: 'none',
          animation: 'ep-blob-b 13s ease-in-out infinite',
        }} />

        {/* Error code watermark */}
        <div style={{
          position: 'absolute',
          fontSize: 260, fontWeight: 800, lineHeight: 1,
          color: 'var(--pai-indigo)', opacity: 0.04,
          userSelect: 'none', pointerEvents: 'none',
          letterSpacing: '-0.04em',
        }}>{code}</div>

        {/* Main content */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 16,
        }}>

          {/* Icon row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg width="38" height="47" viewBox="0 0 58 71" fill="none">
              {EM_DOTS.map((d, i) => (
                <path key={i} d={d} fill="var(--pai-indigo)" opacity={0.45} />
              ))}
            </svg>
            <div style={{
              width: 1, height: 28,
              background: 'linear-gradient(to bottom, transparent, var(--pai-border), transparent)',
            }} />
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: isError ? 'var(--pai-crit-fg)' : 'var(--pai-fg3)',
            }}>{code}</span>
          </div>

          {/* Text */}
          <h1 style={{
            margin: 0, fontSize: 22, fontWeight: 700,
            color: 'var(--pai-fg1)', letterSpacing: '-0.01em',
          }}>{title}</h1>

          <p style={{
            margin: 0, fontSize: 13, lineHeight: 1.65,
            color: 'var(--pai-fg2)', textAlign: 'center',
            maxWidth: 360,
          }}>{desc}</p>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            {isError ? (
              <button
                className="ds-btn sz-md t-primary"
                onClick={onReset ?? (() => window.location.reload())}
              >
                Reload page
              </button>
            ) : (
              <button
                className="ds-btn sz-md t-primary"
                onClick={onHome ?? (() => { window.location.href = '/'; })}
              >
                Go to dashboard
              </button>
            )}
            <button
              className="ds-btn sz-md t-outline"
              onClick={() => window.history.back()}
            >
              Go back
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
