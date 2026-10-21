import React from 'react';

export default function Footer({ showTag = false }) {
  return (
    <>
      {showTag && (
        <div className="encrypted-session-tag">
          ENCRYPTED SESSION • ROUTE INDEPENDENT PRESS NETWORK • EST. 2026
        </div>
      )}
      <footer className="site-footer">
        <div>
          © 2026 Route Editorial. All rights reserved.
        </div>
        <div className="footer-links">
          <a href="#manifesto" className="footer-link">Editorial Manifesto</a>
          <a href="#privacy" className="footer-link">Privacy Policy</a>
          <a href="#archive" className="footer-link">Archive</a>
        </div>
      </footer>
    </>
  );
}
