import Topbar from '../components/layout/Topbar';

export default function RoleLayout({ eyebrow, title, status, actions, sidebar, children, className = '' }) {
  const hasSidebar = Boolean(sidebar);

  return (
    <div className={`role-layout ${className}`.trim()}>
      <Topbar eyebrow={eyebrow} title={title} status={status} actions={actions} />
      <div className={`role-layout__body ${hasSidebar ? 'role-layout__body--split' : ''}`}>
        {hasSidebar ? <aside className="role-layout__sidebar">{sidebar}</aside> : null}
        <div className="role-layout__content">{children}</div>
      </div>
    </div>
  );
}