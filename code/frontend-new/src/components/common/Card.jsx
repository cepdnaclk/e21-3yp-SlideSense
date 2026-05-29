export default function Card({ as: Tag = 'section', className = '', children, ...props }) {
  return (
    <Tag className={`card ${className}`.trim()} {...props}>
      {children}
    </Tag>
  );
}