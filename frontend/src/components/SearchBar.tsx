import { useRef } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
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
      </form>
    </div>
  );
}
