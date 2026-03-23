import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const CATEGORIES = [
  'Grocery', 'Pharmacy', 'Electronics', 'Food', 'Hardware', 'Clothing', 
  'Service/Repair', 'Healthcare/Hospital', 'Job Listing', 'Real Estate/PG', 'Local Event', 'Buy & Sell/Marketplace', 'Other'
];

export default function OwnerDashboard() {
  const { currentUser, getOwnerShop, addShop, addProduct, deleteProduct, logout } = useApp();
  const [tab, setTab] = useState('dashboard');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [shopForm, setShopForm] = useState({
    name: '', category: 'Grocery', address: '', phone: '', hours: ''
  });
  const [productForm, setProductForm] = useState({
    name: '', price: '', category: 'General', available: true
  });
  const [saved, setSaved] = useState(false);

  const shop = getOwnerShop();

  const handleRegisterShop = () => {
    if (!shopForm.name || !shopForm.address || !shopForm.phone) return;
    addShop(shopForm);
    setSaved(true);
    setTimeout(() => { setSaved(false); setTab('products'); }, 1500);
  };

  const handleAddProduct = () => {
    if (!productForm.name || !productForm.price) return;
    addProduct(shop.id, { ...productForm, price: parseFloat(productForm.price) });
    setProductForm({ name: '', price: '', category: 'General', available: true });
    setShowAddProduct(false);
  };

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1A1A2E, #2d2d4e)',
          padding: '52px 24px 28px',
          borderRadius: '0 0 32px 32px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Business Owner</p>
              <h2 style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: 22, fontWeight: 700, marginTop: 2 }}>
                {currentUser?.name}
              </h2>
            </div>
            <div style={{
              background: 'var(--primary)', color: 'white',
              width: 44, height: 44, borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>🏪</div>
          </div>

          {shop && (
            <div style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 16,
              padding: '14px 16px',
              marginTop: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <span style={{ fontSize: 22 }}>✅</span>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>YOUR SHOP</p>
                <p style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>{shop.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Dashboard Tab */}
        {tab === 'dashboard' && (
          <div style={{ padding: '20px 24px' }}>
            {!shop ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 70, marginBottom: 16 }}>🏪</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8 }}>Register Your Shop</h3>
                <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>
                  Add your business to CityFind and reach local customers
                </p>
                <button className="btn-primary" onClick={() => setTab('register')}>
                  + Register My Shop
                </button>
              </div>
            ) : (
              <>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                  {[
                    { icon: '📦', label: 'Products', value: shop.products.length, color: '#E3F2FD' },
                    { icon: '👁️', label: 'Total Views', value: '247', color: '#FFF3E0' },
                    { icon: '❤️', label: 'Favourites', value: '18', color: '#FCE4EC' },
                    { icon: '⭐', label: 'Rating', value: shop.rating || 'New', color: '#F3E5F5' },
                  ].map(stat => (
                    <div key={stat.label} style={{
                      background: stat.color,
                      borderRadius: 18,
                      padding: '18px 16px',
                    }}>
                      <div style={{ fontSize: 26 }}>{stat.icon}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, marginTop: 8 }}>
                        {stat.value}
                      </div>
                      <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Shop Info */}
                <div style={{
                  background: 'var(--surface2)',
                  borderRadius: 18,
                  padding: '16px',
                  marginBottom: 16,
                }}>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 12 }}>Shop Details</h4>
                  {[
                    { label: 'Category', value: shop.category },
                    { label: 'Address', value: shop.address },
                    { label: 'Phone', value: shop.phone },
                    { label: 'Hours', value: shop.hours },
                  ].map(item => (
                    <div key={item.label} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px solid var(--border)',
                      fontSize: 13,
                    }}>
                      <span style={{ color: 'var(--text3)' }}>{item.label}</span>
                      <span style={{ fontWeight: 500, maxWidth: '60%', textAlign: 'right' }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                <button
                  className="btn-primary"
                  onClick={() => setTab('products')}
                >
                  Manage Products →
                </button>
              </>
            )}
          </div>
        )}

        {/* Register Shop Tab */}
        {tab === 'register' && (
          <div style={{ padding: '24px 24px' }}>
            <button onClick={() => setTab('dashboard')} style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 20 }}>
              ← Back
            </button>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
              Register Shop
            </h3>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>Fill in your business details</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
                  Shop Name *
                </label>
                <input className="input-field" placeholder="e.g. Patel General Store"
                  value={shopForm.name} onChange={e => setShopForm(p => ({ ...p, name: e.target.value }))} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
                  Category *
                </label>
                <select className="input-field"
                  value={shopForm.category} onChange={e => setShopForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
                  Address *
                </label>
                <input className="input-field" placeholder="Street, Area, Vadodara"
                  value={shopForm.address} onChange={e => setShopForm(p => ({ ...p, address: e.target.value }))} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
                  Phone Number *
                </label>
                <input className="input-field" placeholder="9876543210" type="tel"
                  value={shopForm.phone} onChange={e => setShopForm(p => ({ ...p, phone: e.target.value }))} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
                  Opening Hours
                </label>
                <input className="input-field" placeholder="e.g. 9:00 AM - 9:00 PM"
                  value={shopForm.hours} onChange={e => setShopForm(p => ({ ...p, hours: e.target.value }))} />
              </div>

              <button
                className="btn-primary"
                onClick={handleRegisterShop}
                style={{ marginTop: 8, background: saved ? '#2DD4BF' : undefined }}
              >
                {saved ? '✓ Shop Registered!' : 'Register Shop'}
              </button>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {tab === 'products' && shop && (
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>
                Products ({shop.products.length})
              </h3>
              <button
                onClick={() => setShowAddProduct(true)}
                style={{
                  background: 'var(--primary)', color: 'white',
                  borderRadius: 12, padding: '8px 16px', fontSize: 13, fontWeight: 600,
                }}
              >
                + Add
              </button>
            </div>

            {/* Add Product Form */}
            {showAddProduct && (
              <div style={{
                background: 'var(--primary-light)',
                borderRadius: 20,
                padding: 20,
                marginBottom: 20,
                border: '2px solid var(--primary)',
              }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 14 }}>New Product</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input className="input-field" placeholder="Product Name *"
                    value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} />
                  <input className="input-field" placeholder="Price (₹) *" type="number"
                    value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} />
                  <input className="input-field" placeholder="Category (e.g. Food, Medicine)"
                    value={productForm.category} onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'white', borderRadius: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>In Stock</span>
                    <button
                      onClick={() => setProductForm(p => ({ ...p, available: !p.available }))}
                      style={{
                        width: 48, height: 26,
                        borderRadius: 13,
                        background: productForm.available ? 'var(--primary)' : 'var(--border)',
                        position: 'relative', transition: 'all 0.2s',
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: 3,
                        left: productForm.available ? 24 : 3,
                        width: 20, height: 20, borderRadius: '50%',
                        background: 'white', transition: 'all 0.2s',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                      }} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn-primary" onClick={handleAddProduct} style={{ flex: 1 }}>
                      Add Product
                    </button>
                    <button className="btn-outline" onClick={() => setShowAddProduct(false)} style={{ flex: 1 }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Product List */}
            {shop.products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 50, marginBottom: 12 }}>📦</div>
                <p>No products yet. Add your first product!</p>
              </div>
            ) : (
              shop.products.map(product => (
                <div key={product.id} style={{
                  background: 'white',
                  borderRadius: 14,
                  padding: '14px 16px',
                  marginBottom: 10,
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{product.name}</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 14 }}>₹{product.price}</span>
                      <span style={{ color: 'var(--text3)', fontSize: 12 }}>• {product.category}</span>
                    </div>
                  </div>
                  <span style={{
                    background: product.available ? '#E8F5E9' : '#FEE2E2',
                    color: product.available ? '#2e7d32' : '#c62828',
                    fontSize: 10, fontWeight: 600,
                    padding: '3px 8px', borderRadius: 20,
                  }}>
                    {product.available ? 'In Stock' : 'Out'}
                  </span>
                  <button
                    onClick={() => deleteProduct(shop.id, product.id)}
                    style={{ color: '#e53e3e', fontSize: 18, padding: '0 4px' }}
                  >🗑️</button>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div style={{ padding: '20px 24px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 20 }}>Profile</h3>
            <div style={{
              background: 'var(--surface2)', borderRadius: 18, padding: 20, marginBottom: 20,
            }}>
              {[
                { label: 'Name', value: currentUser?.name },
                { label: 'Email', value: currentUser?.email },
                { label: 'Role', value: 'Business Owner' },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: '1px solid var(--border)',
                  fontSize: 14,
                }}>
                  <span style={{ color: 'var(--text3)' }}>{item.label}</span>
                  <span style={{ fontWeight: 500 }}>{item.value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={logout}
              style={{
                width: '100%', padding: '16px',
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
        zIndex: 100,
      }}>
        {[
          { id: 'dashboard', icon: '📊', label: 'Dashboard' },
          { id: shop ? 'products' : 'register', icon: '📦', label: 'Products' },
          { id: 'profile', icon: '👤', label: 'Profile' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            style={{
              flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '8px 0',
              color: tab === item.id ? 'var(--primary)' : 'var(--text3)',
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
