// Airbnb-style thin line SVG icons for categories
// Returns SVG element for a given category slug

const S = 24; // icon size

function getIcon(slug: string): React.ReactNode | null {
  switch (slug) {
    case 'real-estate-category':
      return <svg width={S} height={S} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3L3 14h3v13h8v-8h4v8h8V14h3L16 3z"/></svg>;
    case 'home-services':
      return <svg width={S} height={S} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 28V18h8v10M5 14l11-10 11 10v13a1 1 0 01-1 1H6a1 1 0 01-1-1V14z"/></svg>;
    case 'health-wellness':
      return <svg width={S} height={S} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 28s-10-6.5-10-13a6 6 0 0112-1 6 6 0 0112 1c0 6.5-10 13-10 13z"/></svg>;
    case 'finance-legal':
      return <svg width={S} height={S} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="12" width="24" height="16" rx="2"/><path d="M8 12V8a8 8 0 0116 0v4"/><circle cx="16" cy="20" r="3"/></svg>;
    case 'food-dining':
      return <svg width={S} height={S} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 14c0-5 4-9 11-9s11 4 11 9M3 14h26M6 14v2a10 10 0 0020 0v-2"/><path d="M16 26v3"/></svg>;
    case 'grocery-products':
      return <svg width={S} height={S} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6h3l3 16h12l3-12H10"/><circle cx="13" cy="26" r="2"/><circle cx="23" cy="26" r="2"/></svg>;
    case 'events-celebrations':
      return <svg width={S} height={S} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4v4M8 8l2 3M24 8l-2 3"/><path d="M8 15h16v10a3 3 0 01-3 3H11a3 3 0 01-3-3V15z"/><path d="M12 15v-2a4 4 0 018 0v2"/></svg>;
    case 'education-career':
      return <svg width={S} height={S} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12l12-6 12 6-12 6-12-6z"/><path d="M8 14v8c0 2 3.5 4 8 4s8-2 8-4v-8"/><path d="M28 12v8"/></svg>;
    case 'trade-services':
      return <svg width={S} height={S} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6l-3 3-3-3"/><path d="M17 9v10"/><path d="M12 14l-6 12h20l-6-12"/></svg>;
    case 'technology-business':
      return <svg width={S} height={S} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="6" width="24" height="16" rx="2"/><path d="M12 26h8M16 22v4"/></svg>;
    case 'buying-selling':
      return <svg width={S} height={S} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 8l-4-4-4 4"/><path d="M18 4v14"/><path d="M10 24l4 4 4-4"/><path d="M14 28V14"/></svg>;
    case 'rental':
      return <svg width={S} height={S} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="16" cy="14" r="4"/><path d="M16 18v6"/><path d="M12 28h8"/><path d="M8 10a8 8 0 0116 0"/></svg>;
    case 'real-estate':
      return <svg width={S} height={S} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="14" width="24" height="14" rx="1"/><path d="M4 14l12-10 12 10"/><rect x="13" y="20" width="6" height="8"/></svg>;
    case 'restaurant-cafe':
      return <svg width={S} height={S} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 14c0-5 4-9 11-9s11 4 11 9M3 14h26M6 14v2a10 10 0 0020 0v-2"/></svg>;
    case 'beauty-skincare':
      return <svg width={S} height={S} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4c-3 2-5 5-5 9 0 5 3 8 5 9 2-1 5-4 5-9 0-4-2-7-5-9z"/><path d="M16 22v6"/><path d="M12 28h8"/></svg>;
    case 'migration-consultancy':
      return <svg width={S} height={S} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 24l8-4 4 4 4-4 8 4"/><path d="M24 8l-8 8-8-8"/><path d="M16 4v12"/></svg>;
    default:
      return null;
  }
}

export function CategoryIcon({ slug, fallbackEmoji }: { slug: string; fallbackEmoji?: string }) {
  const icon = getIcon(slug);
  if (icon) {
    return <span className="category-svg-icon">{icon}</span>;
  }
  return <span className="category-item-icon">{fallbackEmoji || '📂'}</span>;
}
