import { useState, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { CategoryGrid } from './components/CategoryGrid';
import { BusinessList } from './components/BusinessList';
import { RegisterBusiness } from './components/RegisterBusiness';
import { AuthModal } from './components/AuthModal';
import { ChatInbox } from './components/ChatInbox';
import { ServiceRequests } from './components/ServiceRequests';
import { Profile } from './components/Profile';
import { PostServiceNeeded } from './components/PostServiceNeeded';
import { ServiceWantedFeed } from './components/ServiceWantedFeed';
import { MyRequests } from './components/MyRequests';
import { BusinessPage } from './pages/BusinessPage';
import { RequestPage } from './pages/RequestPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { fetchCategoryStats, fetchSubcategories, fetchBusinesses, fetchNearbyBusinesses, fetchMyBusinesses } from './api';
import { AustralianState, Business, Category, PaginationInfo } from './types';

function AppContent() {
  const { user, token, isLoading: authLoading } = useAuth();
  const { refreshCounts } = useNotifications();
  const [selectedState, setSelectedState] = useState<AustralianState>('ALL');
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Location state
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [radius, setRadius] = useState(10);
  const [showRegister, setShowRegister] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPostNeeded, setShowPostNeeded] = useState(false);
  const [mode, setMode] = useState<'seeker' | 'provider'>('seeker');

  const isProvider = mode === 'provider';

  // Fetch parent categories with business counts
  const loadParentCategories = useCallback(async () => {
    try {
      const data = await fetchCategoryStats(selectedState);
      setParentCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, [selectedState]);

  // Fetch subcategories when a parent is selected
  const loadSubcategories = useCallback(async () => {
    if (!selectedParent) {
      setSubcategories([]);
      return;
    }
    try {
      const data = await fetchSubcategories(selectedParent);
      setSubcategories(data);
    } catch (error) {
      console.error('Failed to load subcategories:', error);
      setSubcategories([]);
    }
  }, [selectedParent]);

  // Fetch businesses
  const loadBusinesses = useCallback(async () => {
    if (authLoading) return; // Wait for auth to resolve first

    setLoading(true);
    try {
      // If searching, always search all businesses
      if (searchQuery) {
        const data = await fetchBusinesses({
          state: selectedState,
          search: searchQuery,
          page: currentPage,
          limit: 20,
        });
        setBusinesses(data.businesses);
        setPagination(data.pagination);
      } else if (isProvider && token) {
        // Providers see their own businesses
        const data = await fetchMyBusinesses(token);
        setBusinesses(data.businesses);
        setPagination(null);
      } else if (locationEnabled && userLat !== null && userLng !== null) {
        const data = await fetchNearbyBusinesses({
          lat: userLat,
          lng: userLng,
          radius,
          category: selectedSubcategory || undefined,
          parentCategory: !selectedSubcategory ? selectedParent || undefined : undefined,
          page: currentPage,
          limit: 20,
        });
        setBusinesses(data.businesses);
        setPagination(data.pagination);
      } else {
        const data = await fetchBusinesses({
          state: selectedState,
          category: selectedSubcategory || undefined,
          parentCategory: !selectedSubcategory ? selectedParent || undefined : undefined,
          search: searchQuery || undefined,
          page: currentPage,
          limit: 20,
        });
        setBusinesses(data.businesses);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to load businesses:', error);
      setBusinesses([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [selectedState, selectedParent, selectedSubcategory, searchQuery, currentPage, locationEnabled, userLat, userLng, radius, isProvider, token, authLoading]);

  useEffect(() => {
    loadParentCategories();
  }, [loadParentCategories]);

  useEffect(() => {
    loadSubcategories();
  }, [loadSubcategories]);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  const handleStateChange = (state: AustralianState) => {
    setSelectedState(state);
    setCurrentPage(1);
  };

  const handleParentSelect = (slug: string | null) => {
    setSelectedParent(slug);
    setSelectedSubcategory(null);
    setCurrentPage(1);
  };

  const handleSubcategorySelect = (slug: string | null) => {
    setSelectedSubcategory(slug);
    setCurrentPage(1);
  };

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLocationToggle = () => {
    if (!locationEnabled) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
          setLocationEnabled(true);
        },
        () => { /* silently fail */ }
      );
    } else {
      setLocationEnabled(false);
      setUserLat(null);
      setUserLng(null);
    }
    setCurrentPage(1);
  };

  const handleListBusinessClick = () => {
    if (!user) {
      setShowAuth(true);
    } else if (isProvider) {
      setShowRegister(true);
    }
  };

  if (authLoading) {
    return (
      <div className="app">
        <Header selectedState={selectedState} onStateChange={handleStateChange} onLoginClick={() => setShowAuth(true)} onMessagesClick={() => setShowMessages(true)} onRequestsClick={() => setShowRequests(true)} onProfileClick={() => setShowProfile(true)} onListBusinessClick={handleListBusinessClick} onFindNearMe={handleLocationToggle} onLogoClick={() => { setSelectedParent(null); setSelectedSubcategory(null); setSearchQuery(""); setMode("seeker"); }} />
        <main className="main-content">
          <CategoryGrid
            parentCategories={parentCategories}
            subcategories={[]}
            selectedParent={null}
            selectedSubcategory={null}
            onParentSelect={handleParentSelect}
            onSubcategorySelect={handleSubcategorySelect} onPostClick={() => setShowPostNeeded(true)}
          />
        </main>
      </div>
    );
  }

  const HomePage = () => (
    <main className="main-content">
      {/* Global filters - always visible */}
      <div className={`filters-row ${!user ? 'filters-row-logout' : ''}`}>
        <div className="filters-actions">
          {user ? (
            <div className="mode-switch">
              <button
                className={`mode-switch-btn ${mode === 'seeker' ? 'active' : ''}`}
                onClick={() => setMode('seeker')}
              >
                🔍 Looking for
              </button>
              <button
                className={`mode-switch-btn ${mode === 'provider' ? 'active' : ''}`}
                onClick={() => setMode('provider')}
              >
                ➕ Listing
              </button>
            </div>
          ) : (
            <>
              {!locationEnabled ? (
                <button
                  className="register-btn location-btn"
                  onClick={handleLocationToggle}
                >
                  📍 Near Me
                </button>
              ) : (
                <select
                  className="register-btn location-btn active radius-dropdown"
                  value={radius}
                  onChange={(e) => {
                    if (e.target.value === 'off') {
                      handleLocationToggle();
                    } else {
                      setRadius(parseInt(e.target.value));
                      setCurrentPage(1);
                    }
                  }}
                >
                  <option value="5">📍 5 km ▾</option>
                  <option value="10">📍 10 km ▾</option>
                  <option value="25">📍 25 km ▾</option>
                  <option value="50">📍 50 km ▾</option>
                  <option value="100">📍 100 km ▾</option>
                  <option value="off">✕ Turn off</option>
                </select>
              )}
            </>
          )}
          {user && (
            <>
              {!locationEnabled ? (
                <button
                  className="register-btn location-btn"
                  onClick={handleLocationToggle}
                >
                  📍 Near Me
                </button>
              ) : (
                <select
                  className="register-btn location-btn active radius-dropdown"
                  value={radius}
                  onChange={(e) => {
                    if (e.target.value === 'off') {
                      handleLocationToggle();
                    } else {
                      setRadius(parseInt(e.target.value));
                      setCurrentPage(1);
                    }
                  }}
                >
                  <option value="5">📍 5 km ▾</option>
                  <option value="10">📍 10 km ▾</option>
                  <option value="25">📍 25 km ▾</option>
                  <option value="50">📍 50 km ▾</option>
                  <option value="100">📍 100 km ▾</option>
                  <option value="off">✕ Turn off</option>
                </select>
              )}
            </>
          )}
        </div>
        <SearchBar onSearch={handleSearch} key="main-search" />
        {!user && (
          <button className="register-btn login-main-btn" onClick={() => setShowAuth(true)}>
            Login / Sign Up
          </button>
        )}
      </div>

      {isProvider ? (
        <>
          {user && (
            <div className="provider-dashboard-header">
              <h2>My Listed Businesses</h2>
              <button className="register-btn" onClick={handleListBusinessClick}>
                + List Your Business
              </button>
            </div>
          )}
          {user && (
            <BusinessList
              businesses={businesses}
              pagination={pagination}
              loading={loading}
              onPageChange={handlePageChange}
            />
          )}
          <ServiceWantedFeed />
        </>
      ) : (
        <>

          {/* My Requests - shows user's posted requests */}
          <MyRequests onPostClick={() => setShowPostNeeded(true)} />

          {/* Breadcrumb navigation */}
          {(selectedParent || selectedSubcategory) && (
            <div className="breadcrumb">
              <button className="breadcrumb-btn" onClick={() => { handleParentSelect(null); }}>
                ← All Categories
              </button>
              {selectedParent && selectedSubcategory && (
                <button className="breadcrumb-btn" onClick={() => handleSubcategorySelect(null)}>
                  ← {parentCategories.find(c => c.slug === selectedParent)?.name || 'Back'}
                </button>
              )}
            </div>
          )}

          {/* Step 1: Show parent categories */}
          {!selectedParent && (
            <CategoryGrid
              parentCategories={parentCategories}
              subcategories={[]}
              selectedParent={null}
              selectedSubcategory={null}
              onParentSelect={handleParentSelect}
              onSubcategorySelect={handleSubcategorySelect} onPostClick={() => setShowPostNeeded(true)}
            />
          )}

          {/* Step 2: Show subcategories when parent is selected */}
          {selectedParent && !selectedSubcategory && (
            <CategoryGrid
              parentCategories={parentCategories}
              subcategories={subcategories}
              selectedParent={selectedParent}
              selectedSubcategory={null}
              onParentSelect={handleParentSelect}
              onSubcategorySelect={handleSubcategorySelect} onPostClick={() => setShowPostNeeded(true)}
            />
          )}

          {/* Step 3: Show businesses when subcategory is selected or search is active */}
          {(selectedSubcategory || searchQuery) && (
            <BusinessList
              businesses={businesses}
              pagination={pagination}
              loading={loading}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </main>
  );

  return (
    <div className="app">
      <Header selectedState={selectedState} onStateChange={handleStateChange} onLoginClick={() => setShowAuth(true)} onMessagesClick={() => setShowMessages(true)} onRequestsClick={() => setShowRequests(true)} onProfileClick={() => setShowProfile(true)} onListBusinessClick={handleListBusinessClick} onFindNearMe={handleLocationToggle} onLogoClick={() => { setSelectedParent(null); setSelectedSubcategory(null); setSearchQuery(""); setMode("seeker"); }} />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/business/:id" element={<BusinessPage />} />
        <Route path="/request/:id" element={<RequestPage />} />
      </Routes>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>🇳🇵 NepaliOriPari</h3>
            <p>Connecting the Nepali community with trusted local businesses across Australia.</p>
          </div>
          <div className="footer-social">
            <div className="social-icons">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon facebook" aria-label="Facebook">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon instagram" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="social-icon tiktok" aria-label="TikTok">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.88 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .56.04.82.11v-3.5a6.37 6.37 0 00-.82-.05A6.34 6.34 0 003.15 15.7a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.41a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.84z"/></svg>
              </a>
              <a href="mailto:support@nepalioripari.com" className="social-icon email" aria-label="Email">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} NepaliOriPari. Made with ❤️ for the Nepali community in Australia.</p>
        </div>
      </footer>
      <RegisterBusiness
        show={showRegister}
        onClose={() => setShowRegister(false)}
        onSuccess={() => { loadBusinesses(); loadParentCategories(); }}
      />
      <AuthModal show={showAuth} onClose={() => setShowAuth(false)} />
      <ChatInbox show={showMessages} onClose={() => { setShowMessages(false); refreshCounts(); }} />
      <ServiceRequests show={showRequests} onClose={() => { setShowRequests(false); refreshCounts(); }} />
      <Profile show={showProfile} onClose={() => setShowProfile(false)} />
      <PostServiceNeeded show={showPostNeeded} onClose={() => setShowPostNeeded(false)} onSuccess={() => window.location.reload()} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
