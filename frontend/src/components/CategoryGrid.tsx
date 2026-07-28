import { useRef, useState, useEffect } from 'react';
import { Category } from '../types';

interface CategoryGridProps {
  parentCategories: Category[];
  subcategories: Category[];
  selectedParent: string | null;
  selectedSubcategory: string | null;
  onParentSelect: (slug: string | null) => void;
  onSubcategorySelect: (slug: string | null) => void;
  onPostClick?: () => void;
}

export function CategoryGrid({
  parentCategories,
  subcategories,
  selectedParent,
  onParentSelect,
  onSubcategorySelect,
}: CategoryGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [parentCategories, subcategories]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = dir === 'left' ? -200 : 200;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  // Show subcategories if a parent is selected
  if (selectedParent && subcategories.length > 0) {
    const parent = parentCategories.find((c) => c.slug === selectedParent);
    return (
      <section className="category-section" aria-label="Subcategories">
        <h2 className="section-title">
          {parent?.icon} {parent?.name}
        </h2>
        <div className="category-bar">
          {canScrollLeft && (
            <button className="category-scroll-btn left" onClick={() => scroll('left')} aria-label="Scroll left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
          )}
          <div className="category-scroll" ref={scrollRef}>
            {subcategories.map((sub) => (
              <button
                key={sub.id}
                className="category-item"
                onClick={() => onSubcategorySelect(sub.slug)}
              >
                <span className="category-item-icon">{sub.icon}</span>
                <span className="category-item-name">{sub.name}</span>
              </button>
            ))}
          </div>
          {canScrollRight && (
            <button className="category-scroll-btn right" onClick={() => scroll('right')} aria-label="Scroll right">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          )}
        </div>
      </section>
    );
  }

  // Show parent categories
  return (
    <section className="category-section" aria-label="Business categories">
      <div className="category-bar">
        {canScrollLeft && (
          <button className="category-scroll-btn left" onClick={() => scroll('left')} aria-label="Scroll left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
        )}
        <div className="category-scroll" ref={scrollRef}>
          {parentCategories.map((category) => (
            <button
              key={category.id}
              className={`category-item ${selectedParent === category.slug ? 'active' : ''}`}
              onClick={() => onParentSelect(category.slug)}
            >
              <span className="category-item-icon">{category.icon}</span>
              <span className="category-item-name">{category.name}</span>
            </button>
          ))}
        </div>
        {canScrollRight && (
          <button className="category-scroll-btn right" onClick={() => scroll('right')} aria-label="Scroll right">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        )}
      </div>
    </section>
  );
}
