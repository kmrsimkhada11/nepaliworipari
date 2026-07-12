import { useRef } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  locationEnabled?: boolean;
  radius?: number;
  onLocationToggle?: () => void;
  onRadiusChange?: (radius: number) => void;
}

export function SearchBar({ value, onChange, locationEnabled, radius, onLocationToggle, onRadiusChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className="search-wrapper">
      <form className="search-bar" onSubmit={handleSubmit} role="search">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Search businesses"
        />
        {value && (
          <button
            type="button"
            className="clear-button"
            onClick={handleClear}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
        {onLocationToggle && (
          !locationEnabled ? (
            <button type="button" className="search-location-btn" onClick={onLocationToggle}>
              📍
            </button>
          ) : (
            <select
              className="search-location-select"
              value={radius}
              onChange={(e) => {
                if (e.target.value === 'off') {
                  onLocationToggle();
                } else if (onRadiusChange) {
                  onRadiusChange(parseInt(e.target.value));
                }
              }}
            >
              <option value="5">5km</option>
              <option value="10">10km</option>
              <option value="25">25km</option>
              <option value="50">50km</option>
              <option value="100">100km</option>
              <option value="off">✕</option>
            </select>
          )
        )}
      </form>
    </div>
  );
}
