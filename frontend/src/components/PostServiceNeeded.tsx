import { useState, useEffect } from 'react';
import { Category, AUSTRALIAN_STATES } from '../types';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

interface PostServiceNeededProps {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PostServiceNeeded({ show, onClose, onSuccess }: PostServiceNeededProps) {
  const { token } = useAuth();
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [parentSlug, setParentSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [state, setState] = useState('QLD');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
      setCategoryId('');
    } else {
      setSubcategories([]);
      setCategoryId('');
    }
  }, [parentSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/service-posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, categoryId: categoryId ? parseInt(categoryId) : null, state, city, budget }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1500);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setParentSlug('');
    setCategoryId('');
    setState('QLD');
    setCity('');
    setBudget('');
    setError('');
    setSuccess(false);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose} aria-label="Close">✕</button>

        {success ? (
          <div className="register-success">
            <span className="success-icon">✅</span>
            <h2>Posted!</h2>
            <p>Service providers can now see your request.</p>
          </div>
        ) : (
          <>
            <h2 className="modal-title">🔍 Post What You Need</h2>
            <p className="modal-subtitle">Describe the service you're looking for</p>

            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-group">
                <label htmlFor="post-title">What do you need? *</label>
                <input id="post-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Need a plumber for bathroom renovation" />
              </div>

              <div className="form-group">
                <label htmlFor="post-desc">Details</label>
                <textarea id="post-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what you need in more detail" rows={3} />
              </div>

              <div className="form-group">
                <label htmlFor="post-parent-cat">Category</label>
                <select id="post-parent-cat" value={parentSlug} onChange={(e) => setParentSlug(e.target.value)}>
                  <option value="">Any category</option>
                  {parentCategories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>

              {subcategories.length > 0 && (
                <div className="form-group">
                  <label htmlFor="post-sub-cat">Subcategory</label>
                  <select id="post-sub-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    <option value="">Any subcategory</option>
                    {subcategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="post-state">State *</label>
                  <select id="post-state" value={state} onChange={(e) => setState(e.target.value)} required>
                    {AUSTRALIAN_STATES.filter((s) => s.value !== 'ALL').map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="post-city">City/Suburb</label>
                  <input id="post-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Brisbane" />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="post-address">Address (optional)</label>
                <input id="post-address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 123 Main St" />
              </div>

              <div className="form-group">
                <label htmlFor="post-budget">Budget (optional)</label>
                <input id="post-budget" type="text" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. $100-$200" />
              </div>

              {error && <p className="form-error">{error}</p>}

              <button type="submit" className="form-submit" disabled={loading}>
                {loading ? 'Posting...' : 'Post Request'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
