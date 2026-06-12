import React from 'react';

export default function Footer({ status }) {
  const hasStatus = Boolean(status);
  const statusStr = typeof status === 'string' ? status : '';
  const isError = statusStr.toLowerCase().includes('error') || statusStr.toLowerCase().includes('fail') || statusStr.toLowerCase().includes('offline');
  const isLoading = statusStr.toLowerCase().includes('loading') || statusStr.toLowerCase().includes('syncing') || statusStr.toLowerCase().includes('loading live conditions');

  let dotClass = 'status-dot--green';
  if (isError) {
    dotClass = 'status-dot--red';
  } else if (isLoading) {
    dotClass = 'status-dot--amber';
  }

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__left">
          <div className="site-footer__brand">
            <img src="/favicon.png" alt="" className="site-footer__logo" />
            <span className="site-footer__brand-name">SlideSense</span>
          </div>
          <span className="site-footer__copyright">
            &copy; {new Date().getFullYear()} SlideSense. All rights reserved.
          </span>
        </div>
        
        <div className="site-footer__center">
          <a href="#help" className="site-footer__link">Help Center</a>
          <span className="site-footer__separator">&middot;</span>
          <a href="#terms" className="site-footer__link">Terms of Service</a>
          <span className="site-footer__separator">&middot;</span>
          <a href="#privacy" className="site-footer__link">Privacy Policy</a>
        </div>

        <div className="site-footer__right">
          {hasStatus && (
            <div className="site-footer__status-badge">
              <span className={`status-dot ${dotClass}`} />
              <span className="status-text">{status}</span>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
