import { useState, useEffect } from 'react';
import { Category, AUSTRALIAN_STATES } from '../types';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';
import { PostcodeLookup } from './PostcodeLookup';

interface EditRequestProps {
  post: { id: number; title: string; description: string; state: string; city: string; budget: string; category_id?: number };
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditRequest({ post, show, onClose, onSuccess }: EditRequestProps) {
  const { token } = useAuth();
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [parentSlug, setParentSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState(post.title);
  const [description, setDescription] = useState(post.description || '');
  const [categoryId, setCategoryId] = useState(String(post.category_id || ''));
  const [state, setState] = useState(post.state);
  const [city, setCity] = useState(post.city || '');
  const [budget, setBudget] = useState(post.budget || '');

  useEffect(() => {
    if (show) {
      fetch(`${API_BASE}/categories`)
        .then((res) => res.json())
        .then((data: Category[]) => setParentCategories(data))
        .catch(() => setParentCategories([]));
    }
  }, [show]);

  useEffect(() => {
    if (parentSlug) {
      fetch(`${API_BASE}/categories/${parentSlug}/subcategories`)
        .then((res) => res.json())
        .then((data: Category[]) => setSubcategories(data))
        .catch(() => setSubcategories([]));
    } else {
      setSubcategories([]);
    }
  }, [parentSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/service-posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, description, categoryId: categoryId ? parseInt(categoryId) : null, state, city, budget }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        onSuccess();
        onClose();
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="modal-title">✏️ Edit Request</h2>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="edit-req-title">What do you need? *</label>
            <input id="edit-req-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="edit-req-desc">Details</label>
            <textarea id="edit-req-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="form-group">
            <label htmlFor="edit-req-cat">Category</label>
            <select id="edit-req-cat" value={parentSlug} onChange={(e) => setParentSlug(e.target.value)}>
              <option value="">Any category</option>
              {parentCategories.map((cat) => (
                <option key={cat.id} value={cat.slug}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>

          {subcategories.length > 0 && (
            <div className="form-group">
              <label htmlFor="edit-req-subcat">Subcategory</label>
              <select id="edit-req-subcat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Any</option>
                {subcategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>
          )}

          <PostcodeLookup onSuburbSelect={(suburb, st) => { setCity(suburb); setState(st); }} />

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-req-state">State *</label>
              <select id="edit-req-state" value={state} onChange={(e) => setState(e.target.value)} required>
                {AUSTRALIAN_STATES.filter((s) => s.value !== 'ALL').map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="edit-req-city">City/Suburb</label>
              <input id="edit-req-city" type="text" value={city} readOnly placeholder="" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="edit-req-budget">Budget</label>
            <input id="edit-req-budget" type="text" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="form-submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
