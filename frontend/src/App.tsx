import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { CategoryGrid } from './components/CategoryGrid';
import { BusinessList } from './components/BusinessList';
import { LocationFilter } from './components/LocationFilter';
import { RegisterBusiness } from './components/RegisterBusiness';
import { AuthModal } from './components/AuthModal';
import { ChatInbox } from './components/ChatInbox';
import { ServiceRequests } from './components/ServiceRequests';
import { Profile } from './components/Profile';
import { PostServiceNeeded } from './components/PostServiceNeeded';
import { ServiceWantedFeed } from './components/ServiceWantedFeed';
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

  const isProvider = user?.role === 'provider';

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
      // Providers only see their own businesses
      if (isProvider && token) {
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

  const handleLocationToggle = (enabled: boolean, lat?: number, lng?: number) => {
    setLocationEnabled(enabled);
    if (enabled && lat !== undefined && lng !== undefined) {
      setUserLat(lat);
      setUserLng(lng);
    } else {
      setUserLat(null);
      setUserLng(null);
    }
    setCurrentPage(1);
  };

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
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
        <Header selectedState={selectedState} onStateChange={handleStateChange} onLoginClick={() => setShowAuth(true)} onMessagesClick={() => setShowMessages(true)} onRequestsClick={() => setShowRequests(true)} onProfileClick={() => setShowProfile(true)} />
        <main className="main-content">
          <CategoryGrid
            parentCategories={parentCategories}
            subcategories={[]}
            selectedParent={null}
            selectedSubcategory={null}
            onParentSelect={handleParentSelect}
            onSubcategorySelect={handleSubcategorySelect}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <Header selectedState={selectedState} onStateChange={handleStateChange} onLoginClick={() => setShowAuth(true)} onMessagesClick={() => setShowMessages(true)} onRequestsClick={() => setShowRequests(true)} onProfileClick={() => setShowProfile(true)} />
      <main className="main-content">
        {isProvider && user ? (
          <>
            <div className="provider-dashboard-header">
              <h2>My Listed Businesses</h2>
              <button className="register-btn" onClick={handleListBusinessClick}>
                + List Your Business
              </button>
            </div>
            <BusinessList
              businesses={businesses}
              pagination={pagination}
              loading={loading}
              onPageChange={handlePageChange}
            />
            <ServiceWantedFeed />
          </>
        ) : (
          <>
            <div className="filters-row">
              <div className="filters-left">
                <LocationFilter
                  locationEnabled={locationEnabled}
                  radius={radius}
                  onLocationToggle={handleLocationToggle}
                  onRadiusChange={handleRadiusChange}
                />
                {!user && (
                  <button className="register-btn" onClick={handleListBusinessClick}>
                    + List Your Business
                  </button>
                )}
                {user?.role === 'seeker' && (
                  <button className="register-btn post-needed-btn" onClick={() => setShowPostNeeded(true)}>
                    🔍 Post What You Need
                  </button>
                )}
              </div>
              <SearchBar onSearch={handleSearch} />
            </div>

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
                onSubcategorySelect={handleSubcategorySelect}
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
                onSubcategorySelect={handleSubcategorySelect}
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
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>🇳🇵 NepaliOriPari</h3>
            <p>Connecting the Nepali community with trusted local businesses across Australia.</p>
          </div>
          <div className="footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li>List Your Business</li>
              <li>About Us</li>
              <li>Contact</li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Community</h4>
            <ul>
              <li>Facebook</li>
              <li>Instagram</li>
              <li>Support</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} NepaliOriPari. Made with ❤️ for the Nepali community in Australia.</p>
        </div>
      </footer>
      <RegisterBusiness
        show={showRegister}
        onClose={() => setShowRegister(false)}
        onSuccess={loadBusinesses}
      />
      <AuthModal show={showAuth} onClose={() => setShowAuth(false)} />
      <ChatInbox show={showMessages} onClose={() => { setShowMessages(false); refreshCounts(); }} />
      <ServiceRequests show={showRequests} onClose={() => { setShowRequests(false); refreshCounts(); }} />
      <Profile show={showProfile} onClose={() => setShowProfile(false)} />
      <PostServiceNeeded show={showPostNeeded} onClose={() => setShowPostNeeded(false)} onSuccess={() => {}} />
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
