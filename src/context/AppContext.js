import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, onSnapshot, query, addDoc, updateDoc } from 'firebase/firestore';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [currentUser, setCurrentUser] = useState(null);
  const [shops, setShops] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Phase 5 State
  const [posts, setPosts] = useState([]);      // City Pulse
  const [transit, setTransit] = useState([]);  // Live Transit
  const [orders, setOrders] = useState([]);    // Rider Network

  // Civic Issues (User generated reports)
  const [civicIssues, setCivicIssues] = useState([
    { id: 'c1', title: 'Deep Pothole on MG Road', status: 'Reported', upvotes: 14 }
  ]);

  // Phase 2: Chat system (Mocked)
  const [chats, setChats] = useState([]);

  useEffect(() => {
    let unsub = () => {};
    try {
      unsub = onAuthStateChanged(auth, async (user) => {
        try {
          if (user) {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const userData = { id: user.uid, email: user.email, ...docSnap.data() };
              setCurrentUser(userData);
              if (userData.role === 'owner') setCurrentScreen('ownerDashboard');
              else if (userData.role === 'rider') setCurrentScreen('riderDashboard');
              else setCurrentScreen('customerHome');
            } else {
              const defaultUser = { id: user.uid, email: user.email, name: user.displayName, role: 'customer' };
              setCurrentUser(defaultUser);
              setCurrentScreen('customerHome');
            }
          } else {
            setCurrentUser(null);
          }
        } catch (err) {
          console.warn('Firebase user fetch error:', err);
          setCurrentUser(null);
        } finally {
          setLoadingConfig(false);
        }
      }, (error) => {
        // Auth state listener error (e.g. network issues in APK WebView)
        console.warn('onAuthStateChanged error:', error);
        setLoadingConfig(false);
      });
    } catch (err) {
      console.warn('Firebase auth init error:', err);
      setLoadingConfig(false);
    }
    return unsub;
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    
    // Listen to shops
    const unsubShops = onSnapshot(collection(db, 'shops'), (snapshot) => {
      const dbShops = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setShops(dbShops);
    });

    // Listen to posts (City Pulse)
    const unsubPosts = onSnapshot(collection(db, 'posts'), (snapshot) => {
      const dbPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(dbPosts.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
    });

    // Listen to orders (Rider Network)
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const dbOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(dbOrders.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
    });

    // Mock Transit Data (since real tracking needs hardware/API integrations not currently active)
    setTransit([
      { id: '1', type: 'bus', route: '104 - City Center to North Hub', status: 'On Time', eta: '5 mins', location: 'Main Street' },
      { id: '2', type: 'bus', route: '201 - Station to Airport', status: 'Delayed', eta: '12 mins', location: 'Park Avenue' },
      { id: '3', type: 'parking', route: 'Central Mall Parking', status: 'Available', spots: 45, location: 'City Center' },
      { id: '4', type: 'rickshaw', route: 'Station Stand', status: 'Available', count: 12, location: 'Railway Station' }
    ]);

    return () => {
      unsubShops();
      unsubPosts();
      unsubOrders();
    };
  }, [currentUser]);

  const login = (user) => {
    // For legacy mock support or bypass
    setCurrentUser(user);
    if (user.role === 'owner') setCurrentScreen('ownerDashboard');
    else if (user.role === 'rider') setCurrentScreen('riderDashboard');
    else setCurrentScreen('customerHome');
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setCurrentScreen('login');
      setShops([]);
    } catch(err) {
      console.error(err);
    }
  };

  const toggleFavorite = (shopId) => {
    setFavorites(prev => 
      prev.includes(shopId) ? prev.filter(id => id !== shopId) : [...prev, shopId]
    );
  };

  const addShop = async (shopData) => {
    const newShop = {
      ...shopData,
      rating: 0,
      reviews: 0,
      views: 0,
      distance: (Math.random() * 5).toFixed(1) + " km", 
      products: [],
      ownerId: currentUser?.id,
      createdAt: new Date().toISOString()
    };
    try {
      const docRef = await addDoc(collection(db, 'shops'), newShop);
      return { id: docRef.id, ...newShop };
    } catch(err) {
      console.error(err);
    }
  };

  const addProduct = async (shopId, product) => {
    const shop = shops.find(s => s.id === shopId);
    if (!shop) return;
    const newProduct = { ...product, id: Date.now().toString() };
    const updatedProducts = [...shop.products, newProduct];
    const shopRef = doc(db, 'shops', shopId);
    await updateDoc(shopRef, { products: updatedProducts });
  };

  const deleteProduct = async (shopId, productId) => {
    const shop = shops.find(s => s.id === shopId);
    if (!shop) return;
    const updatedProducts = shop.products.filter(p => p.id !== productId);
    const shopRef = doc(db, 'shops', shopId);
    await updateDoc(shopRef, { products: updatedProducts });
  };

  const getOwnerShop = () => {
    return shops.find(s => s.ownerId === currentUser?.id);
  };

  const getOwnerShops = () => {
    return shops.filter(s => s.ownerId === currentUser?.id);
  };

  const editShop = async (shopId, updatedData) => {
    await updateDoc(doc(db, 'shops', shopId), updatedData);
  };

  const incrementShopViews = async (shopId) => {
    const shop = shops.find(s => s.id === shopId);
    if (!shop) return;
    await updateDoc(doc(db, 'shops', shopId), { views: (shop.views || 0) + 1 });
  };

  const editProduct = async (shopId, productId, updatedProductData) => {
    const shop = shops.find(s => s.id === shopId);
    if (!shop) return;
    const updatedProducts = shop.products.map(p => p.id === productId ? { ...p, ...updatedProductData } : p);
    await updateDoc(doc(db, 'shops', shopId), { products: updatedProducts });
  };

  const searchProducts = (query) => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const results = [];
    shops.forEach(shop => {
      const matchingProducts = (shop.products || []).filter(p => 
        p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      );
      if (matchingProducts.length > 0 || shop.name.toLowerCase().includes(q) || shop.category.toLowerCase().includes(q)) {
        results.push({ ...shop, matchingProducts: matchingProducts.length > 0 ? matchingProducts : shop.products.slice(0, 2) });
      }
    });
    return results;
  };

  // --- Phase 5 Methods ---

  const addPost = async (content, image = null) => {
    const newPost = {
      content,
      image,
      authorId: currentUser.id,
      authorName: currentUser.name,
      likes: 0,
      createdAt: new Date().toISOString()
    };
    await addDoc(collection(db, 'posts'), newPost);
  };

  const likePost = async (postId, currentLikes) => {
    await updateDoc(doc(db, 'posts', postId), { likes: currentLikes + 1 });
  };

  const createOrder = async (shopId, products, total, deliveryFee = 20) => {
    const shop = shops.find(s => s.id === shopId);
    if (!shop) return;
    const newOrder = {
      customerId: currentUser.id,
      customerName: currentUser.name,
      shopId,
      shopName: shop.name,
      products,
      total,
      deliveryFee,
      status: 'pending', // pending -> accepted -> picked_up -> delivered
      riderId: null,
      createdAt: new Date().toISOString()
    };
    await addDoc(collection(db, 'orders'), newOrder);
  };

  const updateOrderStatus = async (orderId, status, riderId = null) => {
    const updates = { status };
    if (riderId) updates.riderId = riderId;
    await updateDoc(doc(db, 'orders', orderId), updates);
  };

  const rateOrder = async (orderId, shopId, userRating) => {
    // 1. Mark order as rated
    await updateDoc(doc(db, 'orders', orderId), { status: 'rated', rating: userRating });
    
    // 2. Update shop rating average
    const shop = shops.find(s => s.id === shopId);
    if (!shop) return;
    const currentReviews = shop.reviews || 0;
    const currentTotalScore = (shop.rating || 0) * currentReviews;
    const newReviews = currentReviews + 1;
    const newRating = ((currentTotalScore + userRating) / newReviews).toFixed(1);
    
    await updateDoc(doc(db, 'shops', shopId), { rating: parseFloat(newRating), reviews: newReviews });
  };

  const addCivicIssue = (title) => {
    setCivicIssues([{ id: Date.now().toString(), title, status: 'Reported', upvotes: 0 }, ...civicIssues]);
  };

  const sendMessage = (recipientId, text) => {
    setChats(prev => [...prev, { 
      id: Date.now().toString(), 
      recipientId, 
      senderId: currentUser.id, 
      text, 
      timestamp: new Date().toISOString() 
    }]);
  };

  return (
    <AppContext.Provider value={{
      currentScreen, setCurrentScreen,
      currentUser, setCurrentUser, login, logout,
      shops, favorites, toggleFavorite, selectedShop, setSelectedShop,
      addShop, editShop, addProduct, editProduct, deleteProduct, getOwnerShop, getOwnerShops, searchProducts,
      loadingConfig, incrementShopViews, rateOrder,
      // Phase 5 exports
      posts, transit, orders, addPost, likePost, createOrder, updateOrderStatus,
      // Phase 2, 3, 4 exports
      civicIssues, addCivicIssue,
      // Missing features exports
      chats, sendMessage
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
