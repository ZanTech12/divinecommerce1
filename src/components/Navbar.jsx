import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { Icon } from "@iconify/react";
import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import Point from "../pages/Point";
import permanentLogo from "../assets/Divine Vine edo logo.png";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalQty = 0 } = useCart() || {};
  const navigate = useNavigate();

  const [siteSettings, setSiteSettings] = useState(null);

  const [dropdown, setDropdown] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [profileSheet, setProfileSheet] = useState(false);

  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const companyName = siteSettings?.companyName || "Divine Vine-Edo";
  const companyTagline = siteSettings?.companyTagline || "YOUR ONE-STOP ONLINE MALL";

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/site-settings");
        setSiteSettings(res.data);
      } catch (error) {
        console.error("Failed to fetch site settings for navbar");
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!dropdown) return;

    const handleClick = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [dropdown]);

  useEffect(() => {
    if (mobileMenu || profileSheet || showMobileSearch) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenu, profileSheet, showMobileSearch]);

  useEffect(() => {
    if (showMobileSearch && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [showMobileSearch]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setShowMobileSearch(false);
        setMobileMenu(false);
        setDropdown(false);
        setProfileSheet(false);
      }
    };

    document.addEventListener("keydown", onKey);

    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const closeMobile = () => {
    setMobileMenu(false);
    setShowMobileSearch(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowMobileSearch(false);
      closeMobile();
    }
  };

  // Check if user can access admin panel
  const canAccessAdmin =
    user?.role === "admin" || user?.role === "sales_rep";

  return (
    <>
      <style>{`
        /* ═══════════════════════════════════════════
           MODERN NAVBAR — Full Stylesheet
           ═══════════════════════════════════════════ */

        /* ── Root Variables ── */
        :root {
          --nb-gradient-start: #667eea;
          --nb-gradient-end: #764ba2;
          --nb-gradient: linear-gradient(135deg, var(--nb-gradient-start), var(--nb-gradient-end));
          --nb-accent: #f68b1e;
          --nb-accent-dark: #e8590c;
          --nb-radius: 16px;
          --nb-radius-sm: 12px;
          --nb-radius-xs: 8px;
          --nb-shadow-sm: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06);
          --nb-shadow-md: 0 4px 16px rgba(0,0,0,0.08);
          --nb-shadow-lg: 0 12px 40px rgba(0,0,0,0.12);
          --nb-shadow-glow: 0 4px 20px rgba(102,126,234,0.35);
          --nb-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* ── Top Bar ── */
        .nb__topbar {
          background: #1a1a2e;
          color: rgba(255,255,255,0.6);
          font-size: 0.76rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: var(--nb-transition);
        }

        .nb--scrolled .nb__topbar {
          margin-top: -32px;
          height: 0;
          overflow: hidden;
          border: none;
        }

        .nb__topbar-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 16px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nb__topbar-link {
          color: rgba(255,255,255,0.55);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition: var(--nb-transition);
          font-size: 0.73rem;
        }

        .nb__topbar-link:hover {
          color: #fff;
        }

        .nb__topbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* ── Auth Links ── */
        .nb__auth-links {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .nb__auth-link {
          text-decoration: none;
          font-size: 0.73rem;
          font-weight: 600;
          padding: 3px 12px;
          border-radius: 20px;
          transition: var(--nb-transition);
        }

        .nb__auth-link--login {
          color: rgba(255,255,255,0.7);
          border: 1px solid rgba(255,255,255,0.15);
        }

        .nb__auth-link--login:hover {
          color: #fff;
          border-color: rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.05);
        }

        .nb__auth-link--register {
          color: #fff;
          background: var(--nb-gradient);
          border: none;
        }

        .nb__auth-link--register:hover {
          box-shadow: 0 2px 12px rgba(102,126,234,0.4);
          transform: translateY(-1px);
        }

        /* ── User Dropdown ── */
        .nb__user-dropdown {
          position: relative;
        }

        .nb__user-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          font-size: 0.73rem;
          padding: 2px 4px;
          border-radius: 8px;
          transition: var(--nb-transition);
        }

        .nb__user-btn:hover {
          color: #fff;
          background: rgba(255,255,255,0.05);
        }

        .nb__user-caret {
          transition: transform 0.2s ease;
          opacity: 0.5;
        }

        .nb__user-caret--open {
          transform: rotate(180deg);
          opacity: 1;
        }

        /* ── Dropdown Menu ── */
        .nb__dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 280px;
          background: #fff;
          border-radius: var(--nb-radius);
          box-shadow: var(--nb-shadow-lg);
          border: 1px solid rgba(0,0,0,0.06);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-8px) scale(0.97);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1000;
          overflow: hidden;
        }

        .nb__dropdown--open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0) scale(1);
        }

        .nb__dropdown-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: linear-gradient(135deg, rgba(102,126,234,0.06), rgba(118,75,162,0.06));
          border-bottom: 1px solid rgba(0,0,0,0.04);
        }

        .nb__dropdown-name {
          font-weight: 700;
          font-size: 0.88rem;
          color: #1a1a2e;
          margin: 0;
          line-height: 1.2;
        }

        .nb__dropdown-email {
          font-size: 0.73rem;
          color: #868e96;
          margin: 2px 0 0;
        }

        .nb__dropdown-divider {
          height: 1px;
          background: rgba(0,0,0,0.05);
          margin: 4px 0;
        }

        .nb__dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          color: #495057;
          text-decoration: none;
          font-size: 0.84rem;
          font-weight: 500;
          transition: var(--nb-transition);
          cursor: pointer;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
        }

        .nb__dropdown-item:hover {
          background: rgba(102,126,234,0.06);
          color: var(--nb-gradient-start);
          padding-left: 20px;
        }

        .nb__dropdown-item--admin {
          color: var(--nb-gradient-end);
          font-weight: 600;
        }

        .nb__dropdown-item--admin:hover {
          background: rgba(118,75,162,0.08);
          color: var(--nb-gradient-end);
        }

        .nb__dropdown-item--logout {
          color: #e8590c;
          font-weight: 600;
        }

        .nb__dropdown-item--logout:hover {
          background: rgba(232,89,12,0.06);
          color: #e8590c;
        }

        /* ── Avatars ── */
        .nb__avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
          background: var(--nb-gradient);
          box-shadow: 0 2px 8px rgba(102,126,234,0.3);
        }

        .nb__avatar--topbar {
          width: 24px;
          height: 24px;
          font-size: 0.65rem;
          border-radius: 8px;
        }

        .nb__avatar--lg {
          width: 40px;
          height: 40px;
          font-size: 0.95rem;
        }

        .nb__avatar--xl {
          width: 48px;
          height: 48px;
          font-size: 1.15rem;
          border-radius: 16px;
        }

        .nb__avatar--xxl {
          width: 64px;
          height: 64px;
          font-size: 1.5rem;
          border-radius: 20px;
        }

        /* ═══════════════════════════════════════════
           MAIN NAVIGATION BAR
           ═══════════════════════════════════════════ */

        .nb__main {
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          transition: var(--nb-transition);
          position: sticky;
          top: 0;
          z-index: 1030;
        }

        .nb--scrolled .nb__main {
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 2px 20px rgba(0,0,0,0.06);
        }

        .nb--search-active .nb__main {
          position: relative;
        }

        .nb__main-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* ═══════════════════════════════════════════
           LOGO
           ═══════════════════════════════════════════ */

        .nb__logo {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
          position: relative;
        }

        /* Permanent logo container */
        .nb__logo-img-wrapper {
          position: relative;
          width: 52px;
          height: 52px;
          border-radius: 0;
          overflow: visible;
          flex-shrink: 0;
          background: transparent;
          padding: 0;
          box-shadow: none;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .nb__logo:hover .nb__logo-img-wrapper {
          transform: scale(1.06) rotate(-1.5deg);
          box-shadow: none;
        }

        .nb__logo-img-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 0;
          display: block;
          background: transparent;
        }

        .nb__logo-icon-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--nb-gradient);
          border-radius: 13.5px;
          color: #fff;
        }

        .nb__logo-badge-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 12px;
          height: 12px;
          background: linear-gradient(135deg, #00b894, #00cec9);
          border-radius: 50%;
          border: 2.5px solid white;
          box-shadow: 0 2px 6px rgba(0, 184, 148, 0.5);
          animation: nbPulse 2s infinite;
        }

        @keyframes nbPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }

          50% {
            transform: scale(1.25);
            opacity: 0.7;
          }
        }

        .nb__logo-text-group {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
        }

        .nb__logo-name {
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: -0.4px;
          background: linear-gradient(135deg, #1a1a2e 0%, var(--nb-gradient-start) 50%, var(--nb-gradient-end) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          transition: all 0.3s ease;
          display: block;
        }

        .nb__logo:hover .nb__logo-name {
          background: linear-gradient(135deg, var(--nb-gradient-start) 0%, var(--nb-gradient-end) 50%, var(--nb-accent) 100%);
          -webkit-background-clip: text;
          background-clip: text;
        }

        .nb__logo-tagline {
          font-size: 0.68rem;
          color: #868e96;
          font-weight: 500;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }

        /* ═══════════════════════════════════════════
           SEARCH BAR
           ═══════════════════════════════════════════ */

        .nb__search {
          flex: 1;
          max-width: 540px;
        }

        .nb__search-wrap {
          position: relative;
          display: flex;
          align-items: center;
          border-radius: 50px;
          border: 2px solid #e9ecef;
          background: #f8f9fa;
          transition: all 0.3s ease;
          overflow: hidden;
          height: 44px;
        }

        .nb__search-wrap--focused {
          border-color: var(--nb-gradient-start);
          background: #fff;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.12);
        }

        .nb__search-icon {
          position: absolute;
          left: 16px;
          color: #adb5bd;
          transition: color 0.3s;
          pointer-events: none;
        }

        .nb__search-wrap--focused .nb__search-icon {
          color: var(--nb-gradient-start);
        }

        .nb__search-input {
          flex: 1;
          border: none;
          background: transparent;
          padding: 0 40px 0 46px;
          font-size: 0.88rem;
          color: #212529;
          outline: none;
          height: 100%;
        }

        .nb__search-input::placeholder {
          color: #adb5bd;
        }

        .nb__search-clear {
          position: absolute;
          right: 108px;
          background: #e9ecef;
          border: none;
          border-radius: 50%;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #868e96;
          cursor: pointer;
          transition: var(--nb-transition);
        }

        .nb__search-clear:hover {
          background: #dee2e6;
          color: #495057;
        }

        .nb__search-btn {
          position: absolute;
          right: 4px;
          top: 50%;
          transform: translateY(-50%);
          background: var(--nb-gradient);
          color: #fff;
          border: none;
          border-radius: 50px;
          padding: 7px 22px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          letter-spacing: 0.2px;
        }

        .nb__search-btn:hover {
          box-shadow: var(--nb-shadow-glow);
          transform: translateY(-50%) scale(1.03);
        }

        /* ═══════════════════════════════════════════
           ACTION ICONS
           ═══════════════════════════════════════════ */

        .nb__actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .nb__action {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          text-decoration: none;
          padding: 6px 10px;
          border-radius: var(--nb-radius-sm);
          transition: var(--nb-transition);
          position: relative;
        }

        .nb__action:hover {
          background: rgba(102,126,234,0.06);
        }

        .nb__action-icon {
          width: 38px;
          height: 38px;
          border-radius: var(--nb-radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          border: 1.5px solid #e9ecef;
          color: #495057;
          transition: all 0.3s ease;
          position: relative;
        }

        .nb__action:hover .nb__action-icon {
          background: var(--nb-gradient);
          color: #fff;
          border-color: transparent;
          transform: translateY(-2px);
          box-shadow: var(--nb-shadow-glow);
        }

        .nb__action-label {
          font-size: 0.66rem;
          font-weight: 600;
          color: #868e96;
          transition: var(--nb-transition);
        }

        .nb__action:hover .nb__action-label {
          color: var(--nb-gradient-start);
        }

        /* ── Badge ── */
        .nb__badge {
          position: absolute;
          top: -5px;
          right: -5px;
          min-width: 18px;
          height: 18px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--nb-accent-dark), var(--nb-accent));
          color: #fff;
          font-size: 0.63rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 2px solid #fff;
          box-shadow: 0 2px 6px rgba(232, 89, 12, 0.4);
          line-height: 1;
        }

        .nb__badge--mobile {
          top: -4px;
          right: -6px;
          min-width: 16px;
          height: 16px;
          font-size: 0.58rem;
          padding: 0 3px;
          border-width: 1.5px;
        }

        /* ═══════════════════════════════════════════
           MOBILE ACTIONS
           ═══════════════════════════════════════════ */

        .nb__mobile-actions {
          display: none;
          align-items: center;
          gap: 4px;
          margin-left: auto;
        }

        .nb__mobile-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--nb-radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          border: 1.5px solid #e9ecef;
          color: #495057;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          text-decoration: none;
        }

        .nb__mobile-icon:hover {
          background: var(--nb-gradient);
          color: #fff;
          border-color: transparent;
          box-shadow: var(--nb-shadow-glow);
        }

        /* ═══════════════════════════════════════════
           MOBILE SEARCH OVERLAY
           ═══════════════════════════════════════════ */

        .nb__mobile-search-overlay {
          position: fixed;
          inset: 0;
          background: #fff;
          z-index: 2000;
          display: flex;
          flex-direction: column;
          transform: translateY(-100%);
          opacity: 0;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }

        .nb__mobile-search-overlay--open {
          transform: translateY(0);
          opacity: 1;
          pointer-events: auto;
        }

        .nb__mobile-search-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-bottom: 1px solid #f1f3f5;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(12px);
        }

        .nb__mobile-search-back {
          background: none;
          border: none;
          color: #495057;
          cursor: pointer;
          padding: 6px;
          border-radius: var(--nb-radius-xs);
          transition: var(--nb-transition);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nb__mobile-search-back:hover {
          background: #f1f3f5;
        }

        .nb__mobile-search-form {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }

        .nb__mobile-search-icon {
          position: absolute;
          left: 14px;
          color: #adb5bd;
          pointer-events: none;
        }

        .nb__mobile-search-input {
          width: 100%;
          border: 2px solid #e9ecef;
          border-radius: 50px;
          padding: 10px 16px 10px 42px;
          font-size: 0.92rem;
          outline: none;
          background: #f8f9fa;
          transition: all 0.3s ease;
        }

        .nb__mobile-search-input:focus {
          border-color: var(--nb-gradient-start);
          background: #fff;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .nb__mobile-search-body {
          flex: 1;
          padding: 20px 16px;
          overflow-y: auto;
        }

        .nb__search-suggestions__title {
          font-size: 0.78rem;
          font-weight: 700;
          color: #868e96;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 12px;
        }

        .nb__search-suggestions__list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .nb__search-suggestion-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 50px;
          border: 1.5px solid #e9ecef;
          background: #fff;
          color: #495057;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .nb__search-suggestion-chip:hover {
          border-color: var(--nb-gradient-start);
          background: rgba(102,126,234,0.04);
          color: var(--nb-gradient-start);
          transform: translateY(-1px);
          box-shadow: var(--nb-shadow-sm);
        }

        /* ═══════════════════════════════════════════
           MOBILE DRAWER
           ═══════════════════════════════════════════ */

        .nb__backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          z-index: 1500;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          backdrop-filter: blur(4px);
        }

        .nb__backdrop--visible {
          opacity: 1;
          visibility: visible;
        }

        .nb__drawer {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 300px;
          max-width: 85vw;
          background: #fff;
          z-index: 1600;
          transform: translateX(-100%);
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          box-shadow: var(--nb-shadow-lg);
        }

        .nb__drawer--open {
          transform: translateX(0);
        }

        .nb__drawer-header {
          padding: 20px;
          border-bottom: 1px solid #f1f3f5;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, rgba(102,126,234,0.04), rgba(118,75,162,0.04));
        }

        .nb__drawer-user {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          padding: 4px;
          border-radius: var(--nb-radius-sm);
          transition: var(--nb-transition);
          text-decoration: none;
        }

        .nb__drawer-user:hover {
          background: rgba(102,126,234,0.06);
        }

        .nb__drawer-name {
          font-weight: 700;
          font-size: 0.92rem;
          color: #1a1a2e;
          margin: 0;
          line-height: 1.2;
        }

        .nb__drawer-email {
          font-size: 0.72rem;
          color: #868e96;
          margin: 2px 0 0;
        }

        .nb__drawer-guest {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #868e96;
          font-size: 0.88rem;
        }

        .nb__drawer-close {
          background: #f1f3f5;
          border: none;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #868e96;
          cursor: pointer;
          transition: var(--nb-transition);
          flex-shrink: 0;
        }

        .nb__drawer-close:hover {
          background: #e9ecef;
          color: #495057;
        }

        .nb__drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }

        .nb__drawer-auth {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .nb__drawer-auth-btn {
          flex: 1;
          text-align: center;
          padding: 10px;
          border-radius: var(--nb-radius-sm);
          font-size: 0.84rem;
          font-weight: 600;
          text-decoration: none;
          transition: var(--nb-transition);
        }

        .nb__drawer-auth-btn--login {
          color: var(--nb-gradient-start);
          border: 1.5px solid rgba(102,126,234,0.2);
          background: rgba(102,126,234,0.04);
        }

        .nb__drawer-auth-btn--login:hover {
          background: rgba(102,126,234,0.08);
          border-color: rgba(102,126,234,0.35);
        }

        .nb__drawer-auth-btn--register {
          color: #fff;
          background: var(--nb-gradient);
          border: none;
          box-shadow: 0 2px 8px rgba(102,126,234,0.25);
        }

        .nb__drawer-auth-btn--register:hover {
          box-shadow: 0 4px 16px rgba(102,126,234,0.4);
          transform: translateY(-1px);
        }

        .nb__drawer-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .nb__drawer-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: var(--nb-radius-sm);
          color: #495057;
          text-decoration: none;
          font-size: 0.88rem;
          font-weight: 500;
          transition: var(--nb-transition);
        }

        .nb__drawer-link:hover {
          background: rgba(102,126,234,0.06);
          color: var(--nb-gradient-start);
        }

        .nb__drawer-link-arrow {
          margin-left: auto;
          opacity: 0.3;
          transition: var(--nb-transition);
        }

        .nb__drawer-link:hover .nb__drawer-link-arrow {
          opacity: 0.7;
          transform: translateX(2px);
        }

        .nb__drawer-footer {
          padding: 16px 12px;
          border-top: 1px solid #f1f3f5;
          margin-top: auto;
        }

        .nb__drawer-logout {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 10px;
          border-radius: var(--nb-radius-sm);
          background: rgba(232, 89, 12, 0.05);
          border: 1.5px solid rgba(232, 89, 12, 0.15);
          color: #e8590c;
          font-size: 0.84rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--nb-transition);
        }

        .nb__drawer-logout:hover {
          background: rgba(232, 89, 12, 0.1);
          border-color: rgba(232, 89, 12, 0.3);
        }

        /* ═══════════════════════════════════════════
           PROFILE SHEET
           ═══════════════════════════════════════════ */

        .nb__profile-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          z-index: 1700;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          backdrop-filter: blur(4px);
        }

        .nb__profile-backdrop--visible {
          opacity: 1;
          visibility: visible;
        }

        .nb__profile-sheet {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #fff;
          z-index: 1800;
          border-radius: 24px 24px 0 0;
          transform: translateY(100%);
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 -8px 40px rgba(0,0,0,0.12);
          max-height: 85vh;
          overflow-y: auto;
          padding-bottom: env(safe-area-inset-bottom, 20px);
        }

        .nb__profile-sheet--open {
          transform: translateY(0);
        }

        .nb__profile-sheet__handle {
          width: 40px;
          height: 4px;
          border-radius: 4px;
          background: #dee2e6;
          margin: 12px auto 0;
        }

        .nb__profile-sheet__header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 24px 16px;
          border-bottom: 1px solid #f1f3f5;
        }

        .nb__profile-sheet__info h3 {
          font-size: 1.05rem;
          font-weight: 700;
          margin: 0;
          color: #1a1a2e;
          line-height: 1.2;
        }

        .nb__profile-sheet__info p {
          font-size: 0.78rem;
          color: #868e96;
          margin: 3px 0 0;
        }

        .nb__profile-sheet__badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 10px;
          border-radius: 50px;
          background: var(--nb-gradient);
          color: #fff;
          font-size: 0.68rem;
          font-weight: 700;
          margin-top: 6px;
          box-shadow: 0 2px 8px rgba(102,126,234,0.3);
        }

        .nb__profile-sheet__links {
          padding: 8px 12px;
        }

        .nb__profile-sheet__links a {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px;
          border-radius: var(--nb-radius-sm);
          color: #495057;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: var(--nb-transition);
        }

        .nb__profile-sheet__links a:hover {
          background: rgba(102,126,234,0.06);
          color: var(--nb-gradient-start);
        }

        .nb__profile-sheet__links a > :last-child {
          margin-left: auto;
          opacity: 0.3;
        }

        .nb__profile-sheet__links a:hover > :last-child {
          opacity: 0.6;
        }

        .nb__profile-sheet__admin {
          color: var(--nb-gradient-end) !important;
          font-weight: 600 !important;
        }

        .nb__profile-sheet__admin:hover {
          background: rgba(118,75,162,0.06) !important;
        }

        .nb__profile-sheet__logout {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: calc(100% - 24px);
          margin: 8px 12px 16px;
          padding: 12px;
          border-radius: var(--nb-radius-sm);
          background: rgba(232, 89, 12, 0.05);
          border: 1.5px solid rgba(232, 89, 12, 0.12);
          color: #e8590c;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--nb-transition);
        }

        .nb__profile-sheet__logout:hover {
          background: rgba(232, 89, 12, 0.1);
          border-color: rgba(232, 89, 12, 0.25);
        }

        /* ═══════════════════════════════════════════
           BOTTOM NAV
           ═══════════════════════════════════════════ */

        .nb__bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          z-index: 1040;
          display: flex;
          align-items: stretch;
          justify-content: space-around;
          padding: 6px 8px;
          padding-bottom: calc(6px + env(safe-area-inset-bottom, 0px));
          box-shadow: 0 -2px 16px rgba(0,0,0,0.04);
        }

        .nb__bottom-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          text-decoration: none;
          color: #868e96;
          font-size: 0.62rem;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: var(--nb-radius-sm);
          transition: all 0.25s ease;
          background: none;
          border: none;
          cursor: pointer;
          position: relative;
        }

        .nb__bottom-item:hover,
        .nb__bottom-item.active {
          color: var(--nb-gradient-start);
        }

        .nb__bottom-icon-wrap {
          position: relative;
          width: 36px;
          height: 36px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
        }

        .nb__bottom-item:hover .nb__bottom-icon-wrap,
        .nb__bottom-item.active .nb__bottom-icon-wrap {
          background: rgba(102,126,234,0.1);
        }

        .nb__bottom-item--cart .nb__bottom-icon-wrap {
          background: var(--nb-gradient);
          color: #fff;
          box-shadow: 0 3px 12px rgba(102,126,234,0.3);
        }

        .nb__bottom-item--cart:hover .nb__bottom-icon-wrap,
        .nb__bottom-item--cart.active .nb__bottom-icon-wrap {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102,126,234,0.4);
        }

        .nb__badge--bottom {
          top: -3px;
          right: -5px;
          min-width: 16px;
          height: 16px;
          font-size: 0.56rem;
          padding: 0 3px;
          border-width: 1.5px;
          border-color: #fff;
        }

        /* ═══════════════════════════════════════════
           RESPONSIVE
           ═══════════════════════════════════════════ */

        @media (max-width: 991.98px) {
          .nb__actions {
            display: none;
          }

          .nb__search {
            display: none;
          }

          .nb__mobile-actions {
            display: flex;
          }

          .nb__logo-img-wrapper {
            width: 42px;
            height: 42px;
          }

          .nb__logo-name {
            font-size: 1.15rem;
          }

          .nb__logo-tagline {
            font-size: 0.62rem;
          }

          .nb__logo-badge-dot {
            width: 10px;
            height: 10px;
          }
        }

        @media (max-width: 767.98px) {
          .nb__topbar {
            display: none;
          }

          .nb__main-inner {
            padding: 8px 12px;
            gap: 8px;
            height: 58px;
          }

          .nb__logo-text-group {
            display: flex;
          }

          .nb__logo-tagline {
            display: none;
          }

          .nb__logo-name {
            font-size: 1.05rem;
          }

          .nb__logo-img-wrapper {
            width: 36px;
            height: 36px;
            padding: 0;
          }

          .nb__logo-img-wrapper img {
            border-radius: 0;
          }

          .nb__logo-badge-dot {
            width: 8px;
            height: 8px;
            border-width: 2px;
            top: -1px;
            right: -1px;
          }

          .nb__mobile-icon {
            width: 38px;
            height: 38px;
            border-radius: 10px;
          }

          .nb__bottom-nav {
            padding: 4px 4px;
            padding-bottom: calc(4px + env(safe-area-inset-bottom, 0px));
          }

          .nb__bottom-item {
            padding: 2px 8px;
            font-size: 0.6rem;
          }

          .nb__bottom-icon-wrap {
            width: 34px;
            height: 34px;
            border-radius: 10px;
          }
        }

        @media (min-width: 992px) {
          .nb__bottom-nav {
            display: none;
          }
        }
      `}</style>

      <header>
        {/* TOP BAR */}
        <div className="nb__topbar">
          <div className="nb__topbar-inner">
            <Link to="/products" className="nb__topbar-link">
              <Icon icon="lucide:store" width={13} />
              <span>Sell on {companyName}</span>
            </Link>

            <div className="nb__topbar-right">
              <Link to="/help" className="nb__topbar-link">
                <Icon icon="lucide:help-circle" width={13} />
                <span>Help & FAQ</span>
              </Link>

              <Link to="/track-order" className="nb__topbar-link">
                <Icon icon="lucide:map-pin" width={13} />
                <span>Track Order</span>
              </Link>

              {user && (
                <Link to="/rewards" className="nb__topbar-link">
                  <Icon icon="lucide:coins" width={13} />
                  <span>Coins</span>
                </Link>
              )}

              {user ? (
                <div className="nb__user-dropdown" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdown(!dropdown)}
                    className={`nb__user-btn ${dropdown ? "nb__user-btn--active" : ""}`}
                  >
                    <div className="nb__avatar nb__avatar--topbar">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>

                    <span>
                      Hi, {user.name?.split(" ")[0] || "User"}
                    </span>

                    <Icon
                      icon="lucide:chevron-down"
                      width={14}
                      className={`nb__user-caret ${dropdown ? "nb__user-caret--open" : ""}`}
                    />
                  </button>

                  <div
                    className={`nb__dropdown ${dropdown ? "nb__dropdown--open" : ""}`}
                    role="menu"
                  >
                    <div className="nb__dropdown-header">
                      <div className="nb__avatar nb__avatar--lg">
                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>

                      <div>
                        <p className="nb__dropdown-name">{user.name}</p>
                        <p className="nb__dropdown-email">{user.email}</p>
                      </div>
                    </div>

                    <div className="nb__dropdown-divider" />

                    <Link
                      to="/profile"
                      onClick={() => setDropdown(false)}
                      className="nb__dropdown-item"
                    >
                      <Icon icon="lucide:user" width={16} />
                      <span>My Account</span>
                    </Link>

                    <Link
                      to="/track-order"
                      onClick={() => setDropdown(false)}
                      className="nb__dropdown-item"
                    >
                      <Icon icon="lucide:map-pin" width={16} />
                      <span>Track Order</span>
                    </Link>

                    <Link
                      to="/my-orders"
                      onClick={() => setDropdown(false)}
                      className="nb__dropdown-item"
                    >
                      <Icon icon="lucide:package" width={16} />
                      <span>My Orders</span>
                    </Link>

                    <Link
                      to="/cart"
                      onClick={() => setDropdown(false)}
                      className="nb__dropdown-item"
                    >
                      <Icon icon="lucide:shopping-cart" width={16} />
                      <span>My Cart ({totalQty})</span>
                    </Link>

                    <Link
                      to="/rewards"
                      onClick={() => setDropdown(false)}
                      className="nb__dropdown-item"
                    >
                      <Icon icon="lucide:coins" width={16} />
                      <span>Coins</span>
                    </Link>

                    {canAccessAdmin && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setDropdown(false)}
                        className="nb__dropdown-item nb__dropdown-item--admin"
                      >
                        <Icon icon="lucide:layout-dashboard" width={16} />
                        <span>Admin Panel</span>
                      </Link>
                    )}

                    <div className="nb__dropdown-divider" />

                    <button
                      onClick={handleLogout}
                      className="nb__dropdown-item nb__dropdown-item--logout"
                    >
                      <Icon icon="lucide:log-out" width={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="nb__auth-links">
                  <Link
                    to="/login"
                    className="nb__auth-link nb__auth-link--login"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    className="nb__auth-link nb__auth-link--register"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MAIN NAV */}
        <div
          className={`nb__main ${scrolled ? "nb--scrolled" : ""} ${
            showMobileSearch ? "nb--search-active" : ""
          }`}
        >
          <div className="nb__main-inner">

            {/* PERMANENT LOGO */}
            <Link to="/" className="nb__logo">
              <div className="nb__logo-img-wrapper">
                <img
                  src={permanentLogo}
                  alt={companyName}
                  className="nb__permanent-logo"
                />

                <div className="nb__logo-badge-dot"></div>
              </div>

              <div className="nb__logo-text-group">
                <span className="nb__logo-name">{companyName}</span>
                <span className="nb__logo-tagline">{companyTagline}</span>
              </div>
            </Link>

            {/* SEARCH */}
            <form className="nb__search" onSubmit={handleSearch}>
              <div
                className={`nb__search-wrap ${
                  searchFocused ? "nb__search-wrap--focused" : ""
                }`}
              >
                <Icon
                  icon="lucide:search"
                  width={18}
                  className="nb__search-icon"
                />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder={`Search ${companyName}...`}
                  className="nb__search-input"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="nb__search-clear"
                  >
                    <Icon icon="lucide:x" width={14} />
                  </button>
                )}

                <button type="submit" className="nb__search-btn">
                  Search
                </button>
              </div>
            </form>

            {/* DESKTOP ACTIONS */}
            <div className="nb__actions">
              {user && (
                <Link to="/rewards" className="nb__action">
                  <div className="nb__action-icon">
                    <Icon icon="lucide:coins" width={20} />
                  </div>
                  <span className="nb__action-label">Coins</span>
                </Link>
              )}

              <Link to="/wishlist" className="nb__action">
                <div className="nb__action-icon">
                  <Icon icon="lucide:heart" width={20} />
                </div>
                <span className="nb__action-label">Wishlist</span>
              </Link>

              <Link to="/cart" className="nb__action">
                <div className="nb__action-icon">
                  <Icon icon="lucide:shopping-cart" width={20} />
                  {totalQty > 0 && (
                    <span className="nb__badge">{totalQty}</span>
                  )}
                </div>
                <span className="nb__action-label">Cart</span>
              </Link>
            </div>

            {/* MOBILE ACTIONS */}
            <div className="nb__mobile-actions">
              <button
                onClick={() => setShowMobileSearch(true)}
                className="nb__mobile-icon"
              >
                <Icon icon="lucide:search" width={20} />
              </button>

              <Link to="/cart" className="nb__mobile-icon">
                <Icon icon="lucide:shopping-cart" width={20} />

                {totalQty > 0 && (
                  <span className="nb__badge nb__badge--mobile">
                    {totalQty}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setMobileMenu(true)}
                className="nb__mobile-icon"
              >
                <Icon icon="lucide:menu" width={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE SEARCH OVERLAY */}
      <div
        className={`nb__mobile-search-overlay ${
          showMobileSearch ? "nb__mobile-search-overlay--open" : ""
        }`}
      >
        <div className="nb__mobile-search-bar">
          <button
            onClick={() => setShowMobileSearch(false)}
            className="nb__mobile-search-back"
          >
            <Icon icon="lucide:arrow-left" width={22} />
          </button>

          <form
            className="nb__mobile-search-form"
            onSubmit={handleSearch}
          >
            <Icon
              icon="lucide:search"
              width={18}
              className="nb__mobile-search-icon"
            />

            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${companyName}...`}
              className="nb__mobile-search-input"
            />
          </form>
        </div>

        <div className="nb__mobile-search-body">
          <p className="nb__search-suggestions__title">
            Popular Searches
          </p>

          <div className="nb__search-suggestions__list">
            {["iPhone 15", "Samsung Galaxy", "AirPods", "Laptop", "Nike Shoes"].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setSearchQuery(t);
                  navigate(`/?search=${encodeURIComponent(t)}`);
                  setShowMobileSearch(false);
                }}
                className="nb__search-suggestion-chip"
              >
                <Icon icon="lucide:trending-up" width={13} />
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <div
        className={`nb__backdrop ${
          mobileMenu ? "nb__backdrop--visible" : ""
        }`}
        onClick={closeMobile}
      />

      <div
        className={`nb__drawer ${
          mobileMenu ? "nb__drawer--open" : ""
        }`}
      >
        <div className="nb__drawer-header">
          {user ? (
            <div
              className="nb__drawer-user"
              onClick={() => {
                closeMobile();
                setProfileSheet(true);
              }}
            >
              <div className="nb__avatar nb__avatar--xl">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div>
                <p className="nb__drawer-name">{user.name}</p>
                <p className="nb__drawer-email">{user.email}</p>
              </div>

              <Icon
                icon="lucide:chevron-right"
                width={16}
                style={{ color: "#999", marginLeft: "auto" }}
              />
            </div>
          ) : (
            <div className="nb__drawer-guest">
              <Icon icon="lucide:user-circle" width={32} />
              <span>Welcome, Guest</span>
            </div>
          )}

          <button
            onClick={closeMobile}
            className="nb__drawer-close"
          >
            <Icon icon="lucide:x" width={18} />
          </button>
        </div>

        <div className="nb__drawer-body">
          {!user && (
            <div className="nb__drawer-auth">
              <Link
                to="/login"
                onClick={closeMobile}
                className="nb__drawer-auth-btn nb__drawer-auth-btn--login"
              >
                Login
              </Link>

              <Link
                to="/register"
                onClick={closeMobile}
                className="nb__drawer-auth-btn nb__drawer-auth-btn--register"
              >
                Sign Up
              </Link>
            </div>
          )}

          <nav className="nb__drawer-nav">
            <Link
              to="/"
              onClick={closeMobile}
              className="nb__drawer-link"
            >
              <Icon icon="lucide:home" width={19} />
              <span>Home</span>
              <Icon
                icon="lucide:chevron-right"
                width={16}
                className="nb__drawer-link-arrow"
              />
            </Link>

            <Link
              to="/products"
              onClick={closeMobile}
              className="nb__drawer-link"
            >
              <Icon icon="lucide:grid-3x3" width={19} />
              <span>All Products</span>
              <Icon
                icon="lucide:chevron-right"
                width={16}
                className="nb__drawer-link-arrow"
              />
            </Link>

            <Link
              to="/track-order"
              onClick={closeMobile}
              className="nb__drawer-link"
            >
              <Icon icon="lucide:map-pin" width={19} />
              <span>Track Order</span>
              <Icon
                icon="lucide:chevron-right"
                width={16}
                className="nb__drawer-link-arrow"
              />
            </Link>

            <Link
              to="/my-orders"
              onClick={closeMobile}
              className="nb__drawer-link"
            >
              <Icon icon="lucide:package" width={19} />
              <span>My Orders</span>
              <Icon
                icon="lucide:chevron-right"
                width={16}
                className="nb__drawer-link-arrow"
              />
            </Link>

            <Link
              to="/cart"
              onClick={closeMobile}
              className="nb__drawer-link"
            >
              <Icon icon="lucide:shopping-cart" width={19} />
              <span>My Cart ({totalQty})</span>
              <Icon
                icon="lucide:chevron-right"
                width={16}
                className="nb__drawer-link-arrow"
              />
            </Link>

            {user && (
              <Link
                to="/rewards"
                onClick={closeMobile}
                className="nb__drawer-link"
              >
                <Icon icon="lucide:coins" width={19} />
                <span>Coins</span>
                <Icon
                  icon="lucide:chevron-right"
                  width={16}
                  className="nb__drawer-link-arrow"
                />
              </Link>
            )}

            <Link
              to="/help"
              onClick={closeMobile}
              className="nb__drawer-link"
            >
              <Icon icon="lucide:help-circle" width={19} />
              <span>Help Center</span>
              <Icon
                icon="lucide:chevron-right"
                width={16}
                className="nb__drawer-link-arrow"
              />
            </Link>

            {canAccessAdmin && (
              <Link
                to="/admin/dashboard"
                onClick={closeMobile}
                className="nb__drawer-link"
              >
                <Icon icon="lucide:layout-dashboard" width={19} />
                <span>Admin Panel</span>
                <Icon
                  icon="lucide:chevron-right"
                  width={16}
                  className="nb__drawer-link-arrow"
                />
              </Link>
            )}
          </nav>

          {user && (
            <div className="nb__drawer-footer">
              <button
                onClick={() => {
                  handleLogout();
                  closeMobile();
                }}
                className="nb__drawer-logout"
              >
                <Icon icon="lucide:log-out" width={18} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PROFILE SHEET */}
      {user && (
        <>
          <div
            className={`nb__profile-backdrop ${
              profileSheet ? "nb__profile-backdrop--visible" : ""
            }`}
            onClick={() => setProfileSheet(false)}
          />

          <div
            className={`nb__profile-sheet ${
              profileSheet ? "nb__profile-sheet--open" : ""
            }`}
          >
            <div className="nb__profile-sheet__handle" />

            <div className="nb__profile-sheet__header">
              <div className="nb__avatar nb__avatar--xxl">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div className="nb__profile-sheet__info">
                <h3>{user.name}</h3>
                <p>{user.email}</p>

                {canAccessAdmin && (
                  <span className="nb__profile-sheet__badge">
                    <Icon
                      icon={
                        user.role === "admin"
                          ? "lucide:shield-check"
                          : "lucide:briefcase"
                      }
                      width={12}
                    />
                    {user.role === "admin" ? "Admin" : "Sales Rep"}
                  </span>
                )}
              </div>
            </div>

            <div className="nb__profile-sheet__links">
              <Link
                to="/profile"
                onClick={() => setProfileSheet(false)}
              >
                <Icon icon="lucide:user" width={20} />
                <span>My Profile</span>
                <Icon icon="lucide:chevron-right" width={18} />
              </Link>

              <Link
                to="/track-order"
                onClick={() => setProfileSheet(false)}
              >
                <Icon icon="lucide:map-pin" width={20} />
                <span>Track Order</span>
                <Icon icon="lucide:chevron-right" width={18} />
              </Link>

              <Link
                to="/my-orders"
                onClick={() => setProfileSheet(false)}
              >
                <Icon icon="lucide:package" width={20} />
                <span>My Orders</span>
                <Icon icon="lucide:chevron-right" width={18} />
              </Link>

              <Link
                to="/cart"
                onClick={() => setProfileSheet(false)}
              >
                <Icon icon="lucide:shopping-cart" width={20} />
                <span>My Cart ({totalQty})</span>
                <Icon icon="lucide:chevron-right" width={18} />
              </Link>

              <Link
                to="/rewards"
                onClick={() => setProfileSheet(false)}
              >
                <Icon icon="lucide:coins" width={20} />
                <span>Coins (<Point />)</span>
                <Icon icon="lucide:chevron-right" width={18} />
              </Link>

              {canAccessAdmin && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setProfileSheet(false)}
                  className="nb__profile-sheet__admin"
                >
                  <Icon icon="lucide:layout-dashboard" width={20} />
                  <span>Admin Dashboard</span>
                  <Icon icon="lucide:chevron-right" width={18} />
                </Link>
              )}
            </div>

            <button
              onClick={() => {
                handleLogout();
                setProfileSheet(false);
              }}
              className="nb__profile-sheet__logout"
            >
              <Icon icon="lucide:log-out" width={20} />
              Sign Out
            </button>
          </div>
        </>
      )}

      {/* BOTTOM NAV */}
      <nav className="nb__bottom-nav">
        <Link to="/" className="nb__bottom-item">
          <div className="nb__bottom-icon-wrap">
            <Icon icon="lucide:home" width={21} />
          </div>
          <span>Home</span>
        </Link>

        <Link to="/products" className="nb__bottom-item">
          <div className="nb__bottom-icon-wrap">
            <Icon icon="lucide:grid-3x3" width={21} />
          </div>
          <span>Categories</span>
        </Link>

        {user && (
          <Link to="/rewards" className="nb__bottom-item">
            <div className="nb__bottom-icon-wrap">
              <Icon icon="lucide:coins" width={21} />
            </div>
            <span>Coins</span>
          </Link>
        )}

        <Link
          to="/cart"
          className="nb__bottom-item nb__bottom-item--cart"
        >
          <div className="nb__bottom-icon-wrap">
            <Icon icon="lucide:shopping-cart" width={21} />

            {totalQty > 0 && (
              <span className="nb__badge nb__badge--bottom">
                {totalQty}
              </span>
            )}
          </div>
          <span>Cart</span>
        </Link>

        {user ? (
          <button
            onClick={() => setProfileSheet(true)}
            className="nb__bottom-item"
          >
            <div className="nb__bottom-icon-wrap">
              <Icon icon="lucide:user-circle" width={21} />
            </div>
            <span>Account</span>
          </button>
        ) : (
          <Link to="/login" className="nb__bottom-item">
            <div className="nb__bottom-icon-wrap">
              <Icon icon="lucide:log-in" width={21} />
            </div>
            <span>Login</span>
          </Link>
        )}
      </nav>
    </>
  );
}
