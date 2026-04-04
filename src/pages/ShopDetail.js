import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const CATEGORY_ICONS = {
  Grocery: '🛒', Pharmacy: '💊', Electronics: '📱', Food: '🍕', Hardware: '🔧', Clothing: '👕'
};

export default function ShopDetail() {
  const { selectedShop, setCurrentScreen, favorites, toggleFavorite, incrementShopViews } = useApp();
  const [fullImagePopup, setFullImagePopup] = useState(null);

  useEffect(() => {
    if (selectedShop?.id) {
      incrementShopViews(selectedShop.id);
    }
  }, [selectedShop?.id]);

  if (!selectedShop) return null;
  const shop = selectedShop;
  const isFav = favorites.includes(shop.id);

  // Group products by category
  const grouped = shop.products.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  return (
    <div className="cf-screen">
      <div className="cf-top">
        <div className="cf-top-inner">
          <div className="cf-row" style={{ justifyContent: 'space-between' }}>
            <button className="cf-btn cf-btn-ghost" onClick={() => setCurrentScreen('customerHome')} style={{ padding: '10px 12px' }}>
              ← Back
            </button>
            <button
              className="cf-btn cf-btn-ghost"
              onClick={() => toggleFavorite(shop.id)}
              style={{ padding: '10px 12px' }}
              aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFav ? '❤️' : '🤍'}
            </button>
          </div>

          <div style={{ height: 10 }} />

          <div className="cf-card cf-card-pad">
            <div className="cf-row" style={{ alignItems: 'flex-start' }}>
              <div style={{
                width: 52, height: 52,
                borderRadius: 18,
                background: 'var(--cf-surface-2)',
                border: '1px solid var(--cf-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26,
                flexShrink: 0
              }}>
                {CATEGORY_ICONS[shop.category] || '🏪'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 950, fontSize: 16, letterSpacing: '-0.01em' }}>{shop.name}</div>
                <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="cf-chip" data-active="true">{shop.category}</span>
                  <span className="cf-chip">📍 {shop.distance}</span>
                </div>
              </div>
            </div>

            <div style={{ height: 12 }} />

            <div className="cf-row" style={{ gap: 10 }}>
              <a className="cf-btn cf-btn-primary" href={`tel:${shop.phone}`} style={{ flex: 1, textAlign: 'center', padding: '12px 12px', textDecoration: 'none' }}>
                Call
              </a>
              <a
                className="cf-btn cf-btn-ghost"
                href={`https://maps.google.com/?q=${encodeURIComponent(shop.address)}`}
                target="_blank"
                rel="noreferrer"
                style={{ flex: 1, textAlign: 'center', padding: '12px 12px', textDecoration: 'none' }}
              >
                Directions
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="cf-safe" style={{ paddingTop: 10 }}>

        {/* Info Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { icon: '⭐', label: 'Rating', value: `${shop.rating} (${shop.reviews})` },
            { icon: '🕐', label: 'Hours', value: shop.hours },
            { icon: '📍', label: 'Address', value: shop.address },
            { icon: '📞', label: 'Phone', value: shop.phone },
          ].map(item => (
            <div key={item.label} style={{
              background: 'var(--surface2)',
              borderRadius: 16,
              padding: '14px',
            }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <p style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginTop: 4 }}>{item.label.toUpperCase()}</p>
              <p style={{ fontSize: 12, fontWeight: 600, marginTop: 2, color: 'var(--text)' }}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* (Action buttons moved to top card) */}

        {/* Products */}
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>
          Products & Services ({shop.products?.length || 0})
        </h3>

        {Object.keys(grouped).length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
            No products listed yet
          </div>
        ) : (
          Object.entries(grouped).map(([category, products]) => (
            <div key={category} style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)', marginBottom: 10, letterSpacing: '0.5px' }}>
                {category.toUpperCase()}
              </h4>
              {products.map(product => (
                <div key={product.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: 'white',
                  borderRadius: 14,
                  marginBottom: 8,
                  border: '1px solid var(--border)',
                  gap: 12
                }}>
                    {product.imageUrl ? (
                      <img 
                        onClick={() => setFullImagePopup(product.imageUrl)}
                        src={product.imageUrl} 
                        style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', flexShrink: 0, border: '1px solid #efefef', cursor: 'pointer' }}
                        alt={product.name} 
                      />
                    ) : (
                    <div style={{ width: 80, height: 80, borderRadius: 12, flexShrink: 0, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                      🏷️
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{product.name}</p>
                    <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 15, marginTop: 2 }}>₹{product.price}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <span style={{
                      background: product.available ? '#E8F5E9' : '#FEE2E2',
                      color: product.available ? '#2e7d32' : '#c62828',
                      fontSize: 11, fontWeight: 600,
                      padding: '4px 10px', borderRadius: 20,
                    }}>
                      {product.available ? 'In Stock' : 'Out of Stock'}
                    </span>
                    {product.available && (
                      <a 
                        href={`tel:${shop.phone}`}
                        style={{ background: 'var(--primary-light)', color: 'var(--primary)', textDecoration: 'none', padding: '6px 14px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}
                      >
                        Call to Buy
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {fullImagePopup && (
        <div 
          onClick={() => setFullImagePopup(null)}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.85)', zIndex: 9999,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <button style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'white', fontSize: 30 }}>✕</button>
          <img 
            src={fullImagePopup} 
            alt="Full size" 
            style={{ maxWidth: '90%', maxHeight: '80%', borderRadius: 16, objectFit: 'contain', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} 
          />
        </div>
      )}
    </div>
  );
}
