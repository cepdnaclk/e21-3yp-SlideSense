export default function Topbar({ eyebrow = 'Landslide monitoring', title, actions, onToggleSidebar }) {
  return (
    <header className="admin-topbar">
      <div className="admin-topbar__left">
        {onToggleSidebar && (
          <button 
            onClick={onToggleSidebar} 
            className="sidebar-toggle-btn"
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
        )}
        <picture>
          <source media="(max-width: 768px)" srcSet="/favicon.png" />
          <img src="/logo.png" alt="Slide Sense logo" className="admin-topbar__logo" />
        </picture>
      </div>

      <div className="admin-topbar__center">
        {eyebrow && <span className="section-label">{eyebrow}</span>}
        <h1>{title}</h1>
      </div>

      <div className="admin-topbar__right admin-topbar__meta">
        {actions ? <div className="admin-topbar__actions">{actions}</div> : null}
      </div>
    </header>
  );
}