import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { auth, googleProvider } from '../firebase';
import { EmailAuthProvider, linkWithCredential, linkWithPopup, unlink, updatePassword } from 'firebase/auth';

const CATEGORIES = [
  { name: 'Grocery', icon: '🛒', color: '#E8F5E9' },
  { name: 'Pharmacy', icon: '💊', color: '#E3F2FD' },
  { name: 'Electronics', icon: '📱', color: '#F3E5F5' },
  { name: 'Food', icon: '🍕', color: '#FFF3E0' },
  { name: 'Hardware', icon: '🔧', color: '#FCE4EC' },
  { name: 'Clothing', icon: '👕', color: '#E0F2F1' },
];

export default function CustomerHome() {
  const { 
    currentUser, shops, favorites, toggleFavorite, setSelectedShop, setCurrentScreen, logout, searchProducts, 
    posts, transit, addPost, likePost,
    civicIssues, addCivicIssue,
  } = useApp();

  const services = shops.filter(s => s.category === 'Service/Repair');
  const healthInfo = { hospitals: shops.filter(s => s.category === 'Healthcare/Hospital') };
  const jobs = shops.filter(s => s.category === 'Job Listing');
  const realEstate = shops.filter(s => s.category === 'Real Estate/PG');
  const events = shops.filter(s => s.category === 'Local Event');
  const marketplace = shops.filter(s => s.category === 'Buy & Sell/Marketplace');
  const retailShops = shops.filter(s => !['Service/Repair', 'Healthcare/Hospital', 'Job Listing', 'Real Estate/PG', 'Local Event', 'Buy & Sell/Marketplace'].includes(s.category));
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('home'); // home | search | favorites | profile
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [activeModule, setActiveModule] = useState('shops'); // shops | services | health | civic | jobs | realestate | events
  const [newIssue, setNewIssue] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' });

  const authUser = auth.currentUser;
  const providerIds = useMemo(() => {
    const ids = (authUser?.providerData || []).map(p => p.providerId);
    return new Set(ids);
  }, [authUser?.providerData]);
  const hasGoogle = providerIds.has('google.com');
  const hasPassword = providerIds.has('password');

  const handleLinkGoogle = async () => {
    setLinkLoading(true);
    setLinkError('');
    try {
      await linkWithPopup(authUser, googleProvider);
    } catch (e) {
      console.error(e);
      setLinkError(e.message);
    } finally {
      setLinkLoading(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    setLinkLoading(true);
    setLinkError('');
    try {
      await unlink(authUser, 'google.com');
    } catch (e) {
      console.error(e);
      setLinkError(e.message);
    } finally {
      setLinkLoading(false);
    }
  };

  const handleSetPassword = async () => {
    const email = authUser?.email;
    if (!email) { setLinkError('Missing email on account.'); return; }
    if (!passwordForm.password || passwordForm.password.length < 6) { setLinkError('Password must be at least 6 characters.'); return; }
    if (passwordForm.password !== passwordForm.confirm) { setLinkError('Passwords do not match.'); return; }

    setLinkLoading(true);
    setLinkError('');
    try {
      if (hasPassword) {
        await updatePassword(authUser, passwordForm.password);
      } else {
        const cred = EmailAuthProvider.credential(email, passwordForm.password);
        await linkWithCredential(authUser, cred);
      }
      setPasswordForm({ password: '', confirm: '' });
    } catch (e) {
      console.error(e);
      setLinkError(e.message);
    } finally {
      setLinkLoading(false);
    }
  };

  const handleSearch = (val) => {
    setSearch(val);
    if (val.trim()) {
      setSearchResults(searchProducts(val));
      setHasSearched(true);
      if (tab !== 'search') setTab('search');
    } else {
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  const submitPost = async () => {
    if (!newPostContent.trim()) return;
    setIsPosting(true);
    await addPost(newPostContent);
    setNewPostContent('');
    setIsPosting(false);
  };

  const openShop = (shop) => {
    setSelectedShop(shop);
    setCurrentScreen('shopDetail');
  };

  const favoriteShops = shops.filter(s => favorites.includes(s.id));

  const renderStars = (rating) => {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  };

  const ShopCard = ({ shop, showProducts }) => (
    <div
      onClick={() => openShop(shop)}
      style={{
        background: 'white',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        boxShadow: 'var(--shadow)',
        cursor: 'pointer',
        transition: 'transform 0.15s',
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'var(--primary-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, flexShrink: 0,
        }}>
          {CATEGORIES.find(c => c.name === shop.category)?.icon || '🏪'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{shop.name}</h3>
              <span style={{
                background: 'var(--surface2)', color: 'var(--text2)',
                fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500,
              }}>{shop.category}</span>
            </div>
            <button
              onClick={e => { e.stopPropagation(); toggleFavorite(shop.id); }}
              style={{ fontSize: 20, color: favorites.includes(shop.id) ? '#e53e3e' : 'var(--border)' }}
            >
              {favorites.includes(shop.id) ? '❤️' : '🤍'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ color: '#F6C90E', fontSize: 12 }}>
              {renderStars(shop.rating)} <span style={{ color: 'var(--text2)' }}>{shop.rating} ({shop.reviews})</span>
            </span>
            <span style={{ color: 'var(--text3)', fontSize: 12 }}>📍 {shop.distance}</span>
          </div>
          {showProducts && shop.matchingProducts && (
            <div style={{ marginTop: 10 }}>
              <p style={{ color: 'var(--text3)', fontSize: 11, marginBottom: 4 }}>MATCHING ITEMS</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {shop.matchingProducts.slice(0, 3).map(p => (
                  <span key={p.id} style={{
                    background: p.available ? '#E8F5E9' : '#FEE2E2',
                    color: p.available ? '#2e7d32' : '#c62828',
                    fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 500,
                  }}>
                    {p.name} — ₹{p.price}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="cf-screen">
      <div className="cf-top">
        <div className="cf-top-inner">
          <div className="cf-row" style={{ justifyContent: 'space-between' }}>
            <div>
              <div className="cf-title">CityFind</div>
              <div className="cf-subtitle">
                Hi {currentUser?.name?.split(' ')[0] || 'there'} — find anything in your city
              </div>
            </div>
            <div style={{
              width: 38, height: 38,
              borderRadius: 14,
              background: 'var(--cf-surface)',
              border: '1px solid var(--cf-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 10px 22px rgba(11,18,32,0.06)',
              fontSize: 18
            }}>
              🔔
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div className="cf-search">
            <span style={{ fontSize: 18 }}>🔎</span>
            <input
              placeholder="Search products, shops, services…"
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
            {search && (
              <button
                className="cf-btn cf-btn-ghost"
                onClick={() => { setSearch(''); setHasSearched(false); setTab('home'); }}
                style={{ padding: 8, borderRadius: 12, borderColor: 'transparent' }}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="cf-safe" style={{ paddingTop: 10 }}>

        {tab === 'home' && (
          <div style={{ padding: '0 24px 20px' }}>
            {/* Mega Menu / Module Picker */}
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '20px 0', margin: '0 -24px', paddingLeft: 24, scrollbarWidth: 'none' }}>
              {[
                { id: 'shops', name: 'Shops', icon: '🛍️', color: '#FFF3E0' },
                { id: 'services', name: 'Services', icon: '🔧', color: '#E3F2FD' },
                { id: 'health', name: 'Health & SOS', icon: '🏥', color: '#FFEBEE' },
                { id: 'civic', name: 'Civic Voice', icon: '🛣️', color: '#E8F5E9' },
                { id: 'jobs', name: 'Local Jobs', icon: '💼', color: '#F3E5F5' },
                { id: 'realestate', name: 'Real Estate', icon: '🏠', color: '#E0F2F1' },
                { id: 'events', name: 'Events', icon: '🎉', color: '#FFF8E1' },
                { id: 'marketplace', name: 'Buy & Sell', icon: '🤝', color: '#E8EAF6' },
              ].map(mod => (
                <div 
                  key={mod.id} 
                  onClick={() => setActiveModule(mod.id)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0,
                    width: 76,
                    cursor: 'pointer',
                    opacity: activeModule === mod.id ? 1 : 0.6,
                    transform: activeModule === mod.id ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ width: 62, height: 62, borderRadius: 20, background: mod.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: activeModule === mod.id ? '0 4px 12px rgba(0,0,0,0.1)' : 'none', border: activeModule === mod.id ? '2px solid var(--primary)' : '2px solid transparent' }}>
                    {mod.icon}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: activeModule === mod.id ? 700 : 500, textAlign: 'center', color: 'var(--text)' }}>
                    {mod.name}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0 24px' }} />

            {/* --- MODULE: SHOPS --- */}
            {activeModule === 'shops' && (
              <div>
            {/* Categories */}
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Categories</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
              {CATEGORIES.map(cat => (
                <div
                  key={cat.name}
                  onClick={() => handleSearch(cat.name)}
                  style={{
                    background: cat.color,
                    borderRadius: 16,
                    padding: '16px 12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.15s',
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{cat.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{cat.name}</div>
                </div>
              ))}
            </div>

            {/* Nearby Shops */}
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>
              Nearby Shops
            </h3>
            {retailShops.map(shop => <ShopCard key={shop.id} shop={shop} />)}
              </div>
            )}

            {/* --- MODULE: SERVICES --- */}
            {activeModule === 'services' && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Professional Services</h3>
                {services.map(s => (
                  <div key={s.id} style={{ background: 'white', borderRadius: 20, padding: 16, marginBottom: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 50, height: 50, background: '#E3F2FD', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🔧</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.category} • ⭐ {s.rating} • 📍 {s.distance}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <button style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', padding: '6px', borderRadius: 12, fontWeight: 700, fontSize: 12 }}>📞 Call</button>
                      <button onClick={() => alert('Booking calendar opened!')} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '6px', borderRadius: 12, fontWeight: 700, fontSize: 12 }}>📅 Book</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* --- MODULE: HEALTH --- */}
            {activeModule === 'health' && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Hospitals & Clinics</h3>
                {healthInfo.hospitals.map(h => (
                  <div key={h.id} style={{ background: 'white', borderRadius: 20, padding: 16, marginBottom: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 50, height: 50, background: '#FFEBEE', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏥</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{h.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>📍 {h.distance}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <span style={{ background: '#E8F5E9', color: '#2e7d32', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{h.products?.length || 'Available'} slots</span>
                      <button onClick={() => alert('Booking logic initiated!')} style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', padding: '4px 10px', borderRadius: 12, fontWeight: 700, fontSize: 11 }}>Book Doc</button>
                    </div>
                  </div>
                ))}
                
                <button style={{ width: '100%', padding: '16px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 16, fontWeight: 700, marginTop: 12, display: 'flex', justifyContent: 'center', gap: 8, fontSize: 15 }}>
                  <span style={{ fontSize: 18 }}>🩸</span> Request Blood (SOS)
                </button>
              </div>
            )}

            {/* --- MODULE: CIVIC VOICE --- */}
            {activeModule === 'civic' && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Report Local Issues</h3>
                
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <input value={newIssue} onChange={e => setNewIssue(e.target.value)} placeholder="E.g., Broken street light on Main Rd" style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface2)', outline: 'none' }} />
                  <button onClick={() => { if(newIssue){ addCivicIssue(newIssue); setNewIssue(''); } }} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0 20px', borderRadius: 12, fontWeight: 700 }}>Report</button>
                </div>

                {civicIssues.map(c => (
                  <div key={c.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 16, marginBottom: 12, display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{c.title}</div>
                      <span style={{ background: '#FFF8E1', color: '#F59E0B', fontSize: 11, padding: '3px 8px', borderRadius: 10, fontWeight: 600 }}>{c.status}</span>
                    </div>
                    <button style={{ background: 'var(--surface2)', border: 'none', padding: '8px 16px', borderRadius: 12, fontWeight: 600, color: 'var(--text)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span>⬆️</span>
                      <span style={{ fontSize: 12 }}>{c.upvotes}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* --- MODULE: JOBS --- */}
            {activeModule === 'jobs' && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Local Job Board</h3>
                {jobs.map(j => (
                  <div key={j.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{j.name}</div>
                      <span style={{ background: '#E8F5E9', color: '#2e7d32', fontSize: 12, padding: '4px 8px', borderRadius: 12, fontWeight: 600 }}>{j.hours || "Negotiable"}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>🏪 {j.address}</div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                      <button onClick={() => alert('Resume uploaded via native file picker!')} style={{ flex: 1, background: 'var(--surface2)', color: 'var(--text)', padding: '10px', borderRadius: 10, fontWeight: 600, border: '1px solid var(--border)' }}>📄 Upload Resume</button>
                      <button onClick={() => alert('Application sent!')} style={{ flex: 1, background: 'var(--primary-light)', color: 'var(--primary)', padding: '10px', borderRadius: 10, fontWeight: 600, border: 'none' }}>Apply Now</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* --- MODULE: REAL ESTATE --- */}
            {activeModule === 'realestate' && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Properties & PG</h3>
                {realEstate.map(r => (
                  <div key={r.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 16, marginBottom: 12, display: 'flex', gap: 12 }}>
                    <div style={{ width: 60, height: 60, background: '#E0F2F1', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🏠</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{r.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>📍 {r.address}</div>
                      <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 14 }}>{r.hours || "Contact Owner"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* --- MODULE: MARKETPLACE --- */}
            {activeModule === 'marketplace' && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>OLX Local (Buy & Sell)</h3>
                <button style={{ width: '100%', marginBottom: 16, background: '#F3E5F5', color: '#7B1FA2', border: '1px dashed #CE93D8', padding: '14px', borderRadius: 16, fontWeight: 700, fontSize: 15 }}>
                  + Sell an Item
                </button>
                {marketplace.map(m => (
                  <div key={m.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 60, height: 60, background: 'var(--surface2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>Seller: {m.phone || 'Verified User'}</div>
                      <div style={{ color: '#2e7d32', fontWeight: 800, fontSize: 16, marginTop: 4 }}>{m.hours || 'Negotiable'}</div>
                    </div>
                    <button onClick={() => alert('In-App Chat interface opened!')} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 12, fontWeight: 700, fontSize: 13 }}>Chat</button>
                  </div>
                ))}
              </div>
            )}

            {/* --- MODULE: EVENTS --- */}
            {activeModule === 'events' && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>City Events</h3>
                {events.map(e => (
                  <div key={e.id} style={{ background: 'linear-gradient(135deg, white, #FFF8E1)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, marginBottom: 12 }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>🎉</div>
                    <div style={{ fontWeight: 800, fontSize: 18, fontFamily: 'var(--font-display)', marginBottom: 4 }}>{e.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>📅 {e.hours || "Upcoming"}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2, marginBottom: 12 }}>📍 {e.address}</div>
                    <button onClick={() => alert('Proceeding to Digital Ticketing...')} style={{ width: '100%', background: 'var(--text)', color: 'white', padding: '12px', borderRadius: 12, fontWeight: 700, border: 'none' }}>🎫 Buy Ticket</button>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {tab === 'search' && (
          <div style={{ padding: '20px 24px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
              Results for "{search}"
            </h3>
            <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 16 }}>
              {searchResults.length} shop{searchResults.length !== 1 ? 's' : ''} found
            </p>
            {searchResults.length === 0 && hasSearched ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 60, marginBottom: 16 }}>🔍</div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 8 }}>No results found</h4>
                <p style={{ color: 'var(--text2)', fontSize: 14 }}>Try searching with different keywords</p>
              </div>
            ) : (
              searchResults.map(shop => <ShopCard key={shop.id} shop={shop} showProducts />)
            )}
          </div>
        )}

        {tab === 'favorites' && (
          <div style={{ padding: '20px 24px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>
              My Favourites
            </h3>
            {favoriteShops.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 60, marginBottom: 16 }}>🤍</div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 8 }}>No favourites yet</h4>
                <p style={{ color: 'var(--text2)', fontSize: 14 }}>Tap the heart on any shop to save it</p>
              </div>
            ) : (
              favoriteShops.map(shop => <ShopCard key={shop.id} shop={shop} />)
            )}
          </div>
        )}

        {tab === 'pulse' && (
          <div style={{ padding: '20px 24px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, marginBottom: 8 }}>
              City Pulse
            </h3>
            
            {/* Weather Widget */}
            <div style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.9 }}>CURRENT WEATHER</div>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)' }}>32°C</div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>Sunny • Air Quality: Good</div>
              </div>
              <div style={{ fontSize: 40 }}>☀️</div>
            </div>

            <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>
              Live updates from your community.
            </p>

            {/* Post creator */}
            <div style={{ background: 'white', borderRadius: 20, padding: 16, marginBottom: 24, boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  👤
                </div>
                <div style={{ flex: 1 }}>
                  <textarea 
                    placeholder="What's happening in your area?"
                    value={newPostContent}
                    onChange={e => setNewPostContent(e.target.value)}
                    style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', fontSize: 15, fontFamily: 'var(--font-sans)', minHeight: 60 }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button 
                      onClick={submitPost}
                      disabled={isPosting || !newPostContent.trim()}
                      className="btn-primary" 
                      style={{ padding: '8px 20px', fontSize: 13, borderRadius: 12, opacity: isPosting ? 0.7 : 1 }}
                    >
                      {isPosting ? '...' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {posts.map(post => (
                <div key={post.id} style={{ background: 'white', borderRadius: 20, padding: 20, boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 20, background: '#F3E5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      📢
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-display)' }}>{post.authorName}</div>
                      <div style={{ color: 'var(--text3)', fontSize: 11 }}>{new Date(post.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.5, marginBottom: 16 }}>
                    {post.content}
                  </p>
                  <div style={{ display: 'flex', gap: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <button 
                      onClick={() => likePost(post.id, post.likes)} 
                      style={{ color: 'var(--text2)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}
                    >
                      <span style={{ fontSize: 16 }}>👍</span> {post.likes} Likes
                    </button>
                  </div>
                </div>
              ))}
              {posts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text2)' }}>
                  No posts yet. Be the first to share an update!
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'transit' && (
          <div style={{ padding: '20px 24px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, marginBottom: 8 }}>
              Live Transit
            </h3>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>
              City transport schedules and parking.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {transit.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'white', borderRadius: 20, padding: 16, boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: t.type === 'bus' ? '#E3F2FD' : t.type === 'parking' ? '#E8F5E9' : '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                    {t.type === 'bus' ? '🚌' : t.type === 'parking' ? '🅿️' : '🛺'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-display)' }}>{t.route}</div>
                    <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 4 }}>📍 {t.location}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: 11, fontWeight: 700, 
                      color: t.status === 'Available' || t.status === 'On Time' ? '#2e7d32' : '#c62828',
                      background: t.status === 'Available' || t.status === 'On Time' ? '#E8F5E9' : '#FEE2E2',
                      padding: '4px 10px', borderRadius: 20, display: 'inline-block', marginBottom: 6
                    }}>
                      {t.status}
                    </div>
                    {t.eta && <div style={{ fontSize: 15, fontWeight: 800 }}>{t.eta}</div>}
                    {t.spots && <div style={{ fontSize: 15, fontWeight: 800 }}>{t.spots} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)' }}>spots</span></div>}
                    {t.count && <div style={{ fontSize: 15, fontWeight: 800 }}>{t.count} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)' }}>vehicles</span></div>}
                  </div>
                </div>
              ))}
              {(!transit || transit.length === 0) && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)' }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>🚌</div>
                  Transit feed is not connected yet.
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'profile' && (
          <div style={{ padding: '20px 24px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #FF6B2C, #E85A1B)',
              borderRadius: 24,
              padding: 24,
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}>
              <div style={{
                width: 60, height: 60,
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28,
              }}>👤</div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: 20, fontWeight: 700 }}>
                  {currentUser?.name}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{currentUser?.email}</p>
                <span style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white', fontSize: 11,
                  padding: '2px 10px', borderRadius: 20,
                  marginTop: 4, display: 'inline-block',
                }}>Customer</span>
              </div>
            </div>

            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, margin: '10px 0 12px' }}>Account & Login</h3>
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, marginBottom: 10 }}>SIGN-IN METHODS</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <span style={{ background: hasGoogle ? '#E8F5E9' : '#F3F4F6', color: hasGoogle ? '#2e7d32' : '#6B7280', fontSize: 11, padding: '4px 10px', borderRadius: 999, fontWeight: 700 }}>
                  Google {hasGoogle ? 'Connected' : 'Not connected'}
                </span>
                <span style={{ background: hasPassword ? '#E8F5E9' : '#F3F4F6', color: hasPassword ? '#2e7d32' : '#6B7280', fontSize: 11, padding: '4px 10px', borderRadius: 999, fontWeight: 700 }}>
                  Password {hasPassword ? 'Set' : 'Not set'}
                </span>
              </div>

              {linkError && <div style={{ color: '#e53e3e', fontSize: 12, fontWeight: 600, marginBottom: 10 }}>{linkError}</div>}

              {!hasGoogle ? (
                <button
                  onClick={handleLinkGoogle}
                  disabled={linkLoading || !authUser}
                  className="btn-google"
                  style={{ width: '100%', opacity: linkLoading ? 0.7 : 1 }}
                >
                  Connect Google
                </button>
              ) : (
                <button
                  onClick={handleUnlinkGoogle}
                  disabled={linkLoading || !authUser}
                  style={{ width: '100%', padding: 14, borderRadius: 14, fontWeight: 700, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)' }}
                >
                  Disconnect Google
                </button>
              )}

              <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />

              <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, marginBottom: 10 }}>
                {hasPassword ? 'CHANGE PASSWORD' : 'SET A PASSWORD'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  className="input-field"
                  type="password"
                  placeholder="New password"
                  value={passwordForm.password}
                  onChange={e => setPasswordForm(p => ({ ...p, password: e.target.value }))}
                />
                <input
                  className="input-field"
                  type="password"
                  placeholder="Confirm password"
                  value={passwordForm.confirm}
                  onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                />
                <button
                  className="btn-primary"
                  onClick={handleSetPassword}
                  disabled={linkLoading || !authUser}
                  style={{ opacity: linkLoading ? 0.7 : 1 }}
                >
                  {linkLoading ? 'Saving...' : (hasPassword ? 'Update Password' : 'Set Password')}
                </button>
              </div>
            </div>

            <button
              onClick={logout}
              style={{
                marginTop: 24, width: '100%', padding: '16px',
                background: '#FEE2E2', color: '#c62828',
                borderRadius: 14, fontWeight: 600, fontSize: 15,
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="cf-bottom">
        <div className="cf-bottom-inner">
          {[
            { id: 'home', icon: '🏠', label: 'Home' },
            { id: 'pulse', icon: '🗣️', label: 'Pulse' },
            { id: 'transit', icon: '🚌', label: 'Transit' },
            { id: 'favorites', icon: '❤️', label: 'Saved' },
            { id: 'profile', icon: '👤', label: 'Profile' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className="cf-navbtn"
              data-active={tab === item.id ? 'true' : 'false'}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
