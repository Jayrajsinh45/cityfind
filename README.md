# 🏙️ CityFind - Local City Business Discovery App

A mobile-first React web app for discovering local shops and businesses in your city.

## Features

### For Customers 👤
- 🔍 Search any product across all shops
- 🏪 Browse by category (Grocery, Pharmacy, Electronics, Food, Hardware, Clothing)
- 📍 View nearby shops with distance
- ❤️ Save favourite shops
- 📞 Call shops directly from the app
- 🗺️ Get directions via Google Maps

### For Business Owners 🏪
- ✅ Register your shop with full details
- 📦 Add/remove products with prices and availability
- 📊 Dashboard with views and stats
- 🔄 Toggle product stock availability

## Demo Accounts
- **Customer**: Any email + any password → Customer view
- **Owner**: `owner@demo.com` + any password → Owner view

## Setup & Run

### Prerequisites
- Node.js 16+
- npm or yarn

### Install & Start
```bash
npm install
npm start
```

App runs at: http://localhost:3000

### Build for Production
```bash
npm run build
```

## Tech Stack
- **React 18** — UI Framework
- **Context API** — State Management
- **CSS Variables** — Theming
- **Google Fonts** — Syne + Outfit

## Folder Structure
```
src/
├── context/
│   └── AppContext.js      # Global state + mock data
├── pages/
│   ├── SplashScreen.js    # Launch screen
│   ├── LoginScreen.js     # Auth (Login/Signup/Role selection)
│   ├── CustomerHome.js    # Customer: Home, Search, Favourites, Profile
│   ├── OwnerDashboard.js  # Owner: Dashboard, Products, Profile
│   └── ShopDetail.js      # Shop detail page
├── App.js                 # Screen router
├── index.js               # Entry point
└── index.css              # Global styles + design system
```

## Next Steps (Backend Integration)
1. Replace `AppContext.js` mock data with **Firebase Firestore**
2. Enable **Firebase Auth** for real Google Sign-In
3. Add **Firebase Storage** for shop/product photos
4. Integrate **Google Maps API** for real location services
5. Add **Algolia** for fast full-text product search

## Design System
- **Primary**: #FF6B2C (Orange)
- **Secondary**: #1A1A2E (Dark Navy)
- **Accent**: #FFD166 (Yellow)
- **Font Display**: Syne (headings)
- **Font Body**: Outfit (text)
