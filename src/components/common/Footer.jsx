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
          <span className="footer-link">Editorial Manifesto</span>
          <span className="footer-link">Privacy Policy</span>
          <span className="footer-link">Archive</span>
        </div>
      </footer>
    </>
  );
}
