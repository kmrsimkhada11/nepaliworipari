import { useState, useEffect } from 'react';
import { Business, Category, AUSTRALIAN_STATES } from '../types';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';
import { PostcodeLookup } from './PostcodeLookup';

interface EditBusinessProps {
  business: Business;
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditBusiness({ business, show, onClose, onSuccess }: EditBusinessProps) {
  const { token } = useAuth();
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [parentSlug, setParentSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState(business.name);
  const [phone, setPhone] = useState(business.phone || '');
  const [email, setEmail] = useState(business.email || '');
  const [categoryId, setCategoryId] = useState(String(business.category_id || ''));
  const [state, setState] = useState(business.state);
  const [city, setCity] = useState(business.city || '');
  const [address, setAddress] = useState(business.address || '');
  const [description, setDescription] = useState(business.description || '');
  const [website, setWebsite] = useState(business.website || '');
  const [facebook, setFacebook] = useState(business.facebook || '');
  const [instagram, setInstagram] = useState(business.instagram || '');
  const [tiktok, setTiktok] = useState(business.tiktok || '');

  useEffect(() => {
    if (show) {
      fetch(`${API_BASE}/categories`)
        .then((res) => res.json())
        .then((data: Category[]) => {
          setParentCategories(data);
          // Find parent slug from current category
          if (business.parent_category_slug) {
            setParentSlug(business.parent_category_slug);
          }
        })
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
      const res = await fetch(`${API_BASE}/register/${business.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, phone, email, categoryId: categoryId ? parseInt(categoryId) : null, state, city, address, description, website, facebook, instagram, tiktok }),
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
        <h2 className="modal-title">✏️ Edit Business</h2>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="edit-name">Business Name *</label>
            <input id="edit-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="edit-phone">Phone *</label>
            <input id="edit-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="edit-email">Email *</label>
            <input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="edit-parent-cat">Category</label>
            <select id="edit-parent-cat" value={parentSlug} onChange={(e) => setParentSlug(e.target.value)}>
              <option value="">Select a category</option>
              {parentCategories.map((cat) => (
                <option key={cat.id} value={cat.slug}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>

          {subcategories.length > 0 && (
            <div className="form-group">
              <label htmlFor="edit-subcategory">Subcategory</label>
              <select id="edit-subcategory" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Select a subcategory</option>
                {subcategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>
          )}

          <PostcodeLookup onSuburbSelect={(suburb, st) => { setCity(suburb); setState(st); }} />

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-state">State *</label>
              <select id="edit-state" value={state} onChange={(e) => setState(e.target.value)} required>
                {AUSTRALIAN_STATES.filter((s) => s.value !== 'ALL').map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="edit-city">City/Suburb *</label>
              <input id="edit-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="edit-address">Address</label>
            <input id="edit-address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="form-group">
            <label htmlFor="edit-desc">Description</label>
            <textarea id="edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="form-group">
            <label htmlFor="edit-website">Website</label>
            <input id="edit-website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>

          <div className="form-group">
            <label htmlFor="edit-facebook">Facebook</label>
            <input id="edit-facebook" type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
          </div>

          <div className="form-group">
            <label htmlFor="edit-instagram">Instagram</label>
            <input id="edit-instagram" type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
          </div>

          <div className="form-group">
            <label htmlFor="edit-tiktok">TikTok</label>
            <input id="edit-tiktok" type="url" value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
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
