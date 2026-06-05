import { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const onSearchRef = useRef(onSearch);
  const isFirstRender = useRef(true);
  onSearchRef.current = onSearch;

  useEffect(() => {
    // Skip the first render to avoid clearing
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      onSearchRef.current(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchRef.current(query);
  };

  const handleClear = () => {
    setQuery('');
    onSearchRef.current('');
  };

  return (
    <div className="search-wrapper">
      <form className="search-bar" onSubmit={handleSubmit} role="search">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search businesses"
        />
        {query && (
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
