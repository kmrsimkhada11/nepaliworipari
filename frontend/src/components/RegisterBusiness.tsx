import { useState, useEffect } from 'react';
import { Category, AUSTRALIAN_STATES } from '../types';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

interface RegisterBusinessProps {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RegisterBusiness({ show, onClose, onSuccess }: RegisterBusinessProps) {
  const { token } = useAuth();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [parentCategorySlug, setParentCategorySlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [state, setState] = useState('QLD');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');

  // Fetch parent categories on open
  useEffect(() => {
    if (show) {
      fetch(`${API_BASE}/categories`)
        .then((res) => res.json())
        .then((data: Category[]) => setParentCategories(data))
        .catch(() => setParentCategories([]));
    }
  }, [show]);

  // Fetch subcategories when parent changes
  useEffect(() => {
    if (parentCategorySlug) {
      fetch(`${API_BASE}/categories/${parentCategorySlug}/subcategories`)
        .then((res) => res.json())
        .then((data: Category[]) => setSubcategories(data))
        .catch(() => setSubcategories([]));
      setCategoryId('');
    } else {
      setSubcategories([]);
      setCategoryId('');
    }
  }, [parentCategorySlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name, phone, email, categoryId: parseInt(categoryId), state, city, address, description, website, facebook, instagram, tiktok }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
      } else {
        setStep('success');
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setName('');
    setPhone('');
    setEmail('');
    setParentCategorySlug('');
    setCategoryId('');
    setState('QLD');
    setCity('');
    setAddress('');
    setDescription('');
    setWebsite('');
    setFacebook('');
    setInstagram('');
    setTiktok('');
    setError('');
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose} aria-label="Close">✕</button>

        {step === 'form' && (
          <>
            <h2 className="modal-title">📋 List Your Business</h2>
            <p className="modal-subtitle">Add your business to NepaliOriPari directory</p>

            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-group">
                <label htmlFor="reg-name">Business Name *</label>
                <input id="reg-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Himalayan Kitchen" />
              </div>

              <div className="form-group">
                <label htmlFor="reg-phone">Phone Number *</label>
                <input id="reg-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="04XX XXX XXX" />
              </div>

              <div className="form-group">
                <label htmlFor="reg-email">Email Address *</label>
                <input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
              </div>

              <div className="form-group">
                <label htmlFor="reg-parent-category">Category *</label>
                <select
                  id="reg-parent-category"
                  value={parentCategorySlug}
                  onChange={(e) => setParentCategorySlug(e.target.value)}
                  required
                >
                  <option value="">Select a category</option>
                  {parentCategories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>

              {subcategories.length > 0 && (
                <div className="form-group">
                  <label htmlFor="reg-subcategory">Subcategory *</label>
                  <select
                    id="reg-subcategory"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                  >
                    <option value="">Select a subcategory</option>
                    {subcategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="reg-state">State *</label>
                  <select id="reg-state" value={state} onChange={(e) => setState(e.target.value)} required>
                    {AUSTRALIAN_STATES.filter((s) => s.value !== 'ALL').map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="reg-city">City/Suburb *</label>
                  <input id="reg-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} required placeholder="e.g. Brisbane" />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reg-address">Address (optional)</label>
                <input id="reg-address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 123 Main St" />
              </div>

              <div className="form-group">
                <label htmlFor="reg-desc">Description</label>
                <textarea id="reg-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of your business" rows={3} />
              </div>

              <div className="form-group">
                <label htmlFor="reg-website">Website (optional)</label>
                <input id="reg-website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://www.example.com" />
              </div>

              <div className="form-group">
                <label htmlFor="reg-facebook">Facebook (optional)</label>
                <input id="reg-facebook" type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/yourbusiness" />
              </div>

              <div className="form-group">
                <label htmlFor="reg-instagram">Instagram (optional)</label>
                <input id="reg-instagram" type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/yourbusiness" />
              </div>

              <div className="form-group">
                <label htmlFor="reg-tiktok">TikTok (optional)</label>
                <input id="reg-tiktok" type="url" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="https://tiktok.com/@yourbusiness" />
              </div>

              {error && <p className="form-error">{error}</p>}

              <button type="submit" className="form-submit" disabled={loading}>
                {loading ? 'Registering...' : 'Register Business'}
              </button>
            </form>
          </>
        )}

        {step === 'success' && (
          <div className="register-success">
            <span className="success-icon">✅</span>
            <h2>Business Registered!</h2>
            <p>Your business has been added to NepaliOriPari. Thank you!</p>
          </div>
        )}
      </div>
    </div>
  );
}
