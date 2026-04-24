export default function SearchBar({ value, onChange, onSubmit, probeIds }) {
  return (
    <form className="search-bar card-shell" onSubmit={onSubmit}>
      <div className="search-bar__label-group">
        <span className="section-label">Probe search</span>
      </div>
      <div className="search-bar__controls">
        <input
          className="search-bar__input"
          type="text"
          value={value}
          onChange={onChange}
          placeholder="Enter probe ID, for example PRB-101"
          list="probe-id-options"
        />
        <button className="primary-button" type="submit">
          Locate probe
        </button>
      </div>
      <datalist id="probe-id-options">
        {probeIds.map((probeId) => (
          <option key={probeId} value={probeId} />
        ))}
      </datalist>
    </form>
  );
}