export default function Table({ className = '', children, ...props }) {
  return (
    <div className={`table-shell ${className}`.trim()} {...props}>
      <table className="table-shell__table">
        {children}
      </table>
    </div>
  );
}