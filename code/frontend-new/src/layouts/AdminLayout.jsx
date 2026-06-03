import RoleLayout from './RoleLayout';
import Sidebar from '../components/layout/Sidebar';

export default function AdminLayout({
  title,
  status,
  activeTabLabel,
  activeTabDescription,
  probesCount,
  highRiskCount,
  selectedProbeId,
  children,
}) {
  return (
    <RoleLayout
      eyebrow="Admin control center"
      title={title}
      status={status}
      sidebar={(
        <Sidebar
          activeTabLabel={activeTabLabel}
          activeTabDescription={activeTabDescription}
          probesCount={probesCount}
          highRiskCount={highRiskCount}
          selectedProbeId={selectedProbeId}
        />
      )}
    >
      {children}
    </RoleLayout>
  );
}