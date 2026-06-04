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
  // Show subcategories if a parent is selected
  if (selectedParent && subcategories.length > 0) {
    const parent = parentCategories.find((c) => c.slug === selectedParent);
    return (
      <section className="category-section" aria-label="Subcategories">
        <h2 className="section-title">
          {parent?.icon} {parent?.name}
        </h2>
        <div className="category-grid">
          {subcategories.map((sub) => (
            <button
              key={sub.id}
              className="category-card"
              onClick={() => onSubcategorySelect(sub.slug)}
            >
              <span className="category-icon">{sub.icon}</span>
              <span className="category-name">{sub.name}</span>
              {sub.business_count && parseInt(sub.business_count) > 0 && (
                <span className="category-count">{sub.business_count}</span>
              )}
            </button>
          ))}
        </div>
      </section>
    );
  }

  // Show parent categories
  return (
    <section className="category-section" aria-label="Business categories">
      <h2 className="section-title">Browse by Category</h2>
      <div className="category-grid">
        {parentCategories.map((category) => (
          <button
            key={category.id}
            className="category-card"
            onClick={() => onParentSelect(category.slug)}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-name">{category.name}</span>
            {category.business_count && parseInt(category.business_count) > 0 && (
              <span className="category-count">{category.business_count}</span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
