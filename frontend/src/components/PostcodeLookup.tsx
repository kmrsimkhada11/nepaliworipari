import { useState } from 'react';
import { API_BASE } from '../config';

interface PostcodeLookupProps {
  onSuburbSelect: (suburb: string, state: string, postcode: string) => void;
  currentPostcode?: string;
}

interface SuburbResult {
  suburb: string;
  state: string;
  postcode: number;
}

export function PostcodeLookup({ onSuburbSelect, currentPostcode }: PostcodeLookupProps) {
  const [postcode, setPostcode] = useState(currentPostcode || '');
  const [suburbs, setSuburbs] = useState<SuburbResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const lookupPostcode = async (code: string) => {
    if (code.length < 4) {
      setSuburbs([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/postcode/${code}`);
      if (res.ok) {
        const data = await res.json();
        setSuburbs(data.suburbs || []);
        setShowDropdown(data.suburbs?.length > 0);
      }
    } catch {
      setSuburbs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').substring(0, 4);
    setPostcode(cleaned);
    if (cleaned.length === 4) {
      lookupPostcode(cleaned);
    } else {
      setSuburbs([]);
      setShowDropdown(false);
    }
  };

  const handleSelect = (suburb: SuburbResult) => {
    onSuburbSelect(suburb.suburb, suburb.state, String(suburb.postcode));
    setPostcode(String(suburb.postcode));
    setShowDropdown(false);
  };

  return (
    <div className="postcode-lookup">
      <div className="form-group">
        <label htmlFor="postcode-input">Postcode</label>
        <input
          id="postcode-input"
          type="text"
          value={postcode}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="e.g. 4000"
          maxLength={4}
          inputMode="numeric"
        />
        {loading && <span className="postcode-loading">Looking up...</span>}
      </div>
      {showDropdown && suburbs.length > 0 && (
        <div className="postcode-dropdown">
          {suburbs.map((s, idx) => (
            <button
              key={idx}
              type="button"
              className="postcode-option"
              onClick={() => handleSelect(s)}
            >
              {s.suburb}, {s.state} {s.postcode}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
