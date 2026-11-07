import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import "./Home.css";
import divineVineLogo from "../assets/Divine Vine edo logo.png"; // bundled brand logo (remove its background with remove_logo_bg.py)

const DEFAULT_SLIDES = [
  { bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", tag: "SOLAR MEGA SALE", title: "Up to 40% OFF", sub: "On inverters, batteries & panels", price: "Prices from ₦65,000", img: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80" },
  { bg: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)", tag: "POWER WEEK", title: "Hybrid Inverters", sub: "Beat the blackout — top brands in stock", price: "Starting from ₦250,000", img: "https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=800&q=80" },
  { bg: "linear-gradient(135deg, #059669 0%, #10b981 100%)", tag: "NEW ARRIVALS", title: "Lithium Batteries", sub: "LiFePO4 storage, 10-year design life", price: "From ₦350,000", img: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80" },
  { bg: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)", tag: "COMPLETE KITS", title: "Home Solar Systems", sub: "Panels, inverter & battery bundled", price: "From ₦1,500,000", img: "https://images.unsplash.com/photo-1611365892117-00ac5ef43c90?w=800&q=80" },
];

const DEFAULT_SIDE_PROMOS = [
  { bg: "linear-gradient(135deg, #e9e9f1, #2d3436)", tag: "Official Store", title: "Growatt", price: "From ₦250k", img: "https://images.unsplash.com/photo-1545209463-e2825498edbf?w=200&q=80" },
  { bg: "linear-gradient(135deg, #0284c7, #38bdf8)", tag: "Power Week", title: "Hybrid Inverters", price: "From ₦250k", img: "https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=200&q=80" },
  { bg: "linear-gradient(135deg, #059669, #34d399)", tag: "Long Life Cells", title: "Lithium Batteries", price: "From ₦350k", img: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=200&q=80" },
];

const DEFAULT_SERVICES = [
  { icon: "lucide:truck", label: "Free Delivery", sub: "Orders ₦15k+" },
  { icon: "lucide:rotate-ccw", label: "Free Returns", sub: "Within 30 days" },
  { icon: "lucide:shield-check", label: "Secure Payment", sub: "100% protected" },
  { icon: "lucide:headphones", label: "24/7 Support", sub: "Dedicated help" },
];

const DEFAULT_SEARCHES = [
  { term: "5.5kW Inverter", price: "From ₦450k" }, { term: "Lithium Battery", price: "From ₦350k" },
  { term: "Solar Panel 450W", price: "From ₦75k" }, { term: "Hybrid Inverter", price: "From ₦550k" },
  { term: "Tubular Battery", price: "From ₦180k" }, { term: "MPPT Controller", price: "From ₦65k" },
  { term: "Solar Freezer", price: "From ₦450k" }, { term: "Street Light", price: "From ₦45k" },
  { term: "Solar Water Pump", price: "From ₦250k" }, { term: "Mounting Kit", price: "From ₦15k" },
  { term: "AVR Stabilizer", price: "From ₦45k" }, { term: "Changeover Switch", price: "From ₦25k" },
  { term: "Complete Solar Kit", price: "From ₦1.5M" },
];

const DEFAULT_STORES = [
  { name: "Growatt", color: "#f47b20", price: "₦250k – ₦1.5M", initial: "G" },
  { name: "Deye", color: "#14477d", price: "₦350k – ₦2M", initial: "D" },
  { name: "Felicity", color: "#00a651", price: "₦180k – ₦900k", initial: "F" },
  { name: "Luminous", color: "#d71920", price: "₦120k – ₦600k", initial: "L" },
  { name: "Pylontech", color: "#1b3a6b", price: "₦450k – ₦1.8M", initial: "P" },
  { name: "Must Power", color: "#ea580c", price: "₦150k – ₦800k", initial: "M" },
  { name: "SRNE", color: "#0d7fc4", price: "₦120k – ₦700k", initial: "S" },
  { name: "Mercury", color: "#00838f", price: "₦90k – ₦450k", initial: "M" },
  { name: "Su-Kam", color: "#0057b8", price: "₦100k – ₦500k", initial: "S" },
  { name: "Eastman", color: "#455a64", price: "₦60k – ₦300k", initial: "E" },
];

const SUBCATEGORY_ICON_MAP = {
  "Hybrid Inverters": "lucide:zap", "Off-Grid Inverters": "lucide:plug-zap", "Grid-Tied Inverters": "lucide:plug",
  "Pure Sine Inverters": "lucide:activity", "Inverters": "lucide:zap", "Inverter Chargers": "lucide:battery-charging",
  "Lithium Batteries": "lucide:battery-charging", "LiFePO4 Batteries": "lucide:battery-charging", "Tubular Batteries": "lucide:battery-full",
  "Gel Batteries": "lucide:battery-medium", "AGM Batteries": "lucide:battery-medium", "Battery Racks & Cabinets": "lucide:archive",
  "Solar Panels": "lucide:sun", "Monocrystalline Panels": "lucide:sun", "Polycrystalline Panels": "lucide:sun-dim",
  "Portable Panels": "lucide:sun-medium", "Charge Controllers": "lucide:cpu", "MPPT Controllers": "lucide:gauge",
  "PWM Controllers": "lucide:sliders-horizontal", "Mounting & Racking": "lucide:wrench", "Mounting Kits": "lucide:hammer",
  "Solar Cables": "lucide:cable", "MC4 Connectors": "lucide:plug", "DC Breakers & Fuses": "lucide:shield",
  "Changeover Switches": "lucide:toggle-left", "AVR & Stabilizers": "lucide:activity", "Energy Meters": "lucide:gauge",
  "Monitoring Devices": "lucide:wifi", "Solar Kits": "lucide:package", "Complete Solar Systems": "lucide:package",
  "Solar Street Lights": "lucide:lamp", "Solar Water Heaters": "lucide:flame", "Solar Water Pumps": "lucide:droplets",
  "Solar Freezers": "lucide:snowflake", "Solar Fans": "lucide:fan", "Inverter Accessories": "lucide:settings",
};

// ═══════ Pure helper functions ═══════
const parseBool = (val) => {
  if (val === true || val === 1 || val === "true" || val === "1") return true;
  return false;
};

const discountPct = (p) => {
  if (!p.discountPrice || !p.price) return null;
  return Math.round(((p.price - p.discountPrice) / p.price) * 100);
};

const pad = (n) => String(n).padStart(2, "0");

const getSubIcon = (subName) => SUBCATEGORY_ICON_MAP[subName] || "lucide:tag";

const calcMargin = (p) => {
  const engPrice = p.engineeringPrice ? Number(p.engineeringPrice) : 0;
  const sellPrice = p.discountPrice ? Number(p.discountPrice) : Number(p.price) || 0;
  if (engPrice <= 0 || sellPrice <= 0) return null;
  const marginAmt = sellPrice - engPrice;
  const marginPct = ((marginAmt / sellPrice) * 100).toFixed(1);
  return { amount: marginAmt, pct: marginPct };
};

const formatEngPrice = (p, currency = "₦") => {
  if (!p.engineeringPrice) return null;
  return `${currency}${Number(p.engineeringPrice).toLocaleString()}`;
};

const getProductImages = (p) => {
  if (Array.isArray(p.images) && p.images.length > 0) {
    const valid = p.images.filter((img) => img && img.trim());
    if (valid.length > 0) return valid;
  }
  if (p.image && p.image.trim()) return [p.image];
  return [];
};

const getPrimaryImage = (p, fallback = "") => {
  const imgs = getProductImages(p);
  return imgs.length > 0 ? imgs[0] : fallback;
};

const priceRange = (items, currency) => {
  if (!items.length) return "";
  const prices = items.map((i) => i.price || 0).filter(Boolean);
  if (!prices.length) return "";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `${currency}${min.toLocaleString()}` : `${currency}${min.toLocaleString()} – ${currency}${max.toLocaleString()}`;
};

// ═══════ DropdownProductPreview ═══════
const DropdownProductPreview = ({ p, currency, onClose, canSeeEngPricing }) => {
  const pct = discountPct(p);
  const margin = canSeeEngPricing ? calcMargin(p) : null;

  return (
    <Link to={`/product/${p._id}`} className="jm-mega-product" onClick={onClose}>
      <div className="jm-mega-product__img-wrap">
        <img src={getPrimaryImage(p, `https://picsum.photos/seed/mega${p._id}/120/120`)} alt={p.name} loading="lazy" />
        {pct && <span className="jm-mega-product__badge">-{pct}%</span>}
      </div>
      <div className="jm-mega-product__info">
        <span className="jm-mega-product__name">{p.name}</span>
        <div className="jm-mega-product__prices">
          <span className="jm-mega-product__price">{currency}{(p.discountPrice || p.price)?.toLocaleString()}</span>
          {p.discountPrice && p.price && (
            <span className="jm-mega-product__old">{currency}{p.price.toLocaleString()}</span>
          )}
        </div>
        {canSeeEngPricing && margin && (
          <span className="jm-mega-product__margin" style={{ color: margin.amount >= 0 ? "#2b8a3e" : "#e03131" }}>
            M: {currency}{margin.amount.toLocaleString()} ({margin.pct}%)
          </span>
        )}
      </div>
    </Link>
  );
};

// ═══════ ProductCard ═══════
const ProductCard = ({ p, prefix = "", showProgress = false, showNew = false, compact = false, flash = false, currency, cartQty, isSyncing, onAddToCart, canSeeEngPricing }) => {
  const [imgIndex, setImgIndex] = useState(0);
  const allImages = getProductImages(p);
  const hasMultiple = allImages.length > 1;
  const currentImg = allImages[imgIndex] || `https://picsum.photos/seed/${prefix}${p._id}/300/300`;

  const pct = discountPct(p);
  const itemsLeft = p.countInStock ?? 0;
  const totalStock = p.totalStock ?? p.initialStock ?? null;
  const soldCount = p.soldCount ?? null;
  const soldPct = soldCount != null && totalStock && totalStock > 0
    ? Math.min(100, Math.max(0, Math.round((soldCount / totalStock) * 100)))
    : totalStock != null && totalStock > 0
      ? Math.min(100, Math.max(0, Math.round(((totalStock - itemsLeft) / totalStock) * 100)))
      : 0;
  const isOutOfStock = p.countInStock === 0;
  const isMaxStock = p.countInStock > 0 && cartQty >= p.countInStock;

  const engPriceFormatted = canSeeEngPricing ? formatEngPrice(p, currency) : null;
  const margin = canSeeEngPricing ? calcMargin(p) : null;

  const handlePrevImg = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleNextImg = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((prev) => (prev + 1) % allImages.length);
  };

  return (
    <Link
      to={`/product/${p._id}`}
      className={`jm-product-card ${compact ? "jm-product-card--compact" : ""} ${flash ? "jm-product-card--flash" : ""}`}
      onClick={(e) => {
        if (e.target.closest('.jm-product-card__cart-action') || e.target.closest('.jm-product-card__img-nav')) {
          e.preventDefault();
        }
      }}
    >
      <div className="jm-product-card__img-wrap">
        {pct && <span className="jm-discount-badge" style={flash ? { color: "#fff", background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)" } : undefined}>-{pct}%</span>}
        {showNew && <span className="jm-new-badge">NEW</span>}
        {isOutOfStock && <span className="jm-oos-badge">OUT OF STOCK</span>}
        <img src={currentImg} alt={p.name} className="jm-product-card__img" loading="lazy" />

        {hasMultiple && (
          <>
            <button type="button" className="jm-product-card__img-nav jm-product-card__img-nav--prev" onClick={handlePrevImg} aria-label="Previous image">
              <Icon icon="lucide:chevron-left" width={14} />
            </button>
            <button type="button" className="jm-product-card__img-nav jm-product-card__img-nav--next" onClick={handleNextImg} aria-label="Next image">
              <Icon icon="lucide:chevron-right" width={14} />
            </button>
            <span className="jm-product-card__img-counter">{imgIndex + 1}/{allImages.length}</span>
            <div className="jm-product-card__img-dots">
              {allImages.map((_, dotIdx) => (
                <span key={dotIdx} className={`jm-product-card__img-dot ${dotIdx === imgIndex ? "jm-product-card__img-dot--active" : ""}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImgIndex(dotIdx); }} />
              ))}
            </div>
          </>
        )}

        <div className="jm-product-card__img-overlay" />
      </div>
      <div className="jm-product-card__info">
        <h3 className="jm-product-card__name" style={flash ? { color: "#fff" } : undefined}>{p.name}</h3>
        <div className="jm-product-card__prices">
          <span className="jm-product-card__price" style={flash ? { color: "#fff" } : undefined}>{currency}{(p.discountPrice || p.price)?.toLocaleString()}</span>
          {p.discountPrice && p.price && <span className="jm-product-card__old-price" style={flash ? { color: "rgba(255,255,255,0.55)" } : undefined}>{currency}{p.price.toLocaleString()}</span>}
        </div>
        {p.discountPrice && p.price && (
          <span className="jm-product-card__save" style={flash ? { color: "rgba(255,255,255,0.7)" } : undefined}>You save {currency}{(p.price - p.discountPrice).toLocaleString()}</span>
        )}

        {canSeeEngPricing && engPriceFormatted && (
          <div className="jm-product-card__eng-info" style={flash ? { background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.12)" } : undefined}>
            <span className="jm-product-card__eng-price" style={flash ? { color: "rgba(255,255,255,0.65)" } : undefined}>
              Eng: {engPriceFormatted}
            </span>
            {margin && (
              <span className="jm-product-card__margin" style={{ color: flash ? (margin.amount >= 0 ? "#69db7c" : "#ff8787") : (margin.amount >= 0 ? "#2b8a3e" : "#e03131") }}>
                Margin: {currency}{margin.amount.toLocaleString()} ({margin.pct}%)
              </span>
            )}
          </div>
        )}

        {showProgress && (
          <div className="jm-flash-progress">
            <div className="jm-flash-progress__bar">
              <div className="jm-flash-progress__fill" style={{ width: `${soldPct}%` }} />
            </div>
            <span className="jm-flash-progress__text" style={flash ? { color: "rgba(255,255,255,0.7)" } : undefined}>{itemsLeft} items left</span>
          </div>
        )}
        <div className="jm-product-card__cart-action">
          {isOutOfStock || isMaxStock ? (
            <span className="jm-add-to-cart-btn jm-add-to-cart-btn--disabled">{isMaxStock ? "Max Stock Reached" : "Out of Stock"}</span>
          ) : (
            <button
              className={`jm-add-to-cart-btn ${cartQty > 0 ? "jm-add-to-cart-btn--in-cart" : ""}`}
              style={flash ? { background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" } : undefined}
              onClick={(e) => onAddToCart(e, p)}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <><Icon icon="lucide:loader-2" width={14} style={{ animation: 'spin 1s linear infinite' }} /> Adding...</>
              ) : cartQty > 0 ? (
                <><Icon icon="lucide:shopping-cart" width={14} /> In Cart ({cartQty})</>
              ) : (
                <><Icon icon="lucide:plus" width={14} /> Add to Cart</>
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};

// ═══════ SkeletonCard ═══════
const SkeletonCard = () => (
  <div className="jm-skeleton-card">
    <div className="jm-skeleton jm-skeleton--img" />
    <div className="jm-skeleton jm-skeleton--text" />
    <div className="jm-skeleton jm-skeleton--text jm-skeleton--short" />
    <div className="jm-skeleton jm-skeleton--price" />
  </div>
);

// ═══════ ScrollToTop Component ═══════
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    const dashboardContainer = document.getElementById("dashboard-scroll-container");
    if (dashboardContainer) {
      dashboardContainer.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}

// ═══════ MAIN HOME COMPONENT ═══════
export default function Home() {
  const { user } = useAuth();
  const canSeeEngPricing = user?.role === "admin" || user?.role === "engineer";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ h: 8, m: 45, s: 12 });
  const [activeCat, setActiveCat] = useState("");
  const [productCategories, setProductCategories] = useState({});
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [selectedHomeCat, setSelectedHomeCat] = useState("");
  const [browseExpanded, setBrowseExpanded] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [expandedCats, setExpandedCats] = useState(new Set()); // <-- Track expanded category

  const { addToCart = () => {}, cart = [], isSyncing = false } = useCart();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeSearch = searchParams.get("search") || "";

  const companyName = siteSettings?.companyName || "Divine Vine-Edo Solar";
  const companyTagline = siteSettings?.companyTagline || "Your One-Stop Solar & Power Store";
  // Admin-set logo (Site Settings) wins; bundled Divine Vine Edo logo is the default.
  // To ALWAYS use the bundled file instead, change this line to:
  // const companyLogo = divineVineLogo;
  const companyLogo = siteSettings?.logo || divineVineLogo;
  const companyAddress = siteSettings?.address || "";
  const companyPhone = siteSettings?.phone || "";
  const companyPhone2 = siteSettings?.phone2 || "";
  const companyEmail = siteSettings?.email || "";
  const companyWhatsapp = siteSettings?.whatsapp || "";
  const companyFacebook = siteSettings?.facebook || "";
  const companyInstagram = siteSettings?.instagram || "";
  const companyTwitter = siteSettings?.twitter || "";
  const companyTiktok = siteSettings?.tiktok || "";
  const companyYoutube = siteSettings?.youtube || "";
  const currency = siteSettings?.currency || "₦";
  const freeDeliveryThreshold = siteSettings?.freeDeliveryThreshold || 15000;
  const returnDays = siteSettings?.returnDays || 30;
  const supportHours = siteSettings?.supportHours || "24/7";
  const footerText = siteSettings?.footerText || `© ${new Date().getFullYear()} ${companyName}. All rights reserved.`;
  const appStoreLink = siteSettings?.appStoreLink || "#";
  const googlePlayLink = siteSettings?.googlePlayLink || "#";
  const aboutUs = siteSettings?.aboutUs || "";

  const heroSlides = messages.length > 0
    ? messages.map(m => ({
        bg: m.bg,
        tag: m.tag,
        title: m.title,
        sub: m.sub,
        price: m.price,
        img: m.img,
        link: m.link || "/products",
      }))
    : siteSettings?.heroSlides?.length > 0
      ? siteSettings.heroSlides
      : DEFAULT_SLIDES;

  const sidePromos = siteSettings?.sidePromos?.length > 0 ? siteSettings.sidePromos : DEFAULT_SIDE_PROMOS;
  const services = siteSettings?.services?.length > 0 ? siteSettings.services : DEFAULT_SERVICES;
  const popularSearches = siteSettings?.popularSearches?.length > 0 ? siteSettings.popularSearches : DEFAULT_SEARCHES;
  const officialStores = siteSettings?.officialStores?.length > 0 ? siteSettings.officialStores : DEFAULT_STORES;

  const sidebarCategories = categories.filter(c => c.showInSidebar !== false);

  const flashSaleProducts = products.filter(p => parseBool(p.isFlashSale));
  const featuredProducts = products.filter(p => parseBool(p.isFeatured));
  const newArrivalProducts = products.filter(p => parseBool(p.isNewArrival));

  const filteredProducts = useMemo(() => {
    if (!activeSearch) return [];
    const q = activeSearch.toLowerCase();
    return products.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }, [products, activeSearch]);

  const homeCategories = useMemo(() => {
    const homeCats = categories.filter(c => c.showInHome === true);
    if (homeCats.length === 0) {
      return categories.filter(c => productCategories[c.name] && productCategories[c.name].length > 0);
    }
    return homeCats;
  }, [categories, productCategories]);

  const homeCatProducts = useMemo(() => {
    if (!selectedHomeCat) return [];
    if (selectedHomeCat === "__all__") {
      return [...products].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    }
    const prods = productCategories[selectedHomeCat] || [];
    return [...prods].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [selectedHomeCat, productCategories, products]);

  // ═══════ Toggle category expand/collapse ═══════
  const toggleCatExpand = (catName) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catName)) {
        next.delete(catName);
      } else {
        next.add(catName);
      }
      return next;
    });
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [catRes, setRes, groupedRes, msgRes] = await Promise.all([
          api.get("/categories?isActive=true&limit=1000"),
          api.get("/site-settings"),
          api.get("/products/grouped"),
          api.get("/messages?active=true"),
        ]);

        const groupedData = groupedRes.data;
        const mappedCategories = {};
        const allProducts = [];

        if (Array.isArray(groupedData)) {
          groupedData.forEach(group => {
            const catName = group._id || "Uncategorized";
            mappedCategories[catName] = group.products;
            allProducts.push(...group.products);
          });
        }

        const messagesData = msgRes.data.data || msgRes.data;

        setProducts(allProducts);
        setCategories(catRes.data.categories || catRes.data);
        setSiteSettings(setRes.data);
        setMessages(messagesData);
        setProductCategories(mappedCategories);

        const keys = Object.keys(mappedCategories);
        if (keys.length) setActiveCat(keys[0]);
        
        setSelectedHomeCat("__all__");
      } catch (error) {
        console.error("Could not fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((p) => (p + 1) % heroSlides.length);
      
      // Trigger the flash automation
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 600); // Remove class after animation completes
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getCartQty = (productId) => {
    const item = cart.find((c) => c.product === productId || c.product?._id === productId);
    return item ? item.quantity : 0;
  };

  const getCatIcon = (catName) => categories.find(c => c.name === catName)?.icon || "lucide:package";

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setShowAuthPopup(true);
      return;
    }

    const currentQty = getCartQty(product._id);
    if (product.countInStock > 0 && currentQty >= product.countInStock) return;
    try {
      await addToCart({
        _id: product._id,
        name: product.name,
        image: getPrimaryImage(product, `https://picsum.photos/seed/${product._id}/300/300`),
        price: product.discountPrice || product.price,
      }, 1);
    } catch (err) {
      console.error("Failed to add to cart:", err);
    }
  };

  const sidebarItems = sidebarCategories.length > 0
    ? sidebarCategories.map(c => ({ id: c._id, name: c.name, icon: c.icon }))
    : [];

  return (
    <div className="jm-home">
      <ScrollToTop />

      {/* ═══════ AUTH REQUIRED POPUP ═══════ */}
      {showAuthPopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
          onClick={() => setShowAuthPopup(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "36px 32px 28px",
              maxWidth: "420px",
              width: "90%",
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              animation: "authPopIn 0.25s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: companyLogo ? "#ffffff" : "linear-gradient(135deg, #16a34a 0%, #047857 100%)",
                border: companyLogo ? "2px solid #16a34a" : "2px solid transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                overflow: "hidden",
              }}
            >
              {companyLogo ? (
                <img src={companyLogo} alt={companyName} style={{ width: "48px", height: "48px", objectFit: "contain" }} />
              ) : (
                <Icon icon="lucide:user-plus" width={28} style={{ color: "#fff" }} />
              )}
            </div>
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: "1.3rem",
                fontWeight: 700,
                color: "#212529",
              }}
            >
              Create an Account First
            </h3>
            <p
              style={{
                margin: "0 0 28px",
                fontSize: "0.9rem",
                color: "#868e96",
                lineHeight: 1.5,
              }}
            >
              You need to register or log in before adding items to your cart. It only takes a moment!
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link
                to="/login"
                state={{ from: window.location.pathname + window.location.search }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "13px 0",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #16a34a 0%, #047857 100%)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  textDecoration: "none",
                  textAlign: "center",
                  letterSpacing: "0.3px",
                }}
                onClick={() => setShowAuthPopup(false)}
              >
                REGISTER / LOGIN
              </Link>
              <button
                type="button"
                onClick={() => setShowAuthPopup(false)}
                style={{
                  background: "none",
                  border: "1px solid #dee2e6",
                  borderRadius: "10px",
                  padding: "11px 0",
                  width: "100%",
                  cursor: "pointer",
                  color: "#495057",
                  fontSize: "0.88rem",
                  fontWeight: 500,
                }}
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ SEARCH RESULTS VIEW ═══════ */}
      {activeSearch ? (
        <section className="jm-section" style={{ paddingTop: "30px", minHeight: "60vh" }}>
          <div className="jm-section__header">
            <h2 className="jm-section__title">
              Search Results for "{activeSearch}"
            </h2>
            <button
              onClick={() => setSearchParams({})}
              className="jm-section__see-all"
              style={{ background: "none", border: "1px solid #ddd", padding: "6px 16px", borderRadius: "20px", cursor: "pointer" }}
            >
              CLEAR SEARCH
            </button>
          </div>

          {loading ? (
            <div className="jm-product-grid jm-product-grid--4">
              {[1,2,3,4,5,6,7,8].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="jm-product-grid jm-product-grid--4">
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p._id}
                  p={p}
                  prefix="search-"
                  currency={currency}
                  cartQty={getCartQty(p._id)}
                  isSyncing={isSyncing}
                  onAddToCart={handleAddToCart}
                  canSeeEngPricing={canSeeEngPricing}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#868e96" }}>
              <Icon icon="lucide:search-x" width={48} style={{ marginBottom: "16px", opacity: 0.4 }} />
              <h3 style={{ margin: "0 0 8px", color: "#495057" }}>No products found</h3>
              <p style={{ margin: "0 0 20px" }}>We couldn't find any products matching "{activeSearch}"</p>
              <Link to="/" className="jm-hero-cta" style={{ fontSize: "0.85rem", padding: "10px 24px" }} onClick={() => setSearchParams({})}>
                BACK TO SHOPPING
              </Link>
            </div>
          )}
        </section>
      ) : (
      <>
      {/* ═══════ NORMAL HOME PAGE CONTENT ═══════ */}

      {/* ═══════ HERO SECTION ═══════ */}
      <section className="jm-hero-section">
        <div className={`jm-hero-carousel ${isFlashing ? "jm-hero-carousel--flash" : ""}`}>
          {heroSlides.map((slide, idx) => (
            <div key={idx} className={`jm-hero-slide ${idx === currentSlide ? "jm-hero-slide--active" : ""}`}>
              <div className="jm-hero-slide__bg" style={{ background: slide.bg }} />
              {slide.img && <img src={slide.img} alt="" className="jm-hero-slide__img" loading={idx === 0 ? "eager" : "lazy"} />}
              <div className="jm-hero-slide__overlay" />
              <div className="jm-hero-slide__content">
                {slide.tag && <span className="jm-hero-tag">{slide.tag}</span>}
                <h1 className="jm-hero-title">{slide.title}</h1>
                {slide.sub && <p className="jm-hero-sub">{slide.sub}</p>}
                {slide.price && <p className="jm-hero-price">{slide.price}</p>}
                <Link to={slide.link || "/products"} className="jm-hero-cta">SHOP NOW <Icon icon="lucide:arrow-right" width={16} className="jm-hero-cta__arrow" /></Link>
              </div>
            </div>
          ))}
          
          {/* Flash Overlay Element */}
          <div className="jm-hero-flash-overlay" aria-hidden="true"></div>
          
          <button className="jm-carousel-arrow jm-carousel-arrow--prev" onClick={() => setCurrentSlide((p) => (p - 1 + heroSlides.length) % heroSlides.length)} aria-label="Previous"><Icon icon="lucide:chevron-left" width={24} /></button>
          <button className="jm-carousel-arrow jm-carousel-arrow--next" onClick={() => setCurrentSlide((p) => (p + 1) % heroSlides.length)} aria-label="Next"><Icon icon="lucide:chevron-right" width={24} /></button>
          <div className="jm-carousel-dots">
            {heroSlides.map((_, idx) => (
              <button key={idx} className={`jm-carousel-dot ${idx === currentSlide ? "jm-carousel-dot--active" : ""}`} onClick={() => setCurrentSlide(idx)} aria-label={`Slide ${idx + 1}`} />
            ))}
          </div>
        </div>

        <div className="jm-hero-stack">
          {sidePromos.map((promo, idx) => (
            <Link to={promo.link || "/products"} key={idx} className="jm-side-promo" style={{ background: promo.bg }}>
              <div className="jm-side-promo__content">
                {promo.tag && <span className="jm-side-promo__tag">{promo.tag}</span>}
                <span className="jm-side-promo__title">{promo.title}</span>
                <span className="jm-side-promo__price">{promo.price}</span>
              </div>
              {promo.img && <img src={promo.img} alt="" className="jm-side-promo__img" />}
            </Link>
          ))}
        </div>
      </section>

      {/* Mobile side promos */}
      <div className="jm-mobile-side-promos">
        {sidePromos.slice(0, 3).map((promo, idx) => (
          <Link to={promo.link || "/products"} key={idx} className="jm-mobile-side-card" style={{ background: promo.bg }}>
            <span className="jm-mobile-side-card__title">{promo.title}</span>
            <span className="jm-mobile-side-card__price">{promo.price}</span>
          </Link>
        ))}
      </div>

      {/* ═══════ SERVICES BAR ═══════ */}
      <section className="jm-services-bar">
        {services.map((s, idx) => (
          <div key={idx} className="jm-service-item">
            <div className="jm-service-item__icon"><Icon icon={s.icon} width={20} /></div>
            <div className="jm-service-item__text">
              <p className="jm-service-item__label">{s.label}</p>
              <p className="jm-service-item__sub">
                {s.label === "Free Delivery" ? `Orders ${currency}${freeDeliveryThreshold.toLocaleString()}+` :
                 s.label === "Free Returns" ? `Within ${returnDays} days` :
                 s.label === "24/7 Support" ? supportHours : s.sub}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* ═══════ BROWSE BY CATEGORY ═══════ */}
      {!loading && homeCategories.length > 0 && (
        <section className="jm-section">
          <div className="jm-section__header">
            <div className="jm-section__header-left">
              <Icon icon="lucide:layout-grid" width={18} className="jm-section__header-icon" />
              <h2 className="jm-section__title">BROWSE BY CATEGORY</h2>
            </div>
          </div>

          <div className="jm-home-cat-select-wrap">
            <div className="jm-home-cat-select__icon">
              <Icon icon={selectedHomeCat === "__all__" ? "lucide:layout-grid" : (homeCategories.find(c => c.name === selectedHomeCat)?.icon || "lucide:package")} width={18} />
            </div>
            <select
              className="jm-home-cat-select"
              value={selectedHomeCat}
              onChange={(e) => { setSelectedHomeCat(e.target.value); setBrowseExpanded(false); }}
              aria-label="Select a category"
            >
              <option value="__all__">All</option>
              {homeCategories.map((cat) => (
                <option key={cat._id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            <Icon icon="lucide:chevron-down" width={16} className="jm-home-cat-select__arrow" />
          </div>

          {selectedHomeCat && homeCatProducts.length > 0 && (
            <>
              <div className="jm-section__header" style={{ marginTop: "20px" }}>
                <div className="jm-section__header-left">
                  <div className="jm-section__cat-icon">
                    <Icon icon={selectedHomeCat === "__all__" ? "lucide:layout-grid" : (homeCategories.find(c => c.name === selectedHomeCat)?.icon || "lucide:package")} width={16} />
                  </div>
                  <div>
                    <h3 className="jm-section__subtitle">{selectedHomeCat === "__all__" ? "All Products" : selectedHomeCat}</h3>
                    <p className="jm-section__meta">{homeCatProducts.length} products · {priceRange(homeCatProducts, currency)}</p>
                  </div>
                </div>
                {homeCatProducts.length > 20 && (
                  <button
                    type="button"
                    onClick={() => setBrowseExpanded((prev) => !prev)}
                    className="jm-section__see-all"
                    style={{ background: "none", border: "none", cursor: "pointer", font: "inherit" }}
                  >
                    {browseExpanded ? "SHOW LESS" : "VIEW ALL"} <Icon icon={browseExpanded ? "lucide:chevron-up" : "lucide:chevron-right"} width={14} />
                  </button>
                )}
              </div>
              <div className="jm-product-grid jm-product-grid--4">
                {homeCatProducts.slice(0, browseExpanded ? homeCatProducts.length : 20).map((p) => (
                  <ProductCard
                    key={`homecat-${p._id}`}
                    p={p}
                    prefix="homecat-"
                    currency={currency}
                    cartQty={getCartQty(p._id)}
                    isSyncing={isSyncing}
                    onAddToCart={handleAddToCart}
                    canSeeEngPricing={canSeeEngPricing}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* ═══════ FLASH SALES ═══════ */}
      {!loading && flashSaleProducts.length > 0 && (
        <section className="jm-section jm-flash-section">
          <div className="jm-flash-header">
            <div className="jm-flash-header__left">
              <div className="jm-flash-header__icon-wrap"><Icon icon="lucide:zap" width={22} /></div>
              <div>
                <h2 className="jm-flash-header__title">FLASH SALES</h2>
                <div className="jm-flash-countdown">
                  <span className="jm-countdown-block">{pad(timeLeft.h)}</span><span className="jm-countdown-sep">:</span>
                  <span className="jm-countdown-block">{pad(timeLeft.m)}</span><span className="jm-countdown-sep">:</span>
                  <span className="jm-countdown-block">{pad(timeLeft.s)}</span>
                </div>
              </div>
            </div>
            <Link to="/products?flash=true" className="jm-section__see-all jm-section__see-all--light">SEE ALL <Icon icon="lucide:chevron-right" width={14} /></Link>
          </div>
          <div className="jm-product-grid jm-product-grid--5">
            {flashSaleProducts.slice(0, 10).map((p) => (
              <ProductCard key={p._id} p={p} prefix="flash-" showProgress flash currency={currency} cartQty={getCartQty(p._id)} isSyncing={isSyncing} onAddToCart={handleAddToCart} canSeeEngPricing={canSeeEngPricing} />
            ))}
          </div>
        </section>
      )}

      {/* ═══════ OFFICIAL STORES ═══════ */}
      <section className="jm-section">
        <div className="jm-section__header">
          <h2 className="jm-section__title">OFFICIAL STORES</h2>
          <Link to="/products?official=true" className="jm-section__see-all">SEE ALL <Icon icon="lucide:chevron-right" width={14} /></Link>
        </div>
        <div className="jm-stores-scroll">
          {officialStores.map((brand, idx) => (
            <div key={idx} className="jm-store-card">
              <div className="jm-store-card__logo" style={{ background: `${brand.color}15`, color: brand.color }}>
                {brand.image ? <img src={brand.image} alt={brand.name} className="jm-store-card__logo-img" /> : brand.initial}
              </div>
              <span className="jm-store-card__name">{brand.name}</span>
              <span className="jm-store-card__price">{brand.price}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ PROMO BANNERS ═══════ */}
      <section className="jm-promo-grid">
        <div className="jm-promo-banner">
          <img src="https://images.unsplash.com/photo-1615840287214-7ff58936c4cf?w=600&q=80" alt="" className="jm-promo-banner__img" />
          <div className="jm-promo-banner__overlay" />
          <div className="jm-promo-banner__content">
            <span className="jm-promo-banner__tag">Complete Solar Kits</span>
            <h3 className="jm-promo-banner__title">5kW Home Systems</h3>
            <p className="jm-promo-banner__sub">Starting from {currency}1,500,000</p>
            <span className="jm-promo-banner__cta">SHOP SOLAR KITS</span>
          </div>
        </div>
        <div className="jm-promo-banner">
          <img src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=80" alt="" className="jm-promo-banner__img" />
          <div className="jm-promo-banner__overlay" />
          <div className="jm-promo-banner__content">
            <span className="jm-promo-banner__tag">Lithium Deals</span>
            <h3 className="jm-promo-banner__title">LiFePO4 Batteries</h3>
            <p className="jm-promo-banner__sub">Up to 25% off — {currency}350,000 onwards</p>
            <span className="jm-promo-banner__cta jm-promo-banner__cta--white">UP TO 25% OFF</span>
          </div>
        </div>
      </section>

      {/* ═══════ TOP DEALS ═══════ */}
      {!loading && featuredProducts.length > 0 && (
        <section className="jm-section">
          <div className="jm-section__header">
            <h2 className="jm-section__title">TOP DEALS FOR YOU</h2>
            <Link to="/products?featured=true" className="jm-section__see-all">SEE ALL <Icon icon="lucide:chevron-right" width={14} /></Link>
          </div>
          <div className="jm-product-grid jm-product-grid--6">
            {featuredProducts.slice(0, 6).map((p) => (
              <ProductCard key={`deal-${p._id}`} p={p} prefix="deal-" compact currency={currency} cartQty={getCartQty(p._id)} isSyncing={isSyncing} onAddToCart={handleAddToCart} canSeeEngPricing={canSeeEngPricing} />
            ))}
          </div>
        </section>
      )}

      {/* ═══════ BIGGEST PRICE DROPS ═══════ */}
      {!loading && products.filter((p) => p.discountPrice && p.price).length > 0 && (
        <section className="jm-section">
          <div className="jm-section__header">
            <div className="jm-section__header-left">
              <Icon icon="lucide:trending-down" width={18} className="jm-section__header-icon--red" />
              <h2 className="jm-section__title">BIGGEST PRICE DROPS</h2>
            </div>
            <Link to="/products?discounted=true" className="jm-section__see-all">SEE ALL <Icon icon="lucide:chevron-right" width={14} /></Link>
          </div>
          <div className="jm-price-drop-grid">
            {products.filter((p) => p.discountPrice && p.price).sort((a, b) => ((b.price - b.discountPrice) / b.price) - ((a.price - a.discountPrice) / a.price)).slice(0, 6).map((p) => {
              const pct = discountPct(p);
              const saved = p.price - p.discountPrice;
              const dropMargin = canSeeEngPricing ? calcMargin(p) : null;
              return (
                <Link to={`/product/${p._id}`} key={`drop-${p._id}`} className="jm-price-drop-card">
                  <div className="jm-price-drop-card__img-wrap">
                    <span className="jm-price-drop-card__badge">-{pct}%</span>
                    <img src={getPrimaryImage(p, `https://picsum.photos/seed/drop${p._id}/150/150`)} alt={p.name} loading="lazy" />
                  </div>
                  <div className="jm-price-drop-card__info">
                    <h4 className="jm-price-drop-card__name">{p.name}</h4>
                    <div className="jm-price-drop-card__prices">
                      <span className="jm-price-drop-card__price">{currency}{p.discountPrice.toLocaleString()}</span>
                      <span className="jm-price-drop-card__old">{currency}{p.price.toLocaleString()}</span>
                    </div>
                    <span className="jm-price-drop-card__save">Save {currency}{saved.toLocaleString()}</span>
                    {canSeeEngPricing && dropMargin && (
                      <span className="jm-price-drop-card__margin" style={{ color: dropMargin.amount >= 0 ? "#2b8a3e" : "#e03131" }}>
                        Margin: {currency}{dropMargin.amount.toLocaleString()} ({dropMargin.pct}%)
                      </span>
                    )}
                    <div className="jm-price-drop-card__bar-wrap">
                      <div className="jm-price-drop-card__bar">
                        <div className="jm-price-drop-card__bar-fill" style={{ width: `${100 - pct}%` }} />
                      </div>
                      <span className="jm-price-drop-card__bar-text">Now {100 - pct}% of original</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══════ ALL CATEGORIES PRODUCT LIST ═══════ */}
      {!loading && Object.entries(productCategories).map(([catName, items]) => {
        const isExpanded = expandedCats.has(catName);
        const displayItems = isExpanded ? items : items.slice(0, 10);
        const hasMore = items.length > 10;

        return (
          <section key={catName} className="jm-section">
            <div className="jm-section__header">
              <div className="jm-section__header-left">
                <div className="jm-section__cat-icon"><Icon icon={getCatIcon(catName)} width={16} /></div>
                <div>
                  <h3 className="jm-section__subtitle">{catName}</h3>
                  <p className="jm-section__meta">{items.length} product{items.length !== 1 ? "s" : ""} · {priceRange(items, currency)}</p>
                </div>
              </div>
              {hasMore && (
                <button
                  type="button"
                  onClick={() => toggleCatExpand(catName)}
                  className="jm-section__see-all"
                  style={{ background: "none", border: "none", cursor: "pointer", font: "inherit" }}
                >
                  {isExpanded ? "SHOW LESS" : "VIEW ALL"} <Icon icon={isExpanded ? "lucide:chevron-up" : "lucide:chevron-right"} width={14} />
                </button>
              )}
            </div>
            <div className="jm-product-grid jm-product-grid--4">
              {displayItems.map((p) => (
                <ProductCard key={`list-${catName}-${p._id}`} p={p} prefix={`list-${catName}-`} currency={currency} cartQty={getCartQty(p._id)} isSyncing={isSyncing} onAddToCart={handleAddToCart} canSeeEngPricing={canSeeEngPricing} />
              ))}
            </div>
          </section>
        );
      })}

      {/* ═══════ WHY SHOP WITH US ═══════ */}
      <section className="jm-section jm-trust-section">
        <div className="jm-section__header"><h2 className="jm-section__title">WHY SHOP WITH US</h2></div>
        <div className="jm-trust-grid">
          {[
            { icon: "lucide:truck", title: "Free Delivery", desc: `On orders over ${currency}${freeDeliveryThreshold.toLocaleString()}` },
            { icon: "lucide:shield-check", title: "Genuine Products", desc: "Certified solar brands" },
            { icon: "lucide:refresh-cw", title: "Easy Returns", desc: `${returnDays}-day return policy` },
            { icon: "lucide:lock", title: "Secure Payment", desc: "Fully protected data" },
          ].map((item) => (
            <div key={item.title} className="jm-trust-item">
              <div className="jm-trust-item__icon"><Icon icon={item.icon} width={28} /></div>
              <p className="jm-trust-item__title">{item.title}</p>
              <p className="jm-trust-item__desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ APP BANNER ═══════ */}
      <section className="jm-app-banner">
        <div className="jm-app-banner__glow" />
        <div className="jm-app-banner__content">
          <div className="jm-app-banner__text">
            <h3 className="jm-app-banner__title">Download the {companyName} App</h3>
            <p className="jm-app-banner__desc">Get exclusive app-only deals, faster checkout, and real-time order tracking.</p>
            <div className="jm-app-banner__buttons">
              <a href={appStoreLink} target="_blank" rel="noopener noreferrer" className="jm-app-btn"><Icon icon="lucide:smartphone" width={18} /><div><span className="jm-app-btn__small">Download on the</span><span className="jm-app-btn__big">App Store</span></div></a>
              <a href={googlePlayLink} target="_blank" rel="noopener noreferrer" className="jm-app-btn"><Icon icon="lucide:play" width={18} /><div><span className="jm-app-btn__small">Get it on</span><span className="jm-app-btn__big">Google Play</span></div></a>
            </div>
          </div>
          <div className="jm-app-banner__qr"><Icon icon="lucide:qr-code" width={80} /></div>
        </div>
      </section>

      {/* ═══════ POPULAR SEARCHES ═══════ */}
      <section className="jm-section">
        <div className="jm-section__header"><h2 className="jm-section__title">POPULAR SEARCHES</h2></div>
        <div className="jm-search-tags">
          {popularSearches.map((s, idx) => (
            <Link to="/products" key={idx} className="jm-search-tag"><span className="jm-search-tag__term">{s.term}</span><span className="jm-search-tag__price">{s.price}</span></Link>
          ))}
        </div>
      </section>

      {/* ═══════ PAYMENT METHODS ═══════ */}
      <section className="jm-payment-section">
        {[
          { icon: "lucide:credit-card", label: "Visa" }, { icon: "lucide:credit-card", label: "Mastercard" },
          { icon: "lucide:banknote", label: "Bank Transfer" }, { icon: "lucide:smartphone", label: "USSD" },
          { icon: "lucide:wallet", label: "Wallet" }, { icon: "lucide:truck", label: "Cash on Delivery" },
        ].map((p) => (
          <div key={p.label} className="jm-payment-item"><Icon icon={p.icon} width={20} /><span>{p.label}</span></div>
        ))}
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="jm-footer">
        <div className="jm-footer__grid">
          <div className="jm-footer__col">
            <div className="jm-footer__brand">
              {companyLogo ? <img src={companyLogo} alt={companyName} className="jm-footer__logo" style={{ width: "120px", height: "auto", maxWidth: "150px", objectFit: "contain" }} /> : <h3 className="jm-footer__brand-name">{companyName}</h3>}
              <p className="jm-footer__tagline">{companyTagline}</p>
            </div>
            {aboutUs && <p className="jm-footer__about">{aboutUs}</p>}
            {companyAddress && <div className="jm-footer__contact-item"><Icon icon="lucide:map-pin" width={14} /><span>{companyAddress}</span></div>}
          </div>
          <div className="jm-footer__col">
            <h4 className="jm-footer__heading">Contact Us</h4>
            {companyPhone && <a href={`tel:${companyPhone}`} className="jm-footer__contact-item"><Icon icon="lucide:phone" width={14} /><span>{companyPhone}</span></a>}
            {companyPhone2 && <a href={`tel:${companyPhone2}`} className="jm-footer__contact-item"><Icon icon="lucide:phone" width={14} /><span>{companyPhone2}</span></a>}
            {companyEmail && <a href={`mailto:${companyEmail}`} className="jm-footer__contact-item"><Icon icon="lucide:mail" width={14} /><span>{companyEmail}</span></a>}
            {companyWhatsapp && <a href={`https://wa.me/${companyWhatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="jm-footer__contact-item"><Icon icon="lucide:message-circle" width={14} /><span>WhatsApp</span></a>}
          </div>
          <div className="jm-footer__col">
            <h4 className="jm-footer__heading">Categories</h4>
            <div className="jm-footer__links">{sidebarItems.slice(0, 8).map((cat) => <Link to={`/products?category=${cat.name}`} key={cat.id} className="jm-footer__link">{cat.name}</Link>)}</div>
          </div>
          <div className="jm-footer__col">
            <h4 className="jm-footer__heading">Follow Us</h4>
            <div className="jm-footer__social">
              {companyFacebook && <a href={companyFacebook} target="_blank" rel="noopener noreferrer" className="jm-footer__social-link"><Icon icon="lucide:facebook" width={18} /></a>}
              {companyInstagram && <a href={companyInstagram} target="_blank" rel="noopener noreferrer" className="jm-footer__social-link"><Icon icon="lucide:instagram" width={18} /></a>}
              {companyTwitter && <a href={companyTwitter} target="_blank" rel="noopener noreferrer" className="jm-footer__social-link"><Icon icon="lucide:twitter" width={18} /></a>}
              {companyTiktok && <a href={companyTiktok} target="_blank" rel="noopener noreferrer" className="jm-footer__social-link"><Icon icon="lucide:music" width={18} /></a>}
              {companyYoutube && <a href={companyYoutube} target="_blank" rel="noopener noreferrer" className="jm-footer__social-link"><Icon icon="lucide:youtube" width={18} /></a>}
            </div>
            <div className="jm-footer__support"><Icon icon="lucide:headphones" width={14} /><span>Support: {supportHours}</span></div>
          </div>
        </div>
        <div className="jm-footer__bottom"><p>{footerText}</p></div>
      </footer>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes authPopIn { from { opacity: 0; transform: scale(0.9) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }

        /* ═══════ Product Card Image Gallery ═══════ */
        .jm-product-card__img-wrap {
          position: relative;
          overflow: hidden;
        }

        .jm-product-card__img-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(0, 0, 0, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 3;
          opacity: 0;
          transition: opacity 0.2s ease, background 0.15s ease, box-shadow 0.15s ease;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
          color: #495057;
        }

        .jm-product-card__img-wrap:hover .jm-product-card__img-nav {
          opacity: 1;
        }

        @media (hover: none) and (pointer: coarse) {
          .jm-product-card__img-nav {
            opacity: 0.85;
          }
        }

        .jm-product-card__img-nav:hover {
          background: #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .jm-product-card__img-nav:active {
          transform: translateY(-50%) scale(0.92);
        }

        .jm-product-card__img-nav--prev { left: 6px; }
        .jm-product-card__img-nav--next { right: 6px; }

        .jm-product-card__img-counter {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.55);
          color: #fff;
          font-size: 0.65rem;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 10px;
          z-index: 3;
          letter-spacing: 0.3px;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }

        .jm-product-card__img-dots {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 4px;
          z-index: 3;
        }

        .jm-product-card__img-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .jm-product-card__img-dot--active {
          background: #fff;
          box-shadow: 0 0 0 1.5px rgba(0, 0, 0, 0.2);
          transform: scale(1.2);
        }

        .jm-product-card__img-dot:hover {
          background: rgba(255, 255, 255, 0.85);
        }

        .jm-product-card--flash .jm-product-card__img-counter {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .jm-product-card--flash .jm-product-card__img-nav {
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #fff;
        }

        .jm-product-card--flash .jm-product-card__img-nav:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .jm-product-card--compact .jm-product-card__img-nav { width: 22px; height: 22px; }
        .jm-product-card--compact .jm-product-card__img-nav--prev { left: 4px; }
        .jm-product-card--compact .jm-product-card__img-nav--next { right: 4px; }
        .jm-product-card--compact .jm-product-card__img-counter { font-size: 0.6rem; padding: 1px 6px; top: 6px; right: 6px; }
        .jm-product-card--compact .jm-product-card__img-dot { width: 5px; height: 5px; }
        .jm-product-card--compact .jm-product-card__img-dots { bottom: 8px; gap: 3px; }

        /* ═══════ Engineering Price & Margin in Product Card ═══════ */
        .jm-product-card__eng-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-top: 4px;
          padding: 4px 8px;
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          font-size: 0.72rem;
          line-height: 1.4;
        }

        .jm-product-card__eng-price {
          font-weight: 500;
          color: #495057;
          font-size: 0.7rem;
        }

        .jm-product-card__margin {
          font-weight: 600;
          font-size: 0.72rem;
        }

        /* ═══════ Margin in Mega Dropdown ═══════ */
        .jm-mega-product__margin {
          display: block;
          font-size: 0.65rem;
          font-weight: 600;
          margin-top: 1px;
        }

        /* ═══════ Margin in Price Drop Card ═══════ */
        .jm-price-drop-card__margin {
          display: block;
          font-size: 0.72rem;
          font-weight: 600;
          margin-top: 2px;
        }

        /* ═══════ Category Select Dropdown ═══════ */
        .jm-cat-select-wrap {
          position: relative;
          display: flex;
          align-items: center;
          max-width: 460px;
          width: 100%;
          margin-bottom: 20px;
        }

        .jm-cat-select__icon {
          position: absolute;
          left: 14px;
          z-index: 1;
          color: #868e96;
          pointer-events: none;
          display: flex;
          align-items: center;
          transition: color 0.2s ease;
        }

        .jm-cat-select-wrap:focus-within .jm-cat-select__icon {
          color: #16a34a;
        }

        .jm-cat-select {
          width: 100%;
          padding: 12px 40px 12px 42px;
          font-size: 0.92rem;
          font-weight: 500;
          font-family: inherit;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          background: #fff;
          color: #212529;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.15s ease;
          line-height: 1.4;
        }

        .jm-cat-select:hover {
          border-color: #ced4da;
          background: #fafbfc;
        }

        .jm-cat-select:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
        }

        .jm-cat-select:active {
          border-color: #15803d;
        }

        .jm-cat-select__arrow {
          position: absolute;
          right: 14px;
          color: #868e96;
          pointer-events: none;
          display: flex;
          align-items: center;
          transition: color 0.2s ease, transform 0.2s ease;
        }

        .jm-cat-select-wrap:focus-within .jm-cat-select__arrow {
          color: #16a34a;
          transform: rotate(180deg);
        }

        .jm-cat-select option {
          padding: 10px 14px;
          font-size: 0.88rem;
          font-weight: 400;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .jm-cat-select-wrap {
            max-width: 100%;
          }

          .jm-cat-select {
            padding: 11px 36px 11px 38px;
            font-size: 0.88rem;
            border-radius: 10px;
          }

          .jm-cat-select__icon {
            left: 12px;
          }

          .jm-cat-select__arrow {
            right: 12px;
          }
        }

        /* ═══════ Home Category Dropdown ═══════ */
        .jm-home-cat-select-wrap {
          position: relative;
          display: flex;
          align-items: center;
          max-width: 460px;
          width: 100%;
          margin-bottom: 20px;
        }

        .jm-home-cat-select__icon {
          position: absolute;
          left: 14px;
          z-index: 1;
          color: #868e96;
          pointer-events: none;
          display: flex;
          align-items: center;
          transition: color 0.2s ease;
        }

        .jm-home-cat-select-wrap:focus-within .jm-home-cat-select__icon {
          color: #16a34a;
        }

        .jm-home-cat-select {
          width: 100%;
          padding: 12px 40px 12px 42px;
          font-size: 0.92rem;
          font-weight: 500;
          font-family: inherit;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          background: #fff;
          color: #212529;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.15s ease;
          line-height: 1.4;
        }

        .jm-home-cat-select:hover {
          border-color: #ced4da;
          background: #fafbfc;
        }

        .jm-home-cat-select:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
        }

        .jm-home-cat-select:active {
          border-color: #15803d;
        }

        .jm-home-cat-select__arrow {
          position: absolute;
          right: 14px;
          color: #868e96;
          pointer-events: none;
          display: flex;
          align-items: center;
          transition: color 0.2s ease, transform 0.2s ease;
        }

        .jm-home-cat-select-wrap:focus-within .jm-home-cat-select__arrow {
          color: #16a34a;
          transform: rotate(180deg);
        }

        .jm-home-cat-select option {
          padding: 10px 14px;
          font-size: 0.88rem;
          font-weight: 400;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .jm-home-cat-select-wrap {
            max-width: 100%;
          }
          .jm-home-cat-select {
            padding: 11px 36px 11px 38px;
            font-size: 0.88rem;
            border-radius: 10px;
          }
          .jm-home-cat-select__icon {
            left: 12px;
          }
          .jm-home-cat-select__arrow {
            right: 12px;
          }
        }
      `}</style>

      {/* ═══════ END NORMAL HOME PAGE CONTENT ═══════ */}
      </>
      )}
    </div>
  );
}
