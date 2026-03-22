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
    const unsub = onSnapshot(collection(db, 'shops'), (snapshot) => {
      const dbShops = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setShops(dbShops);
    });
    return unsub;
  }, [currentUser]);

  const login = (user) => {
    // For legacy mock support or bypass
    setCurrentUser(user);
    if (user.role === 'owner') setCurrentScreen('ownerDashboard');
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

  return (
    <AppContext.Provider value={{
      currentScreen, setCurrentScreen,
      currentUser, setCurrentUser, login, logout,
      shops, favorites, toggleFavorite, selectedShop, setSelectedShop,
      addShop, addProduct, deleteProduct, getOwnerShop, searchProducts,
      loadingConfig
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
