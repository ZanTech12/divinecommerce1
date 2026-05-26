// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute } from './components/ProtectedRoute'; // ✅ Updated import
import { Icon } from '@iconify/react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import AdminDashboard from './pages/admin/Dashboard';
import MessagesPage from './pages/admin/MessagesPage';
import ManageSalesReps from './pages/admin/ManageSalesReps'; // ✅ NEW: Import Sales Reps Page
import ProductDetail from "./pages/ProductDetail";
import TrackOrder from "./pages/TrackOrder";
import MyOrdersPage from "./pages/MyOrdersPage";
import Rewards from "./pages/Rewards";
import RegisterEngineer from "./pages/RegisterEngineer";
import ScrollToTop from './components/ScrollToTop'; // ✅ ALREADY IMPORTED
import api from './api/axios';
import './App.css';

// ⚠️ NOTE: If you have other admin pages like ProductsPage, OrdersPage, etc., 
// import them here as well.

function App() {
  const [siteSettings, setSiteSettings] = useState(null);

  const companyName = siteSettings?.companyName || "AFOO TECHNOLOGY";
  const companyLogo = siteSettings?.logo || "";
  const companyDesc = siteSettings?.aboutUs || "Your premium online shopping destination in Nigeria. Quality products, fast delivery, and the best prices guaranteed.";
  const footerText = siteSettings?.footerText || `© ${new Date().getFullYear()} ${companyName}. All rights reserved.`;
  
  const address = siteSettings?.address || "23, Marina Street, Lagos Island, Lagos, Nigeria";
  const phone = siteSettings?.phone || "+234 800 MALL HUB";
  const email = siteSettings?.email || "support@AFOO TECHNOLOGY.com";
  const supportHours = siteSettings?.supportHours || "Mon - Sat: 8AM - 8PM";
  
  const appStoreLink = siteSettings?.appStoreLink || "#";
  const googlePlayLink = siteSettings?.googlePlayLink || "#";

  const socials = [
    { key: 'facebook', icon: 'lucide:facebook', link: siteSettings?.facebook },
    { key: 'twitter', icon: 'lucide:twitter', link: siteSettings?.twitter },
    { key: 'instagram', icon: 'lucide:instagram', link: siteSettings?.instagram },
    { key: 'tiktok', icon: 'lucide:music', link: siteSettings?.tiktok },
    { key: 'youtube', icon: 'lucide:youtube', link: siteSettings?.youtube },
  ].filter(s => s.link);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/site-settings");
        setSiteSettings(res.data);
      } catch (error) {
        console.error("Failed to fetch site settings for footer");
      }
    };
    fetchSettings();
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <ScrollToTop /> {/* ✅ ALREADY IN THE PERFECT SPOT */}
          <div className="app-layout">
            <Navbar />
            <main className="app-main">
              <Routes>
                {/* ─── Public Routes ─── */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/track-order" element={<TrackOrder />} />
                <Route path="/rewards" element={<Rewards/>} /> 
                <Route path="/register-engineer" element={<RegisterEngineer />} />

                {/* ─── General Protected Routes ─── */}
                <Route path="/my-orders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />

                {/* ══════════════════════════════════════════════════════════════
                    ✅ UPDATED: Admin / Sales Rep Routes (Permission Protected)
                    Admin always passes. Sales Rep must have the specific permission.
                ══════════════════════════════════════════════════════════════ */}
                <Route 
                  path="/admin/dashboard" 
                  element={<ProtectedRoute requiredPermission="dashboard"><AdminDashboard /></ProtectedRoute>} 
                />
                <Route 
                  path="/admin/messages" 
                  element={<ProtectedRoute requiredPermission="manage_banners"><MessagesPage /></ProtectedRoute>} 
                />
                
                {/* ✅ NEW: Sales Rep Management (Admin Only Permission) */}
                <Route 
                  path="/admin/sales-reps" 
                  element={<ProtectedRoute requiredPermission="manage_sales_reps"><ManageSalesReps /></ProtectedRoute>} 
                />

                {/* ⚠️ EXAMPLES: Add your other admin routes following this pattern: */}
                {/*
                <Route path="/admin/products" element={<ProtectedRoute requiredPermission="manage_products"><ProductsPage /></ProtectedRoute>} />
                <Route path="/admin/categories" element={<ProtectedRoute requiredPermission="manage_categories"><CategoriesPage /></ProtectedRoute>} />
                <Route path="/admin/orders" element={<ProtectedRoute requiredPermission="manage_orders"><OrdersPage /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute requiredPermission="manage_users"><UsersPage /></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute requiredPermission="manage_settings"><SettingsPage /></ProtectedRoute>} />
                */}
              </Routes>
            </main>

            {/* ═══════════ FOOTER ═══════════ */}
            <footer className="ft">
              <div className="ft__newsletter">
                <div className="ft__newsletter-inner">
                  <div className="ft__newsletter-text">
                    <Icon icon="lucide:mail" width={24} className="ft__newsletter-icon" />
                    <div>
                      <h3 className="ft__newsletter-title">Subscribe to our Newsletter</h3>
                      <p className="ft__newsletter-sub">Get exclusive deals and updates delivered to your inbox</p>
                    </div>
                  </div>
                  <form className="ft__newsletter-form" onSubmit={(e) => e.preventDefault()}>
                    <div className="ft__newsletter-input-wrap">
                      <Icon icon="lucide:mail" width={18} className="ft__newsletter-input-icon" />
                      <input type="email" placeholder="Enter your email address" className="ft__newsletter-input" />
                    </div>
                    <button type="submit" className="ft__newsletter-btn">Subscribe</button>
                  </form>
                </div>
              </div>

              <div className="ft__main">
                <div className="ft__container">
                  <div className="ft__brand">
                    <Link to="/" className="ft__logo">
                      {companyLogo ? (
                        <img src={companyLogo} alt={companyName} className="ft__logo-custom-img" />
                      ) : (
                        <div className="ft__logo-icon"><Icon icon="lucide:shopping-bag" width={22} /></div>
                      )}
                      {!companyLogo && <span className="ft__logo-name">{companyName}</span>}
                    </Link>
                    <p className="ft__brand-desc">{companyDesc}</p>
                    
                    <div className="ft__socials">
                      {socials.map(s => (
                        <a key={s.key} href={s.link} target="_blank" rel="noopener noreferrer" className="ft__social" aria-label={s.key}><Icon icon={s.icon} width={18} /></a>
                      ))}
                    </div>

                    <div className="ft__app-badges">
                      <a href={googlePlayLink} target="_blank" rel="noopener noreferrer" className="ft__app-badge">
                        <Icon icon="lucide:play" width={18} />
                        <div><span className="ft__app-badge-sm">GET IT ON</span><span className="ft__app-badge-lg">Google Play</span></div>
                      </a>
                      <a href={appStoreLink} target="_blank" rel="noopener noreferrer" className="ft__app-badge">
                        <Icon icon="lucide:apple" width={18} />
                        <div><span className="ft__app-badge-sm">Download on the</span><span className="ft__app-badge-lg">App Store</span></div>
                      </a>
                    </div>
                  </div>

                  <div className="ft__col">
                    <h4 className="ft__col-title">Quick Links</h4>
                    <ul className="ft__col-list">
                      <li><Link to="/">Home</Link></li>
                      <li><Link to="/products">All Products</Link></li>
                      <li><Link to="/products?category=Phones">Phones & Tablets</Link></li>
                      <li><Link to="/products?category=Electronics">Electronics</Link></li>
                      <li><Link to="/products?category=Fashion">Fashion</Link></li>
                      <li><Link to="/products?category=Appliances">Appliances</Link></li>
                    </ul>
                  </div>

                  <div className="ft__col">
                    <h4 className="ft__col-title">Customer Service</h4>
                    <ul className="ft__col-list">
                      <li><Link to="/help">Help Center</Link></li>
                      <li><Link to="/help#returns">Returns & Refunds</Link></li>
                      <li><Link to="/help#delivery">Delivery Info</Link></li>
                      <li><Link to="/help#payment">Payment Methods</Link></li>
                      <li><Link to="/track-order">Track Order</Link></li>
                      <li><Link to="/my-orders">My Orders</Link></li>
                      <li><Link to="/help#faq">FAQs</Link></li>
                    </ul>
                  </div>

                  <div className="ft__col">
                    <h4 className="ft__col-title">Contact Us</h4>
                    <ul className="ft__contact-list">
                      <li className="ft__contact-item"><Icon icon="lucide:map-pin" width={16} /><span>{address}</span></li>
                      <li className="ft__contact-item"><Icon icon="lucide:phone" width={16} /><span>{phone}</span></li>
                      <li className="ft__contact-item"><Icon icon="lucide:mail" width={16} /><span>{email}</span></li>
                      <li className="ft__contact-item"><Icon icon="lucide:clock" width={16} /><span>{supportHours}</span></li>
                    </ul>
                    <div className="ft__trust">
                      <div className="ft__trust-item"><Icon icon="lucide:shield-check" width={14} /><span>Secure Payments</span></div>
                      <div className="ft__trust-item"><Icon icon="lucide:truck" width={14} /><span>Fast Delivery</span></div>
                      <div className="ft__trust-item"><Icon icon="lucide:rotate-ccw" width={14} /><span>Easy Returns</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ft__payments">
                <div className="ft__container">
                  <div className="ft__payments-inner">
                    <span className="ft__payments-label">We accept:</span>
                    <div className="ft__payments-icons">
                      <div className="ft__pay-icon"><Icon icon="lucide:credit-card" width={22} /><span>Visa</span></div>
                      <div className="ft__pay-icon"><Icon icon="lucide:credit-card" width={22} /><span>Mastercard</span></div>
                      <div className="ft__pay-icon"><Icon icon="lucide:smartphone" width={22} /><span>USSD</span></div>
                      <div className="ft__pay-icon"><Icon icon="lucide:wallet" width={22} /><span>Wallet</span></div>
                      <div className="ft__pay-icon"><Icon icon="lucide:banknote" width={22} /><span>Bank Transfer</span></div>
                      <div className="ft__pay-icon"><Icon icon="lucide:truck" width={22} /><span>COD</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ft__bottom">
                <div className="ft__container">
                  <div className="ft__bottom-inner">
                    <p className="ft__copy">{footerText}</p>
                    <div className="ft__bottom-links">
                      <Link to="/privacy">Privacy Policy</Link>
                      <Link to="/terms">Terms of Service</Link>
                      <Link to="/sitemap">Sitemap</Link>
                    </div>
                  </div>
                </div>
              </div>
            </footer>
            
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;