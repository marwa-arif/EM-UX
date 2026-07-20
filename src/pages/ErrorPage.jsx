import React from 'react'
import '../styles/error-page.css'

export default function ErrorPage({ type = 'notFound', onReset, onHome }) {
  const isError = type === 'error';
  const code    = isError ? '500' : '404';
  const title   = isError ? 'Something went wrong' : 'Page not found';
  const desc    = isError
    ? 'An unexpected error occurred in the application. Reload the page or return to the dashboard.'
    : 'This page doesn\'t exist or may have been moved. Head back to the dashboard to continue.';

  return (
    <div className="ep-root">
      <div className="ep-blob-a" />
      <div className="ep-blob-b" />

      <div className="ep-watermark">{code}</div>

      <div className="ep-content">
        <h1 className="ep-title">{title}</h1>
        <p className="ep-desc">{desc}</p>
        <div className="ep-actions">
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
              onClick={onHome ?? (() => { window.location.href = import.meta.env.BASE_URL; })}
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
  );
}
