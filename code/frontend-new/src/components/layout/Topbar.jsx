export default function Topbar({ eyebrow = 'Landslide monitoring', title, status, actions }) {
  return (
    <header className="admin-topbar">
      <div className="admin-topbar__brand">
        <img src="/logo.png" alt="Slide Sense logo" className="admin-topbar__logo" />
        <div>
          <span className="section-label">{eyebrow}</span>
          <h1>{title}</h1>
        </div>
      </div>
      <div className="admin-topbar__meta">
        <p className="admin-topbar__status">{status}</p>
        {actions ? <div className="admin-topbar__actions">{actions}</div> : null}
      </div>
    </header>
  );
}