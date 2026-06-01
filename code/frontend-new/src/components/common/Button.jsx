export default function Button({ className = '', variant = 'primary', type = 'button', children, ...props }) {
  const variantClass = variant === 'ghost'
    ? 'button button--ghost'
    : variant === 'outline'
      ? 'button button--outline'
      : 'button button--primary';

  return (
    <button type={type} className={`${variantClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}