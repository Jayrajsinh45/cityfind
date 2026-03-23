import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const CATEGORY_ICONS = {
  Grocery: '🛒', Pharmacy: '💊', Electronics: '📱', Food: '🍕', Hardware: '🔧', Clothing: '👕'
};

export default function ShopDetail() {
  const { selectedShop, setCurrentScreen, favorites, toggleFavorite, createOrder } = useApp();
  const [orderMessage, setOrderMessage] = useState('');

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
    <div className="screen screen-enter" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #FF6B2C, #E85A1B)',
        padding: '52px 24px 28px',
        borderRadius: '0 0 32px 32px',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button
            onClick={() => setCurrentScreen('customerHome')}
            style={{
              width: 38, height: 38,
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, color: 'white',
            }}
          >←</button>
          <button
            onClick={() => toggleFavorite(shop.id)}
            style={{
              width: 38, height: 38,
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}
          >
            {isFav ? '❤️' : '🤍'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{
            width: 70, height: 70,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 34,
          }}>
            {CATEGORY_ICONS[shop.category] || '🏪'}
          </div>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              color: 'white', fontSize: 22, fontWeight: 800,
            }}>{shop.name}</h2>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              <span style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white', fontSize: 11,
                padding: '3px 10px', borderRadius: 20,
              }}>{shop.category}</span>
              <span style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white', fontSize: 11,
                padding: '3px 10px', borderRadius: 20,
              }}>📍 {shop.distance}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', paddingBottom: 100 }}>

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

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
          <button
            onClick={() => alert(`Starting secure in-app chat with ${shop.name}...`)}
            style={{
              flex: 1,
              background: '#E8EAF6',
              color: '#3F51B5',
              border: 'none',
              borderRadius: 14,
              padding: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 4, fontWeight: 700, fontSize: 13, cursor: 'pointer'
            }}
          >
            💬 Chat
          </button>
          <a
            href={`tel:${shop.phone}`}
            style={{
              flex: 1,
              background: 'var(--primary)',
              color: 'white',
              borderRadius: 14,
              padding: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, fontWeight: 600, fontSize: 14,
            }}
          >
            📞 Call Shop
          </a>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(shop.address)}`}
            target="_blank"
            rel="noreferrer"
            style={{
              flex: 1,
              background: 'var(--surface2)',
              color: 'var(--text)',
              borderRadius: 14,
              padding: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, fontWeight: 600, fontSize: 14,
            }}
          >
            🗺️ Directions
          </a>
        </div>

        {orderMessage && (
          <div style={{ background: '#E8F5E9', color: '#2e7d32', padding: 12, borderRadius: 12, marginBottom: 20, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>
            {orderMessage}
          </div>
        )}

        {/* Products */}
        {shop.deliveryAvailable && shop.deliveryFee > 0 && (
          <div style={{ background: '#FFF8E1', color: '#F59E0B', padding: '12px 16px', borderRadius: 12, marginBottom: 24, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🛵</span> Rider Delivery available for ₹{shop.deliveryFee}
          </div>
        )}

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
                    <img src={product.imageUrl} alt={product.name} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
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
                    {product.available && shop.deliveryAvailable && (
                      <button 
                        onClick={async () => {
                          await createOrder(shop.id, [{ name: product.name, price: product.price, qty: 1 }], product.price, shop.deliveryFee);
                          setOrderMessage(`Ordered 1x ${product.name}! (Delivery: ₹${shop.deliveryFee || 20}) Waiting for rider.`);
                          setTimeout(() => setOrderMessage(''), 4000);
                        }}
                        style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Order
                      </button>
                    )}
                    {product.available && !shop.deliveryAvailable && (
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
    </div>
  );
}
