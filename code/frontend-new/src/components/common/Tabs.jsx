export default function Tabs({ tabs, activeTabId, onChange, ariaLabel = 'Dashboard sections', className = '' }) {
  return (
    <div className={`tabs ${className}`.trim()} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTabId === tab.id}
          className={`tabs__button ${activeTabId === tab.id ? 'is-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span>{tab.label}</span>
          {tab.description ? <small>{tab.description}</small> : null}
        </button>
      ))}
    </div>
  );
}