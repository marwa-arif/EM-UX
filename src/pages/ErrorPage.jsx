import React from 'react'

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
