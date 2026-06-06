import RoleLayout from './RoleLayout';


export default function AdminLayout({
  title,
  status,
  sidebar,
  actions,
  children,
}) {
  return (
    <RoleLayout
      eyebrow={null}
      title={title}
      status={status}
      actions={actions}
      sidebar={sidebar}
    >
      {children}
    </RoleLayout>
  );
}