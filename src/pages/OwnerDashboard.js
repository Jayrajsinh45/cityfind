import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const CATEGORIES = [
  'Grocery', 'Pharmacy', 'Electronics', 'Food', 'Hardware', 'Clothing', 
  'Service/Repair', 'Healthcare/Hospital', 'Job Listing', 'Real Estate/PG', 'Local Event', 'Buy & Sell/Marketplace', 'Other'
];

export default function OwnerDashboard() {
  const { currentUser, getOwnerShops, addShop, editShop, addProduct, editProduct, deleteProduct, logout } = useApp();
  
  const ownerShops = getOwnerShops();
  const [activeShopId, setActiveShopId] = useState('');
  
  useEffect(() => {
    if (ownerShops.length > 0 && !activeShopId) {
      setActiveShopId(ownerShops[0].id);
    }
  }, [ownerShops, activeShopId]);

  const shop = ownerShops.find(s => s.id === activeShopId);

  const [tab, setTab] = useState('dashboard');
  
  // Registration / Edit Shop State
  const [shopForm, setShopForm] = useState({
    name: '', category: 'Grocery', address: '', phone: '', hours: '', deliveryFee: 20
  });
  
  // Product state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '', price: '', category: 'General', available: true, imageUrl: ''
  });
  
  const [saved, setSaved] = useState(false);

  // If no shops exist, force registration tab on startup
  useEffect(() => {
    if (ownerShops.length === 0 && tab !== 'register') {
      setTab('dashboard'); // the UI handles the blank state there
    }
  }, [ownerShops.length, tab]);

  const handleSaveShop = async () => {
    if (!shopForm.name || !shopForm.address || !shopForm.phone) return;
    setSaved(true);
    
    if (tab === 'edit-shop' && shop) {
      await editShop(shop.id, { ...shopForm, deliveryFee: parseFloat(shopForm.deliveryFee) || 0 });
      setTimeout(() => { setSaved(false); setTab('dashboard'); }, 1500);
    } else {
      await addShop({ ...shopForm, deliveryFee: parseFloat(shopForm.deliveryFee) || 20 });
      setTimeout(() => { setSaved(false); setTab('products'); }, 1500);
    }
  };

  const handleOpenEditShop = () => {
    if (!shop) return;
    setShopForm({
      name: shop.name || '',
      category: shop.category || 'Grocery',
      address: shop.address || '',
      phone: shop.phone || '',
      hours: shop.hours || '',
      deliveryFee: shop.deliveryFee !== undefined ? shop.deliveryFee : 20
    });
    setTab('edit-shop');
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price) return;
    
    const formattedData = { 
      ...productForm, 
      price: parseFloat(productForm.price),
      imageUrl: productForm.imageUrl || '' 
    };

    if (editingProductId) {
      await editProduct(shop.id, editingProductId, formattedData);
    } else {
      await addProduct(shop.id, formattedData);
    }

    resetProductForm();
  };

  const resetProductForm = () => {
    setProductForm({ name: '', price: '', category: 'General', available: true, imageUrl: '' });
    setEditingProductId(null);
    setShowAddProduct(false);
  };

  const openEditProduct = (p) => {
    setProductForm({
      name: p.name,
      price: p.price,
      category: p.category || 'General',
      available: p.available ?? true,
      imageUrl: p.imageUrl || ''
    });
    setEditingProductId(p.id);
    setShowAddProduct(true);
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

          {ownerShops.length > 0 && tab !== 'register' && (
            <div style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 16,
              padding: '14px 16px',
              marginTop: 20,
            }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }}>ACTIVE BUSINESS</p>
              <select 
                value={activeShopId} 
                onChange={e => setActiveShopId(e.target.value)}
                style={{
                  background: 'transparent',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  padding: '8px',
                  width: '100%',
                  fontSize: 16,
                  fontWeight: 700,
                  outline: 'none',
                }}
              >
                {ownerShops.map(s => (
                  <option key={s.id} value={s.id} style={{ color: 'black' }}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Dashboard Tab */}
        {tab === 'dashboard' && (
          <div style={{ padding: '20px 24px' }}>
            {!shop ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 70, marginBottom: 16 }}>🏪</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8 }}>Register Your Business</h3>
                <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>
                  Add your business to CityFind and reach local customers
                </p>
                <button className="btn-primary" onClick={() => {
                  setShopForm({ name: '', category: 'Grocery', address: '', phone: '', hours: '', deliveryFee: 20 });
                  setTab('register');
                }}>
                  + Register New Business
                </button>
              </div>
            ) : (
              <>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                  {[
                    { icon: '📦', label: 'Items', value: shop.products?.length || 0, color: '#E3F2FD' },
                    { icon: '👁️', label: 'Total Views', value: '247', color: '#FFF3E0' },
                    { icon: '🛵', label: 'Delivery Fee', value: `₹${shop.deliveryFee || 20}`, color: '#E8F5E9' },
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Business Details</h4>
                    <button onClick={handleOpenEditShop} style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: 'none', border: 'none' }}>
                      Edit ✏️
                    </button>
                  </div>
                  {[
                    { label: 'Name', value: shop.name },
                    { label: 'Category', value: shop.category },
                    { label: 'Address', value: shop.address },
                    { label: 'Phone', value: shop.phone },
                    { label: 'Hours', value: shop.hours },
                    { label: 'Delivery Fee', value: shop.deliveryFee !== undefined ? `₹${shop.deliveryFee}` : 'Not Set' },
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

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    className="btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => setTab('products')}
                  >
                    Manage Items →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Register/Edit Shop Tab */}
        {(tab === 'register' || tab === 'edit-shop') && (
          <div style={{ padding: '24px 24px' }}>
            <button onClick={() => setTab('dashboard')} style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 20 }}>
              ← Cancel
            </button>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
              {tab === 'edit-shop' ? 'Edit Business Details' : 'Register New Business'}
            </h3>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>Update information visible to customers</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
                  Business Name *
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
                  Address / Operating Area *
                </label>
                <input className="input-field" placeholder="Street, Area, Vadodara"
                  value={shopForm.address} onChange={e => setShopForm(p => ({ ...p, address: e.target.value }))} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
                  Phone Number / Contact *
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

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
                  Set Rider Delivery Fee (₹)
                </label>
                <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>How much will you offer the rider to deliver orders (if applicable)?</p>
                <input className="input-field" placeholder="Default: ₹20" type="number"
                  value={shopForm.deliveryFee} onChange={e => setShopForm(p => ({ ...p, deliveryFee: e.target.value }))} />
              </div>

              <button
                className="btn-primary"
                onClick={handleSaveShop}
                style={{ marginTop: 8, background: saved ? '#2DD4BF' : undefined }}
              >
                {saved ? '✓ Saved!' : 'Save Business Details'}
              </button>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {tab === 'products' && shop && (
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>
                Inventory Items ({shop.products?.length || 0})
              </h3>
              <button
                onClick={() => { resetProductForm(); setShowAddProduct(true); }}
                style={{
                  background: 'var(--primary)', color: 'white',
                  borderRadius: 12, padding: '8px 16px', fontSize: 13, fontWeight: 600, border: 'none'
                }}
              >
                + Add Item
              </button>
            </div>

            {/* Add / Edit Product Form */}
            {showAddProduct && (
              <div style={{
                background: editingProductId ? '#FFF8E1' : 'var(--primary-light)',
                borderRadius: 20,
                padding: 20,
                marginBottom: 20,
                border: editingProductId ? '2px solid #F59E0B' : '2px solid var(--primary)',
              }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 14 }}>
                  {editingProductId ? 'Edit Item' : 'New Item'}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input className="input-field" placeholder="Item Name (e.g. Sofa, Bread, Plumbing Visit) *"
                    value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} />
                  <input className="input-field" placeholder="Price / Rate (₹) *" type="number"
                    value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} />
                  <input className="input-field" placeholder="Sub-category (e.g. Food, Service, Furniture)"
                    value={productForm.category} onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))} />
                  <input className="input-field" placeholder="Image URL (optional direct link to photo)"
                    value={productForm.imageUrl} onChange={e => setProductForm(p => ({ ...p, imageUrl: e.target.value }))} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'white', borderRadius: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>Available / In Stock</span>
                    <button
                      onClick={() => setProductForm(p => ({ ...p, available: !p.available }))}
                      style={{
                        width: 48, height: 26,
                        borderRadius: 13,
                        background: productForm.available ? 'var(--primary)' : 'var(--border)',
                        position: 'relative', transition: 'all 0.2s', border: 'none'
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
                    <button className="btn-primary" onClick={handleSaveProduct} style={{ flex: 1 }}>
                      {editingProductId ? 'Save Changes' : 'Add Item'}
                    </button>
                    <button className="btn-outline" onClick={resetProductForm} style={{ flex: 1 }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Product List */}
            {!shop.products || shop.products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 50, marginBottom: 12 }}>📦</div>
                <p>No items yet. Add your first inventory item or service rate!</p>
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
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      🏷️
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>{product.name}</p>
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
                  
                  <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 8, display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => openEditProduct(product)}
                      style={{ color: '#F59E0B', fontSize: 18, border: 'none', background: 'none' }}
                    >✏️</button>
                    <button
                      onClick={() => deleteProduct(shop.id, product.id)}
                      style={{ color: '#e53e3e', fontSize: 18, border: 'none', background: 'none' }}
                    >🗑️</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div style={{ padding: '20px 24px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 20 }}>Profile & Settings</h3>
            <div style={{
              background: 'var(--surface2)', borderRadius: 18, padding: 20, marginBottom: 20,
            }}>
              {[
                { label: 'Name', value: currentUser?.name },
                { label: 'Email', value: currentUser?.email },
                { label: 'Role', value: 'Business Owner' },
                { label: 'Total Businesses', value: ownerShops.length },
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
              onClick={() => {
                setShopForm({ name: '', category: 'Grocery', address: '', phone: '', hours: '', deliveryFee: 20 });
                setTab('register');
              }}
              style={{
                width: '100%', padding: '16px', marginBottom: 12,
                background: 'var(--primary)', color: 'white', border: 'none',
                borderRadius: 14, fontWeight: 700, fontSize: 15,
              }}
            >
              + Register Another Business
            </button>

            <button
              onClick={logout}
              style={{
                width: '100%', padding: '16px', border: 'none',
                background: '#FEE2E2', color: '#c62828',
                borderRadius: 14, fontWeight: 700, fontSize: 15,
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
          { id: shop ? 'products' : 'register', icon: '📦', label: 'Items' },
          { id: 'profile', icon: '👤', label: 'Profile' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            style={{
              flex: 1, border: 'none', background: 'none',
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
