import React, { useState } from 'react';
import '../styles/password-gate.css';

export default function PasswordGate({ onUnlock }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!value) return;
    if (onUnlock(value)) {
      setError(false);
      return;
    }
    setValue('');
    setError(true);
    setShake(true);
    setTimeout(() => setShake(false), 420);
  };

  return (
    <form className={`pw-gate${shake ? ' pw-gate--shake' : ''}`} onSubmit={submit}>
      <div className="pw-gate-field">
        <input
          type="password"
          className="pw-gate-input"
          placeholder="Enter password"
          value={value}
          onChange={(e) => { setValue(e.target.value); if (error) setError(false); }}
          autoFocus
          aria-label="Password"
        />
        <button type="submit" className="pw-gate-submit" aria-label="Unlock" disabled={!value}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6H10M10 6L6.5 2.5M10 6L6.5 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {error && <span className="pw-gate-error">Incorrect password</span>}
    </form>
  );
}
