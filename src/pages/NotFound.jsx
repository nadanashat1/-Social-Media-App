import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        textAlign: 'center',
        padding: '2rem 1.5rem',
      }}
    >
      <Compass size={40} style={{ color: 'var(--primary-orange)' }} />
      <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
        Page not found
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', maxWidth: '420px' }}>
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link
        to="/"
        className="btn-create-post"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.5rem 1.4rem',
          fontSize: '0.88rem',
          textDecoration: 'none',
        }}
      >
        Back to Feed
      </Link>
    </div>
  );
}
