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

  // Phase 2, 3, 4 State (Mocked for full city vision)
  const [services, setServices] = useState([
    { id: 's1', name: 'Ramesh Plumbing', category: 'Plumber', rating: 4.8, phone: '555-0101', distance: '1.2 km' },
    { id: 's2', name: 'QuickFix Electric', category: 'Electrician', rating: 4.5, phone: '555-0102', distance: '0.8 km' }
  ]);
  const [healthInfo, setHealthInfo] = useState({
    hospitals: [{ id: 'h1', name: 'City Medical Center', beds: 12, distance: '2.5 km' }],
    sosAlerts: []
  });
  const [jobs, setJobs] = useState([
    { id: 'j1', title: 'Shop Assistant Needed', shop: 'Krishna Mart', salary: '₹12k/month' }
  ]);
  const [civicIssues, setCivicIssues] = useState([
    { id: 'c1', title: 'Deep Pothole on MG Road', status: 'Reported', upvotes: 14 }
  ]);
  const [realEstate, setRealEstate] = useState([
    { id: 'r1', title: '1 BHK for Rent', location: 'City Center', rent: '₹15k/month' }
  ]);
  const [events, setEvents] = useState([
    { id: 'e1', title: 'Sunday Open Mic', date: 'This Sunday, 7 PM', location: 'Cafe Central' }
  ]);

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

  const createOrder = async (shopId, products, total) => {
    const shop = shops.find(s => s.id === shopId);
    if (!shop) return;
    const newOrder = {
      customerId: currentUser.id,
      customerName: currentUser.name,
      shopId,
      shopName: shop.name,
      products,
      total,
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

  const addCivicIssue = (title) => {
    setCivicIssues([{ id: Date.now().toString(), title, status: 'Reported', upvotes: 0 }, ...civicIssues]);
  };

  return (
    <AppContext.Provider value={{
      currentScreen, setCurrentScreen,
      currentUser, setCurrentUser, login, logout,
      shops, favorites, toggleFavorite, selectedShop, setSelectedShop,
      addShop, addProduct, deleteProduct, getOwnerShop, searchProducts,
      loadingConfig,
      // Phase 5 exports
      posts, transit, orders, addPost, likePost, createOrder, updateOrderStatus,
      // Phase 2, 3, 4 exports
      services, healthInfo, jobs, civicIssues, addCivicIssue, realEstate, events
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
