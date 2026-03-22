import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const CATEGORIES = [
  { name: 'Grocery', icon: '🛒', color: '#E8F5E9' },
  { name: 'Pharmacy', icon: '💊', color: '#E3F2FD' },
  { name: 'Electronics', icon: '📱', color: '#F3E5F5' },
  { name: 'Food', icon: '🍕', color: '#FFF3E0' },
  { name: 'Hardware', icon: '🔧', color: '#FCE4EC' },
  { name: 'Clothing', icon: '👕', color: '#E0F2F1' },
];

export default function CustomerHome() {
  const { currentUser, shops, favorites, toggleFavorite, setSelectedShop, setCurrentScreen, logout, searchProducts } = useApp();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('home'); // home | search | favorites | profile
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (val) => {
    setSearch(val);
    if (val.trim()) {
      setSearchResults(searchProducts(val));
      setHasSearched(true);
      setTab('search');
    } else {
      setSearchResults([]);
      setHasSearched(false);
    }
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
    <div className="screen" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #FF6B2C, #E85A1B)',
          padding: '52px 24px 28px',
          borderRadius: '0 0 32px 32px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Good morning,</p>
              <h2 style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: 22, fontWeight: 700 }}>
                {currentUser?.name?.split(' ')[0]} 👋
              </h2>
            </div>
            <div style={{
              width: 40, height: 40,
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>🔔</div>
          </div>

          {/* Search */}
          <div style={{
            background: 'white',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            padding: '4px 16px',
            gap: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}>
            <span style={{ fontSize: 18 }}>🔍</span>
            <input
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, padding: '12px 0', background: 'transparent', color: 'var(--text)' }}
              placeholder="Search for anything — rice, medicine..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => { setSearch(''); setHasSearched(false); setTab('home'); }} style={{ fontSize: 18 }}>✕</button>
            )}
          </div>
        </div>

        {tab === 'home' && (
          <div style={{ padding: '20px 24px' }}>
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
            {shops.map(shop => <ShopCard key={shop.id} shop={shop} />)}
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

            {[
              { icon: '🏪', label: 'Nearby Shops', count: shops.length },
              { icon: '❤️', label: 'Favourites', count: favorites.length },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 0', borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 24 }}>{item.icon}</div>
                <span style={{ flex: 1, fontWeight: 500 }}>{item.label}</span>
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{item.count}</span>
              </div>
            ))}

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
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        background: 'white',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        padding: '8px 0 16px',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
        zIndex: 100,
      }}>
        {[
          { id: 'home', icon: '🏠', label: 'Home' },
          { id: 'search', icon: '🔍', label: 'Search' },
          { id: 'favorites', icon: '❤️', label: 'Saved' },
          { id: 'profile', icon: '👤', label: 'Profile' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '8px 0',
              color: tab === item.id ? 'var(--primary)' : 'var(--text3)',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === item.id ? 600 : 400 }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
