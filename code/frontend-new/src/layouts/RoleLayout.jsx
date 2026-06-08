import { useState, useEffect } from 'react';
import Topbar from '../components/layout/Topbar';

export default function RoleLayout({ eyebrow, title, status, actions, sidebar, children, className = '' }) {
  const hasSidebar = Boolean(sidebar);
  const [isSidebarContracted, setIsSidebarContracted] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1240) {
        setIsSidebarContracted(true);
      } else {
        setIsSidebarContracted(false);
      }
    };
    
    handleResize(); // set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarContracted(!isSidebarContracted);
  };

  return (
    <div className={`role-layout ${className}`.trim()}>
      <Topbar 
        eyebrow={eyebrow} 
        title={title} 
        status={status} 
        actions={actions} 
        onToggleSidebar={hasSidebar ? handleToggleSidebar : undefined} 
      />
      <div className={`role-layout__body ${hasSidebar ? 'role-layout__body--split' : ''} ${isSidebarContracted ? 'role-layout__body--contracted' : ''}`}>
        {hasSidebar ? <aside className={`role-layout__sidebar ${isSidebarContracted ? 'role-layout__sidebar--contracted' : ''}`}>{sidebar}</aside> : null}
        <div className="role-layout__content">{children}</div>
      </div>
    </div>
  );
}