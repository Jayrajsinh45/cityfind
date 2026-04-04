import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const CATEGORIES = [
  'Grocery', 'Pharmacy', 'Electronics', 'Food', 'Hardware', 'Clothing', 
  'Service/Repair', 'Healthcare/Hospital', 'Job Listing', 'Real Estate/PG', 'Local Event', 'Buy & Sell/Marketplace', 'Other'
];

export default function OwnerDashboard() {
  const { currentUser, getOwnerShops, addShop, editShop, addProduct, editProduct, deleteProduct, addOffer, editOffer, deleteOffer, logout } = useApp();
  
  const ownerShops = getOwnerShops();
  const [activeShopId, setActiveShopId] = useState('');
  
  const shop = ownerShops.find(s => s.id === activeShopId);

  useEffect(() => {
    // Try to load last active shop from storage
    const lastId = localStorage.getItem('cf_active_shop');
    if (ownerShops.length > 0) {
      if (!activeShopId) {
        if (lastId && ownerShops.find(s => s.id === lastId)) {
          setActiveShopId(lastId);
        } else {
          setActiveShopId(ownerShops[0].id);
        }
      }
    }
  }, [ownerShops, activeShopId]);

  useEffect(() => {
    if (activeShopId) {
      localStorage.setItem('cf_active_shop', activeShopId);
    }
  }, [activeShopId]);

  useEffect(() => {
    if (shop) {
      console.log('[Dashboard] Active Shop State:', { id: shop.id, name: shop.name, logo: shop.logoUrl });
    }
  }, [shop]);

  const [tab, setTab] = useState('dashboard');
  const [fullImagePopup, setFullImagePopup] = useState(null);
  
  // Registration / Edit Shop State
  const [registrationStep, setRegistrationStep] = useState(1);
  const [shopForm, setShopForm] = useState({
    name: '', 
    businessType: 'General Trade',
    category: 'Grocery', 
    language: 'English',
    gpsLocationDetected: true,
    storeNo: '',
    building: '',
    landmark: '',
    address: '', // Original requirement
    phone: '', // Original requirement
    hours: '',
    paymentCash: true,
    paymentUPI: false,
    paymentCredit: false,
    offersDelivery: false
  });
  
  // Product state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '', price: '', category: 'General', available: true, imageUrl: ''
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [saved, setSaved] = useState(false);
  const [localLogoUrl, setLocalLogoUrl] = useState(null);

  // Offer state
  const emptyOffer = { title: '', type: 'percentage', value: '', minOrder: '', endDate: '', description: '' };
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerForm, setOfferForm] = useState(emptyOffer);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerError, setOfferError] = useState('');

  const fileInputRef = useRef(null);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!shop) {
      alert("Error: No active store found.");
      return;
    }
    console.log('[Logo] Starting upload for shop:', shop.id, 'file:', file.name);
    try {
      setIsUploading(true);
      setUploadPct(0);

      // Show a local preview immediately so the user sees something right away
      const localPreview = URL.createObjectURL(file);
      setLocalLogoUrl(localPreview);

      const fileRef = ref(storage, `shop_logos/${shop.id}_logo_${Date.now()}`);
      const uploadTask = uploadBytesResumable(fileRef, file, { contentType: file.type || 'image/jpeg' });
      
      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed', 
          (snap) => {
             const pct = snap.totalBytes ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100) : 0;
             console.log('[Logo] Upload progress:', pct + '%');
             setUploadPct(pct);
          },
          (err) => { console.error('[Logo] Upload error:', err); reject(err); },
          () => resolve()
        );
      });
      const url = await getDownloadURL(uploadTask.snapshot.ref);
      console.log('[Logo] Got download URL:', url);
      
      // Save to Firestore
      await editShop(shop.id, { logoUrl: url });
      console.log('[Logo] Firestore updated successfully');
      
      // Replace local preview with the real persistent URL
      setLocalLogoUrl(url);
      
      alert('✅ Logo saved! Your store logo has been updated.');
    } catch (err) {
      alert("Logo upload failed: " + err.message);
    } finally {
       setIsUploading(false);
       setUploadPct(0);
       if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // GPS Location State
  const [locationState, setLocationState] = useState({ loading: false, address: '', error: '' });

  const detectLocation = () => {
    setLocationState({ loading: true, address: '', error: '' });
    if (!navigator.geolocation) {
      setLocationState({ loading: false, address: '', error: 'Geolocation not supported by browser' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          if (data && data.display_name) {
            setLocationState({ loading: false, address: data.display_name, error: '' });
            setShopForm(p => ({ ...p, address: data.display_name }));
          } else {
            const fallback = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
            setLocationState({ loading: false, address: fallback, error: '' });
            setShopForm(p => ({ ...p, address: fallback }));
          }
        } catch (err) {
          const fallback = `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`;
          setLocationState({ loading: false, address: fallback, error: 'Failed to fetch street name' });
          setShopForm(p => ({ ...p, address: fallback }));
        }
      },
      (err) => {
        setLocationState({ loading: false, address: '', error: 'Location blocked or unavailable' });
      },
      { timeout: 10000 }
    );
  };

  useEffect(() => {
    if (tab === 'register' && registrationStep === 2 && !locationState.address && !locationState.loading && !locationState.error) {
      detectLocation();
    }
  }, [tab, registrationStep]);

  // Inventory UI (Blinkit-ish: search + category chips + grid)
  const [inventoryQuery, setInventoryQuery] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState('All');
  const [inventoryView, setInventoryView] = useState('grid'); // grid | list

  const inventoryCategories = useMemo(() => {
    const set = new Set(['All']);
    (shop?.products || []).forEach(p => set.add(p.category || 'General'));
    return Array.from(set);
  }, [shop?.products]);

  const filteredProducts = useMemo(() => {
    const products = shop?.products || [];
    const q = inventoryQuery.trim().toLowerCase();
    return products.filter(p => {
      const inCat = inventoryCategory === 'All' ? true : (p.category || 'General') === inventoryCategory;
      const inQuery = !q
        ? true
        : `${p.name || ''} ${(p.category || '')}`.toLowerCase().includes(q);
      return inCat && inQuery;
    });
  }, [shop?.products, inventoryCategory, inventoryQuery]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      setUploadPct(0);
      const fileRef = ref(storage, `product_images/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`);
      const uploadTask = uploadBytesResumable(fileRef, file, { contentType: file.type || 'image/jpeg' });

      await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snap) => {
            const pct = snap.totalBytes ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100) : 0;
            setUploadPct(pct);
          },
          (err) => reject(err),
          () => resolve()
        );
      });

      const url = await getDownloadURL(uploadTask.snapshot.ref);
      setProductForm(p => ({ ...p, imageUrl: url }));
    } catch (err) {
      console.error('Upload failed:', err);
      const msg =
        err?.code === 'storage/unauthorized'
          ? 'Upload blocked by Firebase Storage rules. Please allow authenticated uploads in Firebase Storage rules.'
          : `Image upload failed: ${err?.message || 'Unknown error'}`;
      alert(msg);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadPct(0), 800);
    }
  };

  // If no shops exist, force registration tab on startup
  useEffect(() => {
    if (ownerShops.length === 0 && tab !== 'register') {
      setTab('dashboard'); // the UI handles the blank state there
    }
  }, [ownerShops.length, tab]);

  const handleSaveShop = async () => {
    if (!shopForm.name) {
       alert("Please complete Step 1 to provide a Store Name.");
       return;
    }
    setSaved(true);
    
    // Compile the final address from fragments, avoiding duplicates if already compiled.
    let finalAddress = shopForm.address || '';
    if (shopForm.storeNo || shopForm.building || shopForm.landmark) {
       finalAddress = [shopForm.storeNo, shopForm.building, shopForm.landmark, shopForm.address].filter(Boolean).join(", ");
    }
    
    // Make sure we carry forward any existing phone if editing, or generic if omitted in new UI
    const finalData = { 
      phone: currentUser?.phone || '', 
      ...shopForm,
      address: finalAddress 
    };

    if (tab === 'edit-shop' && shop) {
      await editShop(shop.id, finalData);
      setTimeout(() => { setSaved(false); setTab('dashboard'); setRegistrationStep(1); }, 1500);
    } else {
      await addShop(finalData);
      setTimeout(() => { setSaved(false); setTab('dashboard'); setRegistrationStep(1); }, 1500);
    }
  };

  const handleOpenEditShop = () => {
    if (!shop) return;
    setShopForm({
      ...shopForm,
      name: shop.name || '',
      category: shop.category || 'Grocery',
      address: shop.address || '',
      phone: shop.phone || '',
      hours: shop.hours || '',
    });
    setRegistrationStep(1);
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
    <div className="cf-screen">
      {/* Hidden File Input for Logo Upload - TOP LEVEL to ensure persistent ref */}
      <input 
        type="file" 
        ref={fileInputRef} 
        hidden 
        accept="image/*" 
        onChange={handleLogoUpload} 
        onClick={(e) => { e.target.value = null }} // Clear so same file can trigger re-upload
      />
      
      <div className="cf-top" style={tab === 'dashboard' && shop ? { background: 'var(--cf-brand)', color: '#fff', borderBottom: 'none', paddingBottom: 10 } : {}}>
        <div className="cf-top-inner">
          {tab === 'dashboard' && shop ? (
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
                <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>CityFind</div>
                <div style={{ display: 'flex', gap: 20, fontSize: 18 }}>
                   <span style={{ cursor: 'pointer' }}>🔔</span>
                   <span style={{ cursor: 'pointer' }} onClick={() => setTab('profile')}>👤</span>
                </div>
             </div>
          ) : (
             <>
               <div className="cf-row" style={{ justifyContent: 'space-between' }}>
                 <div>
                   <div className="cf-title">Business</div>
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
                   🏪
                 </div>
               </div>

               {ownerShops.length > 0 && tab !== 'register' && (
                 <div style={{ marginTop: 12 }}>
                   <div style={{ color: 'var(--cf-text-3)', fontSize: 11, fontWeight: 900, marginBottom: 6 }}>ACTIVE SHOP</div>
                   <select
                     value={activeShopId}
                     onChange={e => setActiveShopId(e.target.value)}
                     className="cf-input"
                     style={{ fontWeight: 900 }}
                   >
                     {ownerShops.map(s => (
                       <option key={s.id} value={s.id}>
                         {s.name} ({s.category})
                       </option>
                     ))}
                   </select>
                 </div>
               )}
             </>
          )}
        </div>
      </div>

      <div className="cf-safe" style={{ paddingTop: 10 }}>

        {/* Dashboard Tab */}
        {tab === 'dashboard' && (
          <div style={{ background: '#F8FAF9', minHeight: '100vh', paddingBottom: 100 }}>
            {!shop ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 70, marginBottom: 16 }}>🏪</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8 }}>Register Your Business</h3>
                <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>
                  Add your business to CityFind and reach local customers
                </p>
                <button className="btn-primary" onClick={() => {
                  setShopForm({ name: '', category: 'Grocery', address: '', phone: '', hours: '' });
                  setTab('register');
                }}>
                  + Register New Business
                </button>
              </div>
            ) : (() => {
              let stepsDone = 0;
              const effectiveLogoUrl = localLogoUrl || shop.logoUrl;
              if (effectiveLogoUrl) stepsDone += 1;
              if (shop.products && shop.products.length > 0) stepsDone += 1;

              return (
              <>
                 <div style={{ padding: '0 16px', marginTop: 12 }}>
                   {/* Store Identity Card */}
                   <div style={{ background: '#FFFDF9', borderRadius: 16, padding: '16px', border: '1px solid #FFE4B5', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                      <div style={{ width: 44, height: 44, background: '#F26101', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, overflow: 'hidden', color: '#fff' }}>
                         {(localLogoUrl || shop.logoUrl) ? (
                           <img 
                             key={localLogoUrl || shop.logoUrl}
                             src={localLogoUrl || shop.logoUrl} 
                             style={{width:'100%', height:'100%', objectFit:'cover'}} 
                             alt="Logo" 
                             onError={(e) => { 
                               console.log('[Logo] Image failed to load:', e.target.src);
                               if (localLogoUrl) setLocalLogoUrl(null); 
                             }} 
                           />
                         ) : '🏪'}
                      </div>
                      <div style={{ flex: 1 }}>
                         <h2 style={{ fontSize: 16, fontWeight: 900, color: '#2B1E16', margin: 0 }}>{shop.name}</h2>
                         <div style={{ fontSize: 10, color: '#D95C00', fontWeight: 800, textTransform: 'uppercase', marginTop: 2, letterSpacing: '0.04em' }}>🛍️ Active • {shop.category}</div>
                      </div>
                      <button onClick={handleOpenEditShop} style={{ background: '#FDF1E3', border: 'none', color: '#D95C00', fontWeight: 800, fontSize: 12, padding: '5px 12px', borderRadius: 8 }}>Edit</button>
                   </div>

                   {/* Store Setup — only show when incomplete */}
                   {stepsDone < 2 && (
                   <div style={{ background: '#fff', borderRadius: 18, padding: '16px', border: '1px solid #FFE4B5', borderLeft: '5px solid #F26101', position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
                      {isUploading && uploadPct > 0 && (
                         <div style={{ position: 'absolute', top: 0, left: 0, height: 3, background: '#F26101', width: `${uploadPct}%`, transition: 'width 0.2s' }} />
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                         <div style={{ fontWeight: 900, color: '#D25801', fontSize: 14 }}>⚙️ Complete Your Store</div>
                         <div style={{ fontSize: 11, color: '#8A7561', fontWeight: 700, background: '#FDF1E3', padding: '2px 8px', borderRadius: 99 }}>{stepsDone}/2</div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                         {[1,2].map(s => <div key={s} style={{ height: 3, flex: 1, background: stepsDone >= s ? '#F26101' : '#FCE6CD', borderRadius: 3 }} />)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                         {[
                            { icon: '📸', done: !!effectiveLogoUrl, title: 'Add Store Logo', desc: 'Tap to upload', action: () => fileInputRef.current?.click() },
                            { icon: '📦', done: !!(shop.products && shop.products.length > 0), title: 'Add Products', desc: 'Min 3 recommended', action: () => setTab('products') },
                         ].map((item, idx) => (
                            <div key={idx} onClick={item.action} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: item.done ? '#F0FDF4' : '#FFF8F0', borderRadius: 12, cursor: 'pointer', border: `1px solid ${item.done ? '#BBF7D0' : '#FFE4B5'}` }}>
                               <div style={{ width: 34, height: 34, background: item.done ? '#16A34A' : '#F26101', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#fff', flexShrink: 0 }}>
                                  {item.done ? '✓' : item.icon}
                               </div>
                               <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 800, fontSize: 13, color: '#2B1E16' }}>{item.title}</div>
                                  <div style={{ fontSize: 11, color: '#8A7561' }}>{item.desc}</div>
                               </div>
                               {!item.done && <span style={{ color: '#F26101', fontSize: 18 }}>›</span>}
                            </div>
                         ))}
                      </div>
                   </div>
                   )}

                   <div style={{ marginBottom: 20 }}>
                      <div style={{ fontWeight: 900, fontSize: 14, color: '#09152B', marginBottom: 10 }}>Quick Actions</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                         {[
                            { icon: '➕', label: 'Add Product', action: () => setTab('products') },
                            { icon: '🏷️', label: 'Add Offer', action: () => { setTab('offers'); setOfferForm(emptyOffer); setEditingOfferId(null); setShowOfferForm(true); }},
                            { icon: '📸', label: 'Update Logo', action: () => fileInputRef.current?.click() },
                            { icon: '✏️', label: 'Edit Store', action: handleOpenEditShop },
                         ].map(a => (
                            <button key={a.label} onClick={a.action} style={{ padding: '12px 4px', borderRadius: 12, border: '1px solid #F1E5D5', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                               <span style={{ fontSize: 18 }}>{a.icon}</span>
                               <span style={{ fontSize: 9, fontWeight: 800, color: '#5A4033', textAlign: 'center', lineHeight: 1.2 }}>{a.label}</span>
                            </button>
                         ))}
                      </div>
                   </div>

                   <div style={{ marginBottom: 20 }}>
                      <div style={{ fontWeight: 900, fontSize: 14, color: '#09152B', marginBottom: 10 }}>Overview</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                         {[
                            { icon: '👁️', label: 'Store Views', value: shop.views || 0, bg: '#F0F9FF' },
                            { icon: '📦', label: 'Products', value: shop.products?.length || 0, bg: '#FFF3E0' },
                            { icon: '🏷️', label: 'Active Offers', value: (shop.offers || []).filter(o => !o.endDate || new Date(o.endDate) >= new Date()).length, bg: '#FFF5EF' },
                            { icon: '📍', label: 'Location', value: shop.address ? 'Set ✓' : 'Not set', bg: '#F0FDF4' },
                         ].map(stat => (
                            <div key={stat.label} style={{ background: '#fff', border: '1px solid #F1E5D5', borderRadius: 14, padding: '14px 12px' }}>
                               <div style={{ width: 30, height: 30, background: stat.bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, marginBottom: 8 }}>{stat.icon}</div>
                               <div style={{ fontWeight: 900, fontSize: 20, color: '#09152B' }}>{stat.value}</div>
                               <div style={{ color: '#8A7561', fontSize: 11, fontWeight: 700, marginTop: 2 }}>{stat.label}</div>
                            </div>
                         ))}
                      </div>
                   </div>

                   {/* Recent Products */}
                   {shop.products && shop.products.length > 0 && (
                   <div style={{ marginBottom: 100 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                         <div style={{ fontWeight: 900, fontSize: 14, color: '#09152B' }}>Your Products</div>
                         <button onClick={() => setTab('products')} style={{ background: 'none', border: 'none', color: 'var(--cf-brand)', fontWeight: 800, fontSize: 13 }}>See All →</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                         {shop.products.slice(0, 3).map(p => (
                            <div key={p.id} style={{ background: '#fff', borderRadius: 12, padding: '10px 12px', border: '1px solid #F1E5D5', display: 'flex', alignItems: 'center', gap: 12 }}>
                               <div style={{ width: 40, height: 40, background: '#FDF1E3', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                  {p.imageUrl ? <img src={p.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={p.name} /> : '📦'}
                               </div>
                               <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 800, fontSize: 13, color: '#2B1E16' }}>{p.name}</div>
                                  <div style={{ fontSize: 12, color: '#8A7561' }}>₹{p.price}</div>
                               </div>
                               <div style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 99, background: p.available ? '#F0FDF4' : '#FEF2F2', color: p.available ? '#16A34A' : '#DC2626' }}>
                                  {p.available ? 'In Stock' : 'Out'}
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                   )}
                 </div>
              </>
              );
            })()}
          </div>
        )}

        {/* Register/Edit Shop Tab */}
        {(tab === 'register' || tab === 'edit-shop') && (
          <div style={{ padding: '24px 24px', background: '#F8FAF9', minHeight: '100vh', marginTop: -10 }}>
            {/* Top Bar for Registration */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
               <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--cf-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginRight: 16 }}>
                 🏪
               </div>
               <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: '#111827' }}>
                    {tab === 'edit-shop' ? 'Edit Business' : 'Store Registration'}
                  </h3>
                  <div style={{ color: 'var(--cf-text-3)', fontSize: 13, fontWeight: 600 }}>Step {registrationStep} of 5</div>
               </div>
            </div>

            {/* Progress Bar */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 30 }}>
               {[1, 2, 3, 4, 5].map(s => (
                  <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: registrationStep >= s ? 'var(--cf-brand)' : '#E5E7EB' }} />
               ))}
            </div>

            <div style={{ padding: '20px', background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              
              {/* STEP 1: Basic Information */}
              {registrationStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <h4 style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>Basic Information</h4>
                    <p style={{ fontSize: 13, color: 'var(--cf-text-3)', marginBottom: 20 }}>Tell us about your store</p>
                  </div>
                  
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 800, color: '#111827', display: 'block', marginBottom: 8 }}>Store Name</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: 14, fontSize: 16, color: 'var(--cf-brand)' }}>🏪</span>
                      <input className="cf-input" placeholder="e.g. Ram Kirana Store" style={{ paddingLeft: 42, height: 50, background: '#fff' }}
                        value={shopForm.name} onChange={e => setShopForm(p => ({ ...p, name: e.target.value }))} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 800, color: '#111827', display: 'block', marginBottom: 8 }}>Business Type</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {['General Trade', 'Modern Trade', 'Home Business', 'D2C Brand', 'Cottage Industry'].map(type => (
                         <button key={type} onClick={() => setShopForm(p => ({ ...p, businessType: type }))} style={{ 
                            padding: '8px 14px', borderRadius: 99, fontSize: 13, fontWeight: 700,
                            border: `1px solid ${shopForm.businessType === type ? 'var(--cf-brand)' : 'var(--cf-border)'}`,
                            background: shopForm.businessType === type ? 'var(--cf-brand-soft)' : '#fff',
                            color: shopForm.businessType === type ? 'var(--cf-brand)' : 'var(--cf-text-2)'
                         }}>
                            {type}
                         </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 800, color: '#111827', display: 'block', marginBottom: 8 }}>Store Category</label>
                    <select className="cf-input" style={{ height: 50, background: '#fff' }}
                      value={shopForm.category} onChange={e => setShopForm(p => ({ ...p, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c} value={c}>🏪 {c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 800, color: '#111827', display: 'block', marginBottom: 8 }}>Store Language</label>
                    <select className="cf-input" style={{ height: 50, background: '#fff' }}
                      value={shopForm.language} onChange={e => setShopForm(p => ({ ...p, language: e.target.value }))}>
                      <option value="English">English</option>
                      <option value="Hindi">हिंदी (Hindi)</option>
                      <option value="Gujarati">ગુજરાતી (Gujarati)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                     <button className="cf-btn cf-btn-ghost" onClick={() => setTab('dashboard')} style={{ flex: 1, padding: '16px', borderRadius: 12 }}>Cancel</button>
                     <button className="cf-btn cf-btn-primary" onClick={() => setRegistrationStep(2)} style={{ flex: 1, padding: '16px', borderRadius: 12 }}>Next</button>
                  </div>
                </div>
              )}

              {/* STEP 2: Location */}
              {registrationStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <h4 style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>Location</h4>
                    <p style={{ fontSize: 13, color: 'var(--cf-text-3)', marginBottom: 20 }}>Where is your store located?</p>
                  </div>

                  <div style={{ background: 'var(--cf-brand-soft)', border: '1px solid rgba(255,107,0,0.2)', padding: 16, borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                       <div style={{ fontWeight: 800, color: 'var(--cf-brand)', display: 'flex', alignItems: 'center', gap: 6 }}>
                         <span>📍</span> GPS Location
                       </div>
                       {locationState.loading ? (
                         <span style={{ fontSize: 10, background: 'rgba(255,107,0,0.15)', color: 'var(--cf-brand)', padding: '4px 8px', borderRadius: 99, fontWeight: 800 }}>Detecting...</span>
                       ) : locationState.error ? (
                         <span style={{ fontSize: 10, background: '#FEE2E2', color: '#DC2626', padding: '4px 8px', borderRadius: 99, fontWeight: 800 }}>Failed</span>
                       ) : locationState.address ? (
                         <span style={{ fontSize: 10, background: 'rgba(255,107,0,0.15)', color: 'var(--cf-brand)', padding: '4px 8px', borderRadius: 99, fontWeight: 800 }}>Auto-Detected</span>
                       ) : null}
                    </div>
                    
                    <div style={{ fontSize: 13, color: 'var(--cf-text-2)', lineHeight: 1.5, marginBottom: 16 }}>
                       {locationState.loading ? 'Finding your exact location...' : 
                        locationState.error ? locationState.error : 
                        locationState.address ? locationState.address : 'Waiting for GPS...'}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button onClick={detectLocation} style={{ color: 'var(--cf-brand)', background: 'none', border: 'none', fontWeight: 800, fontSize: 13, padding: 0 }}>
                         ⟲ Retake Location
                      </button>
                      
                      {locationState.address && (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationState.address)}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={{ color: 'var(--cf-text-3)', fontSize: 12, fontWeight: 700, textDecoration: 'underline' }}
                        >
                          View Map
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                     <h5 style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>Additional Details (Optional)</h5>
                     <p style={{ fontSize: 12, color: 'var(--cf-text-3)', marginBottom: 16 }}>Help customers find your exact location</p>
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 800, color: '#111827', display: 'block', marginBottom: 8 }}>Store No / Floor</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: 14, fontSize: 16, color: 'var(--cf-brand)' }}>🚪</span>
                      <input className="cf-input" placeholder="e.g., Store 12, 2nd Floor" style={{ paddingLeft: 42, height: 50, background: '#fff' }}
                        value={shopForm.storeNo} onChange={e => setShopForm(p => ({ ...p, storeNo: e.target.value }))} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 800, color: '#111827', display: 'block', marginBottom: 8 }}>Building / Shopping Complex</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: 14, fontSize: 16, color: 'var(--cf-brand)' }}>🏢</span>
                      <input className="cf-input" placeholder="e.g., City Mall, Sunrise Building" style={{ paddingLeft: 42, height: 50, background: '#fff' }}
                        value={shopForm.building} onChange={e => setShopForm(p => ({ ...p, building: e.target.value }))} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 800, color: '#111827', display: 'block', marginBottom: 8 }}>Landmark</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: 14, fontSize: 16, color: 'var(--cf-brand)' }}>📍</span>
                      <input className="cf-input" placeholder="e.g., Near Bus Stand, Opposite Bank" style={{ paddingLeft: 42, height: 50, background: '#fff' }}
                        value={shopForm.landmark} onChange={e => setShopForm(p => ({ ...p, landmark: e.target.value }))} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                     <button className="cf-btn cf-btn-ghost" onClick={() => setRegistrationStep(1)} style={{ flex: 1, padding: '16px', borderRadius: 12 }}>Back</button>
                     <button className="cf-btn cf-btn-primary" onClick={() => setRegistrationStep(3)} style={{ flex: 1, padding: '16px', borderRadius: 12 }}>Next</button>
                  </div>
                </div>
              )}

              {/* STEP 3: Payment Methods */}
              {registrationStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <h4 style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>Payment Methods</h4>
                    <p style={{ fontSize: 13, color: 'var(--cf-text-3)', marginBottom: 20 }}>How do you accept payments?</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Cash */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: '#F8FAF9', borderRadius: 12 }}>
                       <div>
                          <div style={{ fontWeight: 800, fontSize: 15 }}>Cash</div>
                          <div style={{ fontSize: 12, color: 'var(--cf-text-3)' }}>Accept cash payments</div>
                       </div>
                       <input type="checkbox" checked={shopForm.paymentCash} onChange={e => setShopForm(p => ({ ...p, paymentCash: e.target.checked }))} style={{ width: 20, height: 20, accentColor: 'var(--cf-brand)' }} />
                    </div>
                    {/* UPI */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: '#F8FAF9', borderRadius: 12 }}>
                       <div>
                          <div style={{ fontWeight: 800, fontSize: 15 }}>UPI</div>
                          <div style={{ fontSize: 12, color: 'var(--cf-text-3)' }}>PhonePe, Google Pay, Paytm</div>
                       </div>
                       <input type="checkbox" checked={shopForm.paymentUPI} onChange={e => setShopForm(p => ({ ...p, paymentUPI: e.target.checked }))} style={{ width: 20, height: 20, accentColor: 'var(--cf-brand)' }} />
                    </div>
                     {/* Credit */}
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: '#F8FAF9', borderRadius: 12 }}>
                       <div>
                          <div style={{ fontWeight: 800, fontSize: 15 }}>Credit / Udhar</div>
                          <div style={{ fontSize: 12, color: 'var(--cf-text-3)' }}>Allow orders on credit, settle later</div>
                       </div>
                       <input type="checkbox" checked={shopForm.paymentCredit} onChange={e => setShopForm(p => ({ ...p, paymentCredit: e.target.checked }))} style={{ width: 20, height: 20, accentColor: 'var(--cf-brand)' }} />
                    </div>
                  </div>

                  <div style={{ background: 'var(--cf-brand-soft)', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                     <span style={{ color: 'var(--cf-brand)' }}>ℹ️</span>
                     <span style={{ fontSize: 12, color: 'var(--cf-brand-2)' }}>You can change these settings anytime from your dashboard.</span>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                     <button className="cf-btn cf-btn-ghost" onClick={() => setRegistrationStep(2)} style={{ flex: 1, padding: '16px', borderRadius: 12 }}>Back</button>
                     <button className="cf-btn cf-btn-primary" onClick={() => setRegistrationStep(4)} style={{ flex: 1, padding: '16px', borderRadius: 12 }}>Next</button>
                  </div>
                </div>
              )}

              {/* STEP 4: Delivery Options */}
              {registrationStep === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <h4 style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>Delivery Options</h4>
                    <p style={{ fontSize: 13, color: 'var(--cf-text-3)', marginBottom: 20 }}>Configure Delivery Options</p>
                  </div>

                  <div style={{ background: '#F8FAF9', padding: 16, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                     <div>
                        <div style={{ fontWeight: 800, fontSize: 15 }}>Do you offer delivery?</div>
                        <div style={{ fontSize: 12, color: 'var(--cf-text-3)', maxWidth: 180, marginTop: 4 }}>
                           {shopForm.offersDelivery ? 'Yes, we will deliver to local customers' : 'No, customers will pick up from store'}
                        </div>
                     </div>
                     <button 
                        onClick={() => setShopForm(p => ({ ...p, offersDelivery: !p.offersDelivery }))}
                        style={{ width: 52, height: 28, borderRadius: 14, background: shopForm.offersDelivery ? 'var(--cf-brand)' : 'var(--cf-border)', position: 'relative', border: 'none', transition: 'all 0.2s' }}
                     >
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: shopForm.offersDelivery ? 26 : 4, transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                     </button>
                  </div>

                  <div style={{ background: 'var(--cf-brand-soft)', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                     <span style={{ color: 'var(--cf-brand)' }}>ℹ️</span>
                     <span style={{ fontSize: 12, color: 'var(--cf-brand-2)' }}>You can change these settings anytime from your dashboard.</span>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                     <button className="cf-btn cf-btn-ghost" onClick={() => setRegistrationStep(3)} style={{ flex: 1, padding: '16px', borderRadius: 12 }}>Back</button>
                     <button className="cf-btn cf-btn-primary" onClick={() => setRegistrationStep(5)} style={{ flex: 1, padding: '16px', borderRadius: 12 }}>
                        Review Details
                     </button>
                  </div>
                </div>
              )}

              {/* STEP 5: Review and Confirm */}
              {registrationStep === 5 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <h4 style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>Review & Confirm</h4>
                    <p style={{ fontSize: 13, color: 'var(--cf-text-3)', marginBottom: 20 }}>Please review your store details before submitting</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    {/* Basic Info Summary */}
                    <div style={{ background: '#F8FAF9', borderRadius: 12, padding: 16, border: '1px solid var(--cf-border)' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>📜 Basic Information</div>
                          <button onClick={() => setRegistrationStep(1)} style={{ background: 'none', border: 'none', color: 'var(--cf-brand)', fontWeight: 800, fontSize: 13, padding: 0 }}>Edit</button>
                       </div>
                       <div style={{ fontSize: 13, color: 'var(--cf-text-2)', lineHeight: 1.6 }}>
                          <div><strong>Store Name:</strong> {shopForm.name || 'Not provided'}</div>
                          <div><strong>Business Type:</strong> {shopForm.businessType}</div>
                          <div><strong>Category:</strong> {shopForm.category}</div>
                          <div><strong>Language:</strong> {shopForm.language}</div>
                       </div>
                    </div>

                    {/* Location Summary */}
                    <div style={{ background: '#F8FAF9', borderRadius: 12, padding: 16, border: '1px solid var(--cf-border)' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>📍 Location Details</div>
                          <button onClick={() => setRegistrationStep(2)} style={{ background: 'none', border: 'none', color: 'var(--cf-brand)', fontWeight: 800, fontSize: 13, padding: 0 }}>Edit</button>
                       </div>
                       <div style={{ fontSize: 13, color: 'var(--cf-text-2)', lineHeight: 1.6 }}>
                          <div><strong>Address:</strong> {shopForm.address || 'Waiting for GPS...'}</div>
                          {shopForm.storeNo && <div><strong>Store/Floor:</strong> {shopForm.storeNo}</div>}
                          {shopForm.building && <div><strong>Building:</strong> {shopForm.building}</div>}
                          {shopForm.landmark && <div><strong>Landmark:</strong> {shopForm.landmark}</div>}
                       </div>
                    </div>

                    {/* Payments & Delivery Summary */}
                    <div style={{ background: '#F8FAF9', borderRadius: 12, padding: 16, border: '1px solid var(--cf-border)' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>💳 Operations</div>
                          <button onClick={() => setRegistrationStep(3)} style={{ background: 'none', border: 'none', color: 'var(--cf-brand)', fontWeight: 800, fontSize: 13, padding: 0 }}>Edit</button>
                       </div>
                       <div style={{ fontSize: 13, color: 'var(--cf-text-2)', lineHeight: 1.6 }}>
                          <div><strong>Payment Methods:</strong> {[shopForm.paymentCash && 'Cash', shopForm.paymentUPI && 'UPI', shopForm.paymentCredit && 'Credit'].filter(Boolean).join(', ') || 'None'}</div>
                          <div style={{ marginTop: 4 }}><strong>Delivery Available:</strong> {shopForm.offersDelivery ? '✅ Yes' : '❌ Pick-up Only'}</div>
                       </div>
                    </div>

                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                     <button className="cf-btn cf-btn-ghost" onClick={() => setRegistrationStep(4)} style={{ flex: 1, padding: '16px', borderRadius: 12 }}>Back</button>
                     <button className="cf-btn cf-btn-primary" onClick={() => {
                        handleSaveShop();
                     }} style={{ flex: 1, padding: '16px', borderRadius: 12, background: saved ? '#2DD4BF' : undefined }}>
                        {saved ? '✓ Saved!' : (tab === 'edit-shop' ? 'Update Details' : 'Create Store')}
                     </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Products Tab */}
        {tab === 'products' && shop && (
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, lineHeight: 1.1 }}>
                  Inventory
                </h3>
                <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 4 }}>
                  {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''}{shop.products?.length ? ` • ${shop.products.length} total` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setInventoryView(v => (v === 'grid' ? 'list' : 'grid'))}
                  style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: '10px 12px',
                    fontSize: 13,
                    fontWeight: 800,
                    color: 'var(--text)',
                  }}
                  title="Toggle view"
                >
                  {inventoryView === 'grid' ? '☰' : '▦'}
                </button>
                <button
                  onClick={() => { resetProductForm(); setShowAddProduct(true); }}
                  style={{
                    background: 'var(--primary)', color: 'white',
                    borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 800, border: 'none'
                  }}
                >
                  + Add
                </button>
              </div>
            </div>

            <div style={{
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 12,
              boxShadow: '0 4px 18px rgba(0,0,0,0.05)'
            }}>
              <span style={{ fontSize: 18 }}>🔎</span>
              <input
                value={inventoryQuery}
                onChange={e => setInventoryQuery(e.target.value)}
                placeholder="Search items (e.g. milk, paracetamol, repair...)"
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, padding: 8 }}
              />
              {!!inventoryQuery && (
                <button onClick={() => setInventoryQuery('')} style={{ fontSize: 18, color: 'var(--text3)' }}>
                  ✕
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, marginBottom: 14, marginRight: -24, paddingRight: 24 }}>
              {inventoryCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setInventoryCategory(cat)}
                  style={{
                    flexShrink: 0,
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: `1px solid ${inventoryCategory === cat ? 'var(--primary)' : 'var(--border)'}`,
                    background: inventoryCategory === cat ? 'var(--primary-light)' : 'white',
                    color: inventoryCategory === cat ? 'var(--primary)' : 'var(--text2)',
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  {cat}
                </button>
              ))}
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: '#fff', padding: 12, borderRadius: 12, border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Product Photo (Optional)</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: 12 }} />
                    {isUploading && (
                      <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700 }}>
                        Uploading{uploadPct ? ` — ${uploadPct}%` : '...'}
                      </span>
                    )}
                    {productForm.imageUrl && <img src={productForm.imageUrl} alt="preview" style={{ height: 60, width: 60, borderRadius: 8, objectFit: 'cover', marginTop: 4 }} />}
                  </div>

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
              <>
                {filteredProducts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                    <div style={{ fontSize: 44, marginBottom: 10 }}>🔎</div>
                    <div style={{ fontWeight: 800, color: 'var(--text2)' }}>No matching items</div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>Try a different search or category.</div>
                  </div>
                ) : inventoryView === 'grid' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    {filteredProducts.map(product => (
                      <div key={product.id} style={{
                        background: 'white',
                        border: '1px solid var(--border)',
                        borderRadius: 16,
                        overflow: 'hidden',
                        boxShadow: '0 8px 22px rgba(0,0,0,0.06)',
                      }}>
                        <div
                          style={{
                            height: 110,
                            background: 'var(--surface2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                          }}
                        >
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              onClick={() => setFullImagePopup(product.imageUrl)}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                            />
                          ) : (
                            <div style={{ fontSize: 34 }}>🛍️</div>
                          )}
                          <div style={{
                            position: 'absolute',
                            top: 10,
                            left: 10,
                            background: product.available ? '#E8F5E9' : '#FEE2E2',
                            color: product.available ? '#2e7d32' : '#c62828',
                            fontSize: 10,
                            fontWeight: 900,
                            padding: '4px 8px',
                            borderRadius: 999,
                            border: '1px solid rgba(0,0,0,0.04)'
                          }}>
                            {product.available ? 'IN STOCK' : 'OUT'}
                          </div>
                        </div>

                        <div style={{ padding: 12 }}>
                          <div style={{ fontWeight: 900, fontSize: 13, lineHeight: 1.2, minHeight: 32 }}>
                            {product.name}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                            <div>
                              <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: 14 }}>₹{product.price}</div>
                              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{product.category || 'General'}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => openEditProduct(product)}
                                style={{ width: 34, height: 34, borderRadius: 12, background: '#FFF8E1', border: '1px solid #FDE68A', fontSize: 16 }}
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => deleteProduct(shop.id, product.id)}
                                style={{ width: 34, height: 34, borderRadius: 12, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 16 }}
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  filteredProducts.map(product => (
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
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          onClick={() => setFullImagePopup(product.imageUrl)}
                          style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', cursor: 'pointer', border: '1px solid #efefef' }} 
                        />
                      ) : (
                        <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                          🏷️
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 900, fontSize: 14, lineHeight: 1.2 }}>{product.name}</p>
                        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--primary)', fontWeight: 900, fontSize: 14 }}>₹{product.price}</span>
                          <span style={{ color: 'var(--text3)', fontSize: 12 }}>• {product.category || 'General'}</span>
                        </div>
                      </div>
                      <span style={{
                        background: product.available ? '#E8F5E9' : '#FEE2E2',
                        color: product.available ? '#2e7d32' : '#c62828',
                        fontSize: 10, fontWeight: 900,
                        padding: '4px 10px', borderRadius: 999,
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
              </>
            )}
          </div>
        )}

        {tab === 'offers' && shop && (
          <div style={{ padding: '16px', background: '#F8FAF9', minHeight: '100vh', paddingBottom: 100 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontWeight: 900, fontSize: 22, margin: 0 }}>🏷️ Offers</h2>
                <div style={{ fontSize: 12, color: '#8A7561', marginTop: 2 }}>Create deals to attract more customers</div>
              </div>
              <button onClick={() => { setOfferForm(emptyOffer); setEditingOfferId(null); setShowOfferForm(true); }} style={{ background: 'var(--cf-brand)', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 16px', fontWeight: 800, fontSize: 13 }}>+ New Offer</button>
            </div>

            {/* Create / Edit Form */}
            {showOfferForm && (
              <div style={{ background: '#fff', borderRadius: 20, padding: '20px', marginBottom: 20, border: '1px solid #FFE4B5', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
                <div style={{ fontWeight: 900, fontSize: 16, color: '#D25801', marginBottom: 16 }}>{editingOfferId ? 'Edit Offer' : 'Create New Offer'}</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {offerError && <div style={{ color: '#dc2626', background: '#fef2f2', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>{offerError}</div>}
                  
                  {/* Title */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: '#374151', display: 'block', marginBottom: 6 }}>Offer Title <span style={{ color: '#dc2626' }}>*</span></label>
                    <input className="cf-input" placeholder="e.g. Weekend Sale!" value={offerForm.title} onChange={e => { setOfferError(''); setOfferForm(p => ({...p, title: e.target.value})); }} style={{ height: 46 }} />
                  </div>

                  {/* Type */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: '#374151', display: 'block', marginBottom: 6 }}>Offer Type</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[{val:'percentage', label:'% Discount'}, {val:'flat', label:'Flat Off (₹)'}, {val:'flash', label:'⚡ Flash Sale'}].map(t => (
                        <button key={t.val} onClick={() => setOfferForm(p => ({...p, type: t.val}))} style={{ flex: 1, padding: '10px 4px', borderRadius: 10, border: `2px solid ${offerForm.type === t.val ? 'var(--cf-brand)' : '#E5E7EB'}`, background: offerForm.type === t.val ? '#FFF5EF' : '#fff', color: offerForm.type === t.val ? 'var(--cf-brand)' : '#666', fontWeight: 800, fontSize: 11 }}>{t.label}</button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 800, color: '#374151', display: 'block', marginBottom: 6 }}>
                        {offerForm.type === 'percentage' ? 'Discount %' : offerForm.type === 'flat' ? 'Flat Off ₹' : 'Sale Title'} <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input className="cf-input" type={offerForm.type === 'flash' ? 'text' : 'number'} placeholder={offerForm.type === 'percentage' ? 'e.g. 20' : offerForm.type === 'flat' ? 'e.g. 50' : 'e.g. Clearing Stock'} value={offerForm.value} onChange={e => { setOfferError(''); setOfferForm(p => ({...p, value: e.target.value})); }} style={{ height: 46 }} />
                    </div>
                    {offerForm.type !== 'flash' && (
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 800, color: '#374151', display: 'block', marginBottom: 6 }}>Min. Order ₹</label>
                      <input className="cf-input" type="number" placeholder="0 = any" value={offerForm.minOrder} onChange={e => setOfferForm(p => ({...p, minOrder: e.target.value}))} style={{ height: 46 }} />
                    </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: '#374151', display: 'block', marginBottom: 6 }}>Short Description (optional)</label>
                    <input className="cf-input" placeholder="e.g. Valid on all grocery items" value={offerForm.description} onChange={e => setOfferForm(p => ({...p, description: e.target.value}))} style={{ height: 46 }} />
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: '#374151', display: 'block', marginBottom: 6 }}>Valid Until <span style={{ color: '#dc2626' }}>*</span></label>
                    <input className="cf-input" type="date" value={offerForm.endDate} onChange={e => { setOfferError(''); setOfferForm(p => ({...p, endDate: e.target.value})); }} style={{ height: 46 }} min={new Date().toISOString().split('T')[0]} />
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                    <button onClick={() => { setShowOfferForm(false); setEditingOfferId(null); }} style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1px solid #E5E7EB', background: '#fff', fontWeight: 800, color: '#666' }}>Cancel</button>
                    <button
                      disabled={offerLoading}
                      onClick={async () => {
                        if (!offerForm.title || !offerForm.value || !offerForm.endDate) {
                          setOfferError('Please fill all required fields (*)');
                          return;
                        }
                        setOfferLoading(true);
                        try {
                          if (editingOfferId) {
                            await editOffer(shop.id, editingOfferId, offerForm);
                          } else {
                            await addOffer(shop.id, offerForm);
                          }
                          setShowOfferForm(false);
                          setEditingOfferId(null);
                          setOfferForm(emptyOffer);
                        } catch(e) { alert(e.message); }
                        setOfferLoading(false);
                      }}
                      style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', background: 'var(--cf-brand)', color: '#fff', fontWeight: 900, fontSize: 15 }}
                    >
                      {offerLoading ? 'Saving...' : editingOfferId ? 'Save Changes' : 'Create Offer'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Active Offers List */}
            {(!shop.offers || shop.offers.length === 0) && !showOfferForm ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8A7561' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏷️</div>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>No offers yet</div>
                <div style={{ fontSize: 13 }}>Tap "+ New Offer" to create your first deal</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(shop.offers || []).map(offer => {
                  const isExpired = offer.endDate && new Date(offer.endDate) < new Date();
                  return (
                    <div key={offer.id} style={{ background: '#fff', borderRadius: 16, padding: '16px', border: `1px solid ${isExpired ? '#FEE2E2' : '#FFE4B5'}`, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: isExpired ? '#EF4444' : offer.type === 'flash' ? '#8B5CF6' : 'var(--cf-brand)' }} />
                      <div style={{ paddingLeft: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: 13, fontWeight: 900, background: offer.type === 'flash' ? '#EDE9FE' : '#FFF5EF', color: offer.type === 'flash' ? '#7C3AED' : 'var(--cf-brand)', padding: '2px 8px', borderRadius: 99 }}>
                                {offer.type === 'percentage' ? `${offer.value}% OFF` : offer.type === 'flat' ? `₹${offer.value} OFF` : '⚡ Flash'}
                              </span>
                              {isExpired && <span style={{ fontSize: 11, fontWeight: 800, color: '#EF4444', background: '#FEE2E2', padding: '2px 8px', borderRadius: 99 }}>Expired</span>}
                            </div>
                            <div style={{ fontWeight: 900, fontSize: 15, color: '#2B1E16' }}>{offer.title}</div>
                            {offer.description && <div style={{ fontSize: 12, color: '#8A7561', marginTop: 2 }}>{offer.description}</div>}
                            <div style={{ fontSize: 11, color: '#8A7561', marginTop: 6, display: 'flex', gap: 12 }}>
                              {offer.minOrder > 0 && <span>Min. order ₹{offer.minOrder}</span>}
                              {offer.endDate && <span>Valid till {new Date(offer.endDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => { setOfferForm({title: offer.title, type: offer.type, value: offer.value, minOrder: offer.minOrder || '', endDate: offer.endDate || '', description: offer.description || ''}); setEditingOfferId(offer.id); setShowOfferForm(true); }} style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid #E5E7EB', background: '#fff', fontSize: 15 }}>✏️</button>
                            <button onClick={async () => { if(window.confirm('Delete this offer?')) await deleteOffer(shop.id, offer.id); }} style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid #FEE2E2', background: '#FEF2F2', fontSize: 15 }}>🗑️</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div style={{ padding: '0 24px 100px 24px', background: '#F8FAF9', minHeight: '100vh', width: '100%' }}>
            <div style={{ textAlign: 'center', paddingTop: 40, marginBottom: 32 }}>
               <div style={{ width: 100, height: 100, background: 'var(--cf-brand)', borderRadius: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', border: '4px solid #fff', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', fontSize: 44 }}>
                  👤
               </div>
               <h2 style={{ fontSize: 24, fontWeight: 900, fontFamily: 'var(--font-display)', marginBottom: 4 }}>{currentUser?.name || "Business Owner"}</h2>
               <div style={{ fontSize: 13, color: '#666', fontWeight: 600 }}>{currentUser?.email}</div>
               <div style={{ marginTop: 12, background: 'var(--cf-brand-soft)', display: 'inline-block', padding: '6px 16px', borderRadius: 99, color: 'var(--cf-brand)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>
                  Business Account
               </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 20, padding: '8px 0', border: '1px solid #eee', marginBottom: 24 }}>
               {[
                  { icon: '👤', label: 'Edit Personal Details', sub: 'Change name & info', action: () => alert('Edit Profile feature coming soon! You can currently update your store details in the Dashboard.') },
                  { icon: '🔒', label: 'Security', sub: 'Change Password', action: () => alert('A password reset link will be sent to your email.') },
                  { icon: '📝', label: 'Business Verification', sub: 'Verify your store status', action: null },
                  { icon: '💳', label: 'Subscription', sub: 'Free Plan', action: null },
               ].map((opt, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: i === 3 ? 'none' : '1px solid #f5f5f5', cursor: opt.action ? 'pointer' : 'default' }} onClick={opt.action}>
                     <div style={{ width: 40, height: 40, background: '#f8f8f8', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{opt.icon}</div>
                     <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 16 }}>{opt.label}</div>
                        <div style={{ fontSize: 12, color: '#999', fontWeight: 600 }}>{opt.sub}</div>
                     </div>
                     <div style={{ paddingLeft: 10, fontSize: 18, color: '#ddd' }}>›</div>
                  </div>
               ))}
            </div>

            <button
               onClick={() => {
                 setShopForm({ name: '', businessType: 'General Trade', category: 'Grocery', language: 'English', address: '', phone: '', hours: '', gpsLocationDetected: true });
                 setRegistrationStep(1);
                 setTab('register');
               }}
               style={{
                  width: '100%', padding: '18px', border: '1px solid var(--cf-brand)',
                  background: '#fff', color: 'var(--cf-brand)',
                  borderRadius: 18, fontWeight: 900, fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  marginBottom: 12
               }}
            >
               <span>🏪</span> Register New Business
            </button>

            <button
               onClick={logout}
               style={{
                  width: '100%', padding: '18px', border: 'none',
                  background: '#FEE2E2', color: '#c62828',
                  borderRadius: 18, fontWeight: 900, fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
               }}
            >
               <span>🚪</span> Logout Account
            </button>
            <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#bbb', fontWeight: 600 }}>CityFind Business App v2.1</div>
          </div>
        )}
      </div>

      {/* Fullscreen Image Overlay Popup */}
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

      {/* Improved Bottom Nav */}
      <div className="cf-bottom" style={{ background: '#fff', borderTop: '1px solid #F1E5D5', padding: '8px 4px 12px 4px', boxShadow: '0 -4px 16px rgba(0,0,0,0.04)' }}>
        <div className="cf-bottom-inner" style={{ maxWidth: 450, margin: '0 auto', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          {[
            { id: 'dashboard', icon: '⊞', label: 'Home' },
            { id: 'offers', icon: '🏷️', label: 'Offers' },
            { id: shop ? 'products' : 'register', icon: '📦', label: 'Catalog' },
            { id: 'profile', icon: '👤', label: 'Account' },
          ].map(item => {
            const isActive = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (!shop && item.id !== 'dashboard' && item.id !== 'register' && item.id !== 'profile') {
                    alert('Please register your business first');
                    return;
                  }
                  setTab(item.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 12px',
                  borderRadius: 16,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  minWidth: 70,
                  position: 'relative'
                }}
              >
                <span style={{ 
                  fontSize: 22, 
                  color: isActive ? 'var(--cf-brand)' : '#8A7561',
                  transform: isActive ? 'translateY(-2px)' : 'none',
                  transition: 'all 0.2s'
                }}>
                  {item.icon}
                </span>
                <span style={{ 
                  fontSize: 10, 
                  fontWeight: 900, 
                  color: isActive ? 'var(--cf-brand)' : '#8A7561',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  {item.label}
                </span>
                {isActive && (
                  <div style={{ 
                    position: 'absolute', 
                    bottom: -8, 
                    width: 4, 
                    height: 4, 
                    borderRadius: 2, 
                    background: 'var(--cf-brand)',
                    boxShadow: '0 0 8px var(--cf-brand)'
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
