import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

// Mock data for shops and products
const MOCK_SHOPS = [
  {
    id: 1,
    name: "Patel General Store",
    category: "Grocery",
    address: "12, Alkapuri, Vadodara",
    phone: "9876543210",
    hours: "7:00 AM - 10:00 PM",
    rating: 4.5,
    reviews: 128,
    distance: "0.3 km",
    image: null,
    ownerId: "owner1",
    products: [
      { id: 101, name: "Basmati Rice (5kg)", price: 320, available: true, category: "Food" },
      { id: 102, name: "Toor Dal (1kg)", price: 140, available: true, category: "Food" },
      { id: 103, name: "Sunflower Oil (1L)", price: 160, available: true, category: "Food" },
      { id: 104, name: "Sugar (1kg)", price: 45, available: true, category: "Food" },
      { id: 105, name: "Wheat Flour (10kg)", price: 380, available: false, category: "Food" },
    ]
  },
  {
    id: 2,
    name: "City Pharmacy",
    category: "Pharmacy",
    address: "45, Fatehgunj, Vadodara",
    phone: "9812345678",
    hours: "8:00 AM - 11:00 PM",
    rating: 4.8,
    reviews: 94,
    distance: "0.7 km",
    image: null,
    ownerId: "owner2",
    products: [
      { id: 201, name: "Paracetamol 500mg", price: 22, available: true, category: "Medicine" },
      { id: 202, name: "Vitamin C Tablets", price: 85, available: true, category: "Medicine" },
      { id: 203, name: "Hand Sanitizer 200ml", price: 65, available: true, category: "Healthcare" },
      { id: 204, name: "Blood Pressure Monitor", price: 1200, available: true, category: "Equipment" },
    ]
  },
  {
    id: 3,
    name: "TechZone Electronics",
    category: "Electronics",
    address: "8, Sayajigunj, Vadodara",
    phone: "9823456789",
    hours: "10:00 AM - 8:00 PM",
    rating: 4.3,
    reviews: 67,
    distance: "1.2 km",
    image: null,
    ownerId: "owner3",
    products: [
      { id: 301, name: "USB-C Charging Cable", price: 250, available: true, category: "Accessories" },
      { id: 302, name: "Bluetooth Earphones", price: 1499, available: true, category: "Audio" },
      { id: 303, name: "Phone Screen Guard", price: 120, available: true, category: "Accessories" },
      { id: 304, name: "Power Bank 10000mAh", price: 999, available: false, category: "Accessories" },
      { id: 305, name: "LED Bulb 9W", price: 85, available: true, category: "Lighting" },
    ]
  },
  {
    id: 4,
    name: "Fresh Bakes",
    category: "Food",
    address: "22, Karelibaug, Vadodara",
    phone: "9845678901",
    hours: "6:00 AM - 9:00 PM",
    rating: 4.6,
    reviews: 211,
    distance: "0.5 km",
    image: null,
    ownerId: "owner4",
    products: [
      { id: 401, name: "Whole Wheat Bread", price: 45, available: true, category: "Bakery" },
      { id: 402, name: "Butter Croissant", price: 35, available: true, category: "Bakery" },
      { id: 403, name: "Chocolate Cake (500g)", price: 280, available: true, category: "Cakes" },
      { id: 404, name: "Muffin (6 pcs)", price: 120, available: true, category: "Bakery" },
    ]
  },
  {
    id: 5,
    name: "Shree Hardware",
    category: "Hardware",
    address: "67, Nizampura, Vadodara",
    phone: "9867890123",
    hours: "9:00 AM - 7:00 PM",
    rating: 4.1,
    reviews: 45,
    distance: "1.8 km",
    image: null,
    ownerId: "owner5",
    products: [
      { id: 501, name: "Hammer 500g", price: 180, available: true, category: "Tools" },
      { id: 502, name: "Paint Brush Set", price: 220, available: true, category: "Painting" },
      { id: 503, name: "Extension Cord 5m", price: 350, available: true, category: "Electrical" },
      { id: 504, name: "Door Lock (Brass)", price: 450, available: true, category: "Hardware" },
    ]
  }
];

export function AppProvider({ children }) {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [currentUser, setCurrentUser] = useState(null);
  const [shops, setShops] = useState(MOCK_SHOPS);
  const [favorites, setFavorites] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);

  const login = (user) => {
    setCurrentUser(user);
    if (user.role === 'owner') {
      setCurrentScreen('ownerDashboard');
    } else {
      setCurrentScreen('customerHome');
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentScreen('login');
  };

  const toggleFavorite = (shopId) => {
    setFavorites(prev =>
      prev.includes(shopId) ? prev.filter(id => id !== shopId) : [...prev, shopId]
    );
  };

  const addShop = (shopData) => {
    const newShop = {
      ...shopData,
      id: Date.now(),
      rating: 0,
      reviews: 0,
      distance: "0.1 km",
      products: [],
      ownerId: currentUser?.id
    };
    setShops(prev => [...prev, newShop]);
    return newShop;
  };

  const addProduct = (shopId, product) => {
    setShops(prev => prev.map(shop =>
      shop.id === shopId
        ? { ...shop, products: [...shop.products, { ...product, id: Date.now() }] }
        : shop
    ));
  };

  const deleteProduct = (shopId, productId) => {
    setShops(prev => prev.map(shop =>
      shop.id === shopId
        ? { ...shop, products: shop.products.filter(p => p.id !== productId) }
        : shop
    ));
  };

  const getOwnerShop = () => {
    return shops.find(s => s.ownerId === currentUser?.id);
  };

  const searchProducts = (query) => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const results = [];
    shops.forEach(shop => {
      const matchingProducts = shop.products.filter(p =>
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
      currentUser, login, logout,
      shops, favorites, toggleFavorite, selectedShop, setSelectedShop,
      addShop, addProduct, deleteProduct, getOwnerShop, searchProducts
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
