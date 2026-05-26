import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Point from './Point';
import './Cart.css';

// ✅ Paystack public key — set in your .env as VITE_PAYSTACK_PUBLIC_KEY
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "sk_test_c0a72e5f02299146ff0c8febd03d6a1c4139df3a";

const getEffectivePrice = (item, isEngineer = false) => {
  const price = Number(item.price) || 0;
  const discountPrice = Number(item.discountPrice) || 0;
  const engineeringPrice = Number(item.engineeringPrice) || 0;

  if (isEngineer && engineeringPrice > 0) {
    return engineeringPrice;
  }
  return discountPrice > 0 && discountPrice < price ? discountPrice : price;
};

const BANK_ACCOUNTS = [
  {
    name: "AFOO TECHNOLOGY",
    accountNumber: "2045148279",
    bank: "First Bank of Nigeria",
    color: "#00C07F",
    icon: "lucide:smartphone",
  },
];

export default function Cart() {
  const {
    cart = [],
    totalPrice = 0,
    totalQty = 0,
    updateCartQty = () => {},
    removeFromCart = () => {},
    clearCart = async () => {},
    isLoading = false,
    isSyncing = false
  } = useCart();

  const { user } = useAuth() || {};
  const customerEmail = user?.email || "";
  const canSeeEngPricing = user?.role === "admin" || user?.role === "engineer";

  const ADMIN_WHATSAPP_NUMBER = "2348036742968";

  const [backendPricing, setBackendPricing] = useState({});
  const [isPaid, setIsPaid] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [showMobileForm, setShowMobileForm] = useState(false);

  // ✅ Bank modal state
  const [showBankModal, setShowBankModal] = useState(false);
  const [copiedField, setCopiedField] = useState("");

  // ✅ Paystack state
  const [paystackInit, setPaystackInit] = useState(false);

  // ✅ Delivery settings from SiteSettings
  const [deliverySettings, setDeliverySettings] = useState({
    deliveryFee: 2500,
  });

  // ✅ Coin states
  const [userCoins, setUserCoins] = useState(0);
  const [useCoins, setUseCoins] = useState(false);
  const [coinsToUse, setCoinsToUse] = useState(0);

  const [shippingInfo, setShippingInfo] = useState({
    fullName: "", street: "", apartment: "", city: "",
    state: "", zipCode: "", country: "Nigeria", phone: "",
  });

  const handleShippingChange = (e) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
  };

  // ✅ Fetch site settings for delivery config
  useEffect(() => {
    const fetchDeliverySettings = async () => {
      try {
        const { data } = await api.get('/settings');
        if (data?.delivery) {
          setDeliverySettings({
            deliveryFee: Number(data.delivery.deliveryFee) || 2500,
          });
        }
      } catch (err) {
        console.error('Failed to fetch delivery settings, using defaults:', err);
      }
    };
    fetchDeliverySettings();
  }, []);

  // ✅ Fetch user coin balance
  useEffect(() => {
    if (user) {
      const fetchCoins = async () => {
        try {
          const { data } = await api.get("/payments/balance");
          setUserCoins(data.coins || 0);
        } catch (error) {
          console.error("Failed to fetch coin balance");
        }
      };
      fetchCoins();
    }
  }, [user]);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await api.get('/products/discount-prices');
        if (response.data) {
          const pricingMap = {};
          response.data.forEach((p) => {
            pricingMap[p._id] = {
              price: p.price,
              discountPrice: p.discountPrice,
              engineeringPrice: p.engineeringPrice
            };
          });
          setBackendPricing(pricingMap);
        }
      } catch (error) {
        console.error('Error fetching pricing data:', error);
      }
    };
    if (cart.length > 0) fetchPricing();
  }, [cart]);

  const validatedCart = cart.map(item => {
    const productId = item.product?._id || item.product || item._id;
    const backendData = backendPricing[productId];
    return {
      ...item,
      price: backendData?.price !== undefined ? backendData.price : item.price,
      discountPrice: backendData?.discountPrice !== undefined ? backendData.discountPrice : item.discountPrice,
      engineeringPrice: backendData?.engineeringPrice !== undefined ? backendData.engineeringPrice : item.engineeringPrice
    };
  });

  // ✅ Role-based Subtotal and Totals
  const safeSubtotal = validatedCart.reduce((sum, item) => {
    return sum + (getEffectivePrice(item, canSeeEngPricing) * (Number(item.quantity) || 1));
  }, 0);

  const totalSavings = validatedCart.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const effectivePrice = getEffectivePrice(item, canSeeEngPricing);
    if (effectivePrice > 0 && effectivePrice < price) {
      return sum + ((price - effectivePrice) * (Number(item.quantity) || 1));
    }
    return sum;
  }, 0);

  const { deliveryFee: configuredDeliveryFee } = deliverySettings;
  const deliveryFee = configuredDeliveryFee;

  const grandTotal = safeSubtotal;

  const pricingTierLabel = canSeeEngPricing && validatedCart.some(i => Number(i.engineeringPrice) > 0 && Number(i.engineeringPrice) < Number(i.price))
    ? "Engineer Pricing"
    : totalSavings > 0
    ? "Discounted Pricing"
    : "Standard Pricing";

  // ✅ Coin calculations
  const maxApplicableCoins = Math.min(userCoins, Math.floor(grandTotal / 100));
  const canPayFullyWithCoins = userCoins * 100 >= grandTotal;

  useEffect(() => {
    if (coinsToUse > maxApplicableCoins) {
      setCoinsToUse(maxApplicableCoins);
    }
  }, [maxApplicableCoins, coinsToUse]);

  const coinDiscount = coinsToUse * 100;
  const amountToPay = grandTotal - coinDiscount;

  let eligibleAmountForCoins = 0;
  validatedCart.forEach(item => {
    const effectivePrice = getEffectivePrice(item, canSeeEngPricing);
    const safeQuantity = Number(item.quantity) || 1;
    const isEngPrice = canSeeEngPricing && Number(item.engineeringPrice) > 0;
    
    if (isEngPrice && Number(item.engineeringPrice) < 10000) {
      return; 
    }
    
    eligibleAmountForCoins += effectivePrice * safeQuantity;
  });

  const coinsEarned = Math.floor(Math.max(0, eligibleAmountForCoins - coinDiscount) / 10000);

  const getProductId = (item) => item.product?._id || item.product;

  const buildWhatsAppMessage = () => {
    let message = "Hello, I'd like to place an order:\n\n";
    validatedCart.forEach((item, index) => {
      const effectivePrice = getEffectivePrice(item, canSeeEngPricing);
      const safeQuantity = Number(item.quantity) || 1;
      message += `*${index + 1}. ${item.name}*\n`;
      message += `   Qty: ${safeQuantity}  •  Price: ₦${(effectivePrice * safeQuantity).toLocaleString()}\n\n`;
    });
    message += "____________________\n\n";
    message += `*Subtotal (${pricingTierLabel}):* ₦${safeSubtotal.toLocaleString()}\n`;
    if (coinDiscount > 0) {
      message += `*Coin Discount:* -₦${coinDiscount.toLocaleString()} (${coinsToUse} coins)\n`;
    }
    message += `*Total to Pay:* ₦${amountToPay.toLocaleString()}\n\n`;
    message += "*Delivery Details:*\n";
    message += `Name: ${shippingInfo.fullName}\n`;
    message += `Address: ${shippingInfo.street}, ${shippingInfo.apartment}\n`;
    message += `City: ${shippingInfo.city}, ${shippingInfo.state} ${shippingInfo.zipCode}\n`;
    message += `Phone: ${shippingInfo.phone}\n\n`;
    message += "Please confirm availability and payment details. Thank you!";
    return message;
  };

  // ✅ Bank Transfer WhatsApp message — sent after confirming transfer
  const buildBankTransferWhatsAppMessage = (reference) => {
    let message = "🏦 *BANK TRANSFER NOTIFICATION*\n\n";
    message += "I have made a bank transfer for my order:\n\n";
    message += "━━━━━━━━━━━━━━━━━━\n";
    message += "🛒 *ITEMS ORDERED:*\n\n";
    validatedCart.forEach((item, index) => {
      const effectivePrice = getEffectivePrice(item, canSeeEngPricing);
      const safeQuantity = Number(item.quantity) || 1;
      message += `*${index + 1}. ${item.name}*\n`;
      message += `   Qty: ${safeQuantity}  •  ₦${(effectivePrice * safeQuantity).toLocaleString()}\n\n`;
    });
    message += "━━━━━━━━━━━━━━━━━━\n\n";
    message += `*Pricing:* ${pricingTierLabel}\n`;
    message += `*Subtotal:* ₦${safeSubtotal.toLocaleString()}\n`;
    if (coinDiscount > 0) {
      message += `*Coin Discount:* -₦${coinDiscount.toLocaleString()} (${coinsToUse} coins)\n`;
    }
    message += `*Amount Transferred:* ₦${amountToPay.toLocaleString()}\n\n`;
    message += "━━━━━━━━━━━━━━━━━━\n";
    message += "📦 *DELIVERY DETAILS:*\n\n";
    message += `👤 Name: ${shippingInfo.fullName}\n`;
    message += `📍 Address: ${shippingInfo.street}${shippingInfo.apartment ? `, ${shippingInfo.apartment}` : ''}\n`;
    message += `🏙️ City: ${shippingInfo.city}, ${shippingInfo.state}\n`;
    message += `📮 Zip: ${shippingInfo.zipCode}\n`;
    message += `📱 Phone: ${shippingInfo.phone}\n\n`;
    message += "━━━━━━━━━━━━━━━━━━\n";
    message += `🔢 *Order Ref:* ${reference}\n\n`;
    message += "Please confirm receipt of payment. Thank you! 🙏";
    return message;
  };

  const validateShipping = () => {
    if (!shippingInfo.fullName || !shippingInfo.street || !shippingInfo.city ||
        !shippingInfo.state || !shippingInfo.zipCode || !shippingInfo.phone) {
      setError("Please fill in all required delivery details.");
      return false;
    }
    setError("");
    return true;
  };

  const buildOrderPayload = (paymentMethod, transactionRef) => ({
    items: validatedCart.map((item) => ({
      product: getProductId(item),
      name: item.name,
      image: item.image,
      price: getEffectivePrice(item, canSeeEngPricing),
      originalPrice: Number(item.price) || 0,
      engineeringPrice: Number(item.engineeringPrice) || undefined,
      quantity: Number(item.quantity) || 1,
    })),
    subtotal: safeSubtotal,
    deliveryFee,
    total: grandTotal,
    coinsUsed: coinsToUse,
    coinDiscount: coinDiscount,
    amountPaid: amountToPay,
    paymentMethod,
    bankTransferReference: paymentMethod === "bank_transfer" ? transactionRef : undefined,
    paystackReference: paymentMethod === "paystack" ? transactionRef : undefined,
    shippingAddress: shippingInfo,
  });

  // ✅ Copy to clipboard helper
  const copyToClipboard = async (text, fieldKey) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(""), 2000);
    } catch (err) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        setCopiedField(fieldKey);
        setTimeout(() => setCopiedField(""), 2000);
      } catch (e) {
        console.error("Failed to copy:", e);
      }
      document.body.removeChild(textarea);
    }
  };

  // ✅ Paystack: Load inline script dynamically
  const loadPaystackScript = () => {
    return new Promise((resolve, reject) => {
      if (window.PaystackPop) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v2/inline.js';
      script.onload = () => setTimeout(resolve, 100);
      script.onerror = () => reject(new Error("Failed to load Paystack"));
      document.body.appendChild(script);
    });
  };

  // ✅ Paystack: Payment handler
  const handlePaystackPayment = async () => {
    if (placing) return;
    if (!validateShipping()) return setShowMobileForm(true);

    if (amountToPay <= 0) {
      setError("Amount must be greater than zero for card payment.");
      return;
    }

    if (!PAYSTACK_PUBLIC_KEY) {
      setError("Paystack is not configured. Please use another payment method.");
      return;
    }

    setPlacing(true);
    setError("");
    setPaystackInit(true);

    try {
      await loadPaystackScript();

      const reference = `PS-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: customerEmail || "no-email@provided.com",
        amount: Math.round(amountToPay * 100), // Convert naira to kobo
        currency: "NGN",
        ref: reference,
        metadata: {
          custom_fields: [
            {
              display_name: "Customer Name",
              variable_name: "customer_name",
              value: shippingInfo.fullName,
            },
            {
              display_name: "Phone",
              variable_name: "phone",
              value: shippingInfo.phone,
            },
            {
              display_name: "Coin Discount",
              variable_name: "coin_discount",
              value: coinDiscount > 0 ? `${coinsToUse} coins (₦${coinDiscount})` : "None",
            },
          ],
        },
        onClose: () => {
          setPlacing(false);
          setPaystackInit(false);
        },
        callback: async (response) => {
          try {
            const orderData = buildOrderPayload("paystack", response.reference);
            await api.post("/orders", orderData);
            await clearCart();
            setIsPaid(true);
          } catch (err) {
            setError(
              err.response?.data?.message ||
              `Payment successful but order creation failed. Please contact support with ref: ${response.reference}`
            );
          } finally {
            setPlacing(false);
            setPaystackInit(false);
          }
        },
      });

      handler.openIframe();
    } catch (err) {
      setError("Failed to initialize Paystack payment. Please try another method.");
      setPlacing(false);
      setPaystackInit(false);
    }
  };

  // ✅ Bank Transfer payment handler — opens the modal
  const handleBankTransfer = () => {
    if (placing) return;
    if (!validateShipping()) return setShowMobileForm(true);
    setShowBankModal(true);
  };

  // ✅ Confirm bank transfer — places the order AND sends to WhatsApp
  const handleConfirmTransfer = async () => {
    if (placing) return;
    setPlacing(true);
    setError("");
    try {
      const reference = `BT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const orderData = buildOrderPayload("bank_transfer", reference);
      await api.post("/orders", orderData);

      const message = buildBankTransferWhatsAppMessage(reference);
      window.open(
        `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
        "_blank"
      );

      await clearCart();
      setShowBankModal(false);
      setIsPaid(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  // ✅ Full coin payment handler
  const handleFullCoinPayment = async () => {
    if (placing) return;
    if (!validateShipping()) return setShowMobileForm(true);

    setPlacing(true);
    setError("");
    try {
      const fullCoinsNeeded = Math.ceil(grandTotal / 100);
      const coinsForPayment = Math.min(userCoins, fullCoinsNeeded);

      const orderData = {
        items: validatedCart.map((item) => ({
          product: getProductId(item),
          name: item.name,
          image: item.image,
          price: getEffectivePrice(item, canSeeEngPricing),
          originalPrice: Number(item.price) || 0,
          engineeringPrice: Number(item.engineeringPrice) || undefined,
          quantity: Number(item.quantity) || 1,
        })),
        subtotal: safeSubtotal,
        deliveryFee,
        total: grandTotal,
        coinsUsed: coinsForPayment,
        coinDiscount: coinsForPayment * 100,
        amountPaid: 0,
        paymentMethod: "coins",
        bankTransferReference: undefined,
        shippingAddress: shippingInfo,
      };

      await api.post("/orders", orderData);
      await clearCart();
      setIsPaid(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order with coins.");
    } finally {
      setPlacing(false);
    }
  };

  const handleWhatsAppOrder = async () => {
    if (placing) return;
    if (!validateShipping()) return setShowMobileForm(true);

    setPlacing(true);
    setError("");
    try {
      const message = buildWhatsAppMessage();
      window.open(`https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
      try {
        const orderData = buildOrderPayload("whatsapp", null);
        await api.post("/orders", orderData);
      } catch (saveErr) {
        console.warn("Order not saved to DB, but WhatsApp opened:", saveErr);
      }
      await clearCart();
      setIsPaid(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setPlacing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="cart-empty" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Icon icon="lucide:loader-2" width={40} style={{ animation: 'spin 1s linear infinite', color: '#f68b1e' }} />
        <p style={{ marginTop: '16px', color: '#666' }}>Loading your cart...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isPaid) {
    return (
      <div className="cart-empty">
        <Icon icon="lucide:check-circle" width={64} style={{ color: '#25D366' }} />
        <h2>Order Placed Successfully!</h2>
        <p>Thank you for your purchase. We are processing your order.</p>
        <Link to="/" className="cart-empty-btn">Continue Shopping</Link>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <Icon icon="lucide:shopping-cart" width={64} />
        <h2>Your cart is empty</h2>
        <p>Looks like you have not added anything to your cart.</p>
        <Link to="/" className="cart-empty-btn">Continue Shopping</Link>
      </div>
    );
  }

  const coinsNeededForFullPayment = Math.ceil(grandTotal / 100);

  return (
    <div className="cart-page">
      {isSyncing && (
        <div className="cart-sync-banner">
          <Icon icon="lucide:loader-2" width={14} style={{ animation: 'spin 1s linear infinite' }} />
          Saving cart...
        </div>
      )}

      {/* ✅ Bank Details Modal */}
      {showBankModal && (
        <div className="bank-modal-overlay" onClick={() => setShowBankModal(false)}>
          <div className="bank-modal" onClick={(e) => e.stopPropagation()}>
            <button className="bank-modal-close" onClick={() => setShowBankModal(false)}>
              <Icon icon="lucide:x" width={20} />
            </button>

            <div className="bank-modal-header">
              <div className="bank-modal-icon-wrap">
                <Icon icon="lucide:building-2" width={28} color="#f68b1e" />
              </div>
              <h2>Bank Transfer Details</h2>
              <p>Transfer the exact amount below to any of these accounts</p>
            </div>

            <div className="bank-modal-amount">
              <span className="bank-modal-amount-label">Amount to Pay</span>
              <span className="bank-modal-amount-value">₦{amountToPay.toLocaleString()}</span>
              {coinsToUse > 0 && (
                <span className="bank-modal-amount-coins">
                  + {coinsToUse} coins applied (₦{coinDiscount.toLocaleString()} off)
                </span>
              )}
            </div>

            <div className="bank-modal-accounts">
              {BANK_ACCOUNTS.map((account, index) => (
                <div key={index} className="bank-account-card">
                  <div className="bank-account-top">
                    <div className="bank-account-icon" style={{ background: `${account.color}15`, color: account.color }}>
                      <Icon icon={account.icon} width={18} />
                    </div>
                    <span className="bank-account-bank" style={{ color: account.color }}>{account.bank}</span>
                  </div>

                  <div className="bank-account-field">
                    <span className="bank-account-label">Account Name</span>
                    <div className="bank-account-value-row">
                      <span className="bank-account-value">{account.name}</span>
                      <button
                        className={`bank-copy-btn ${copiedField === `name-${index}` ? "copied" : ""}`}
                        onClick={() => copyToClipboard(account.name, `name-${index}`)}
                      >
                        <Icon icon={copiedField === `name-${index}` ? "lucide:check" : "lucide:copy"} width={14} />
                        {copiedField === `name-${index}` ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div className="bank-account-field">
                    <span className="bank-account-label">Account Number</span>
                    <div className="bank-account-value-row">
                      <span className="bank-account-value bank-account-number">{account.accountNumber}</span>
                      <button
                        className={`bank-copy-btn ${copiedField === `acc-${index}` ? "copied" : ""}`}
                        onClick={() => copyToClipboard(account.accountNumber, `acc-${index}`)}
                      >
                        <Icon icon={copiedField === `acc-${index}` ? "lucide:check" : "lucide:copy"} width={14} />
                        {copiedField === `acc-${index}` ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bank-modal-notice">
              <Icon icon="lucide:info" width={16} />
              <span>Transfer <strong>exactly ₦{amountToPay.toLocaleString()}</strong> then click the button below. Your order details and payment info will be sent to us via WhatsApp for confirmation.</span>
            </div>

            <div className="bank-modal-actions">
              <button
                className="bank-modal-confirm-btn"
                onClick={handleConfirmTransfer}
                disabled={placing}
              >
                {placing ? (
                  <><Icon icon="lucide:loader-2" width={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
                ) : (
                  <><Icon icon="mdi:whatsapp" width={18} /> I've Made the Transfer — Send on WhatsApp</>
                )}
              </button>
              <button
                className="bank-modal-cancel-btn"
                onClick={() => setShowBankModal(false)}
                disabled={placing}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="cart-container">
        {/* Left: Items List */}
        <div className="cart-items-section">
          <div className="cart-header">
            <h2>Shopping Cart ({totalQty})</h2>
          </div>

          <Point />

          {validatedCart.map((item) => {
            const productId = getProductId(item);
            const safePrice = Number(item.price) || 0;
            const safeEngineeringPrice = Number(item.engineeringPrice) || 0;
            const effectivePrice = getEffectivePrice(item, canSeeEngPricing);
            const safeQuantity = Number(item.quantity) || 1;
            const itemTotal = effectivePrice * safeQuantity;
            const hasDiscount = effectivePrice < safePrice;
            const isEngPrice = canSeeEngPricing && safeEngineeringPrice > 0 && safeEngineeringPrice < safePrice;

            return (
              <div key={item._id} className="cart-item">
                <Link to={`/product/${productId}`} className="cart-item-img">
                  <img src={item.image} alt={item.name} />
                </Link>
                <div className="cart-item-details">
                  <div>
                    <Link to={`/product/${productId}`} className="cart-item-name">{item.name}</Link>
                    <p className="cart-item-sold">Sold by AFOO TECHNOLOGY</p>
                  </div>
                  <div className="cart-item-bottom">
                    <div className="cart-qty-control">
                      <button onClick={() => updateCartQty(productId, safeQuantity - 1)} disabled={safeQuantity <= 1 || isSyncing} className="cart-qty-btn">
                        <Icon icon="lucide:minus" width={14} />
                      </button>
                      <span className="cart-qty-num">{safeQuantity}</span>
                      <button onClick={() => updateCartQty(productId, safeQuantity + 1)} disabled={isSyncing} className="cart-qty-btn">
                        <Icon icon="lucide:plus" width={14} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      {hasDiscount && (
                        <span style={{ fontSize: '12px', color: '#999', textDecoration: 'line-through', marginBottom: '2px' }}>
                          ₦{(safePrice * safeQuantity).toLocaleString()}
                        </span>
                      )}
                      <span className="cart-item-total">₦{itemTotal.toLocaleString()}</span>
                      {hasDiscount && (
                        <span style={{ fontSize: '11px', color: '#e8590c', marginTop: '1px' }}>
                          ₦{effectivePrice.toLocaleString()} {isEngPrice ? 'eng. price' : 'each'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => removeFromCart(productId)} className="cart-item-remove" disabled={isSyncing} aria-label="Remove item">
                  <Icon icon="lucide:trash-2" width={18} />
                </button>
              </div>
            );
          })}

          {totalSavings > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#d4edda', padding: '12px', borderRadius: '8px', marginBottom: '10px', marginTop: '10px' }}>
              <Icon icon="lucide:tag" width={16} style={{ color: '#155724' }} />
              <span style={{ marginLeft: '8px', color: '#155724', fontSize: '13px', fontWeight: '600' }}>
                You're saving ₦{totalSavings.toLocaleString()} with {pricingTierLabel}!
              </span>
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div className="cart-summary-section">
          <div className="cart-summary-card">
            <h3>Order Summary</h3>

            <Point />

            {/* ✅ Redeem Coins Section */}
            {userCoins > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                border: '1px solid #fcd34d',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: 'rgba(217, 119, 6, 0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon icon="lucide:coins" width={16} color="#d97706" />
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: '#92400e', fontSize: '14px', display: 'block' }}>Loyalty Coins</span>
                      <span style={{ fontSize: '11px', color: '#b45309' }}>
                        {userCoins} coins available (₦{(userCoins * 100).toLocaleString()} value)
                      </span>
                    </div>
                  </div>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                    background: useCoins ? '#d97706' : 'transparent',
                    border: useCoins ? 'none' : '2px solid #d97706',
                    borderRadius: '20px',
                    padding: '5px 14px',
                    transition: 'all 0.2s',
                  }}>
                    <input
                      type="checkbox"
                      checked={useCoins}
                      onChange={(e) => {
                        setUseCoins(e.target.checked);
                        if (e.target.checked) setCoinsToUse(maxApplicableCoins);
                        else setCoinsToUse(0);
                      }}
                      style={{ display: 'none' }}
                    />
                    <span style={{
                      fontSize: '12px', fontWeight: 700,
                      color: useCoins ? '#fff' : '#d97706',
                    }}>
                      {useCoins ? 'Applied' : 'Use Coins'}
                    </span>
                  </label>
                </div>

                {useCoins && (
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #fde68a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#92400e', fontWeight: 600 }}>How many coins to use?</span>
                      <span style={{ fontSize: '12px', color: '#b45309', fontWeight: 700 }}>
                        {coinsToUse} coin{coinsToUse !== 1 ? 's' : ''} = ₦{(coinsToUse * 100).toLocaleString()}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={maxApplicableCoins}
                      value={coinsToUse}
                      onChange={(e) => setCoinsToUse(parseInt(e.target.value, 10))}
                      style={{ width: '100%', accentColor: '#d97706', height: '6px' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#92400e', marginTop: '4px' }}>
                      <span>0</span>
                      <span>{maxApplicableCoins} max</span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      <button
                        onClick={() => setCoinsToUse(0)}
                        style={{
                          flex: 1, padding: '5px', borderRadius: '6px', border: '1px solid #fde68a',
                          background: 'white', color: '#92400e', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        None
                      </button>
                      <button
                        onClick={() => setCoinsToUse(Math.floor(maxApplicableCoins / 2))}
                        style={{
                          flex: 1, padding: '5px', borderRadius: '6px', border: '1px solid #fde68a',
                          background: 'white', color: '#92400e', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        Half
                      </button>
                      <button
                        onClick={() => setCoinsToUse(maxApplicableCoins)}
                        style={{
                          flex: 1, padding: '5px', borderRadius: '6px', border: '1px solid #fde68a',
                          background: 'white', color: '#92400e', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        Max ({maxApplicableCoins})
                      </button>
                    </div>
                  </div>
                )}

                {canPayFullyWithCoins && !useCoins && (
                  <div style={{
                    marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #fde68a',
                    textAlign: 'center',
                  }}>
                    <button
                      onClick={() => {
                        setUseCoins(true);
                        setCoinsToUse(coinsNeededForFullPayment);
                      }}
                      style={{
                        width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
                        background: 'linear-gradient(135deg, #d97706, #b45309)',
                        color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)',
                      }}
                    >
                      <Icon icon="lucide:coins" width={16} />
                      Buy Fully with {coinsNeededForFullPayment} Coins
                    </button>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#92400e' }}>
                      No cash payment needed — ₦{grandTotal.toLocaleString()} covered!
                    </p>
                  </div>
                )}
              </div>
            )}

            {userCoins === 0 && user && (
              <div style={{
                background: '#f9fafb', border: '1px solid #e5e7eb',
                borderRadius: '10px', padding: '10px 12px', marginBottom: '12px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <Icon icon="lucide:coins" width={16} color="#9ca3af" />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  You have no loyalty coins yet. Earn 1 coin for every ₦10,000 spent!{canSeeEngPricing ? " (Eng. prices < ₦10k excluded)" : ""}
                </span>
              </div>
            )}

            {coinsEarned > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff3cd', padding: '10px', borderRadius: '8px', marginBottom: '12px' }}>
                <Icon icon="lucide:coins" width={16} style={{ color: '#856404' }} />
                <span style={{ marginLeft: '8px', color: '#856404', fontSize: '13px', fontWeight: '600' }}>
                  You'll earn {coinsEarned} Coin{coinsEarned !== 1 ? 's' : ''} with this order!
                </span>
              </div>
            )}

            <div className="cart-shipping-form">
              <h4 className="cart-shipping-title">
                <Icon icon="lucide:map-pin" width={16} /> Delivery Details
              </h4>
              <div className="cart-shipping-grid">
                <input type="text" name="fullName" placeholder="Full Name *" value={shippingInfo.fullName} onChange={handleShippingChange} className="cart-input" />
                <input type="text" name="phone" placeholder="Phone Number *" value={shippingInfo.phone} onChange={handleShippingChange} className="cart-input" />
                <input type="text" name="street" placeholder="Street Address *" value={shippingInfo.street} onChange={handleShippingChange} className="cart-input span-2" />
                <input type="text" name="apartment" placeholder="Apartment/Suite (Optional)" value={shippingInfo.apartment} onChange={handleShippingChange} className="cart-input span-2" />
                <input type="text" name="city" placeholder="City *" value={shippingInfo.city} onChange={handleShippingChange} className="cart-input" />
                <input type="text" name="state" placeholder="State *" value={shippingInfo.state} onChange={handleShippingChange} className="cart-input" />
                <input type="text" name="zipCode" placeholder="Zip Code *" value={shippingInfo.zipCode} onChange={handleShippingChange} className="cart-input" />
              </div>
            </div>

            <div className="cart-summary-row">
              <span>Subtotal ({totalQty} items) <small style={{ fontWeight: 400, color: '#6b7280', display: 'block', marginTop: '2px' }}>{pricingTierLabel}</small></span>
              <span>₦{safeSubtotal.toLocaleString()}</span>
            </div>

            {totalSavings > 0 && (
              <div className="cart-summary-row text-green">
                <span>Discount Savings</span>
                <span>-₦{totalSavings.toLocaleString()}</span>
              </div>
            )}

            {coinsToUse > 0 && (
              <div className="cart-summary-row" style={{ color: '#d97706', fontWeight: 600 }}>
                <span>Coin Discount ({coinsToUse} coins)</span>
                <span>-₦{coinDiscount.toLocaleString()}</span>
              </div>
            )}

            <div className="cart-summary-divider" />

            <div className="cart-summary-row cart-summary-total">
              <span>{amountToPay === 0 ? 'Fully Covered by Coins' : 'Amount to Pay'}</span>
              <span style={{ color: amountToPay === 0 ? '#d97706' : undefined }}>
                {amountToPay === 0 ? `₦${grandTotal.toLocaleString()}` : `₦${amountToPay.toLocaleString()}`}
              </span>
            </div>

            {amountToPay > 0 && coinsToUse > 0 && (
              <div style={{
                fontSize: '11px', color: '#6b7280', textAlign: 'right',
                marginTop: '-4px', marginBottom: '8px',
              }}>
                You pay ₦{amountToPay.toLocaleString()} + {coinsToUse} coins
              </div>
            )}

            {error && (
              <div className="cart-error">
                <Icon icon="lucide:alert-circle" width={16} />
                {error}
              </div>
            )}

            {/* ✅ Payment Buttons */}
            {amountToPay === 0 && useCoins ? (
              /* ✅ Fully covered by coins */
              <button
                className="cart-checkout-btn"
                onClick={handleFullCoinPayment}
                disabled={placing || isSyncing}
                style={{
                  background: placing || isSyncing
                    ? '#9ca3af'
                    : 'linear-gradient(135deg, #d97706, #b45309)',
                }}
              >
                {placing || isSyncing ? (
                  <><Icon icon="lucide:loader-2" width={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
                ) : (
                  <><Icon icon="lucide:coins" width={16} /> Pay with {coinsToUse} Coins (₦{grandTotal.toLocaleString()})</>
                )}
              </button>
            ) : (
              <>
                {/* ✅ Paystack — Primary payment option */}
                <button
                  className="cart-checkout-btn"
                  onClick={handlePaystackPayment}
                  disabled={placing || isSyncing || amountToPay <= 0 || !PAYSTACK_PUBLIC_KEY}
                  style={{
                    background: (placing || isSyncing || !PAYSTACK_PUBLIC_KEY)
                      ? '#9ca3af'
                      : 'linear-gradient(135deg, #0ABF53, #089342)',
                  }}
                >
                  {paystackInit ? (
                    <><Icon icon="lucide:loader-2" width={16} style={{ animation: 'spin 1s linear infinite' }} /> Initializing...</>
                  ) : placing || isSyncing ? (
                    <><Icon icon="lucide:loader-2" width={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
                  ) : (
                    <>
                      <Icon icon="lucide:credit-card" width={16} />
                      Pay ₦{amountToPay.toLocaleString()} with Paystack
                      {coinsToUse > 0 && <span style={{ opacity: 0.85, marginLeft: '4px' }}>+ {coinsToUse} coins</span>}
                    </>
                  )}
                </button>

                {/* ✅ Paystack secure badges */}
                {amountToPay > 0 && PAYSTACK_PUBLIC_KEY && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '12px', margin: '6px 0 2px', fontSize: '11px', color: '#6b7280',
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Icon icon="lucide:shield-check" width={12} color="#0ABF53" /> Secure
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Icon icon="lucide:lock" width={12} color="#0ABF53" /> Encrypted
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Icon icon="lucide:zap" width={12} color="#0ABF53" /> Instant
                    </span>
                  </div>
                )}

                <div className="cart-or-divider">OR</div>

                {/* ✅ Bank Transfer */}
                <button
                  onClick={handleBankTransfer}
                  disabled={placing || isSyncing || amountToPay < 0}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '2px solid #f68b1e',
                    background: 'transparent',
                    color: '#f68b1e',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: placing || isSyncing ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                    opacity: placing || isSyncing ? 0.6 : 1,
                  }}
                >
                  {placing || isSyncing ? (
                    <Icon icon="lucide:loader-2" width={16} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <>
                      <Icon icon="lucide:building-2" width={16} />
                      Pay ₦{amountToPay.toLocaleString()} via Bank Transfer
                      {coinsToUse > 0 && <span style={{ opacity: 0.7, marginLeft: '2px' }}>+ {coinsToUse} coins</span>}
                    </>
                  )}
                </button>
              </>
            )}

            <div className="cart-or-divider">OR</div>

            <button
              onClick={handleWhatsAppOrder}
              disabled={placing || isSyncing}
              className="cart-whatsapp-btn"
            >
              {placing || isSyncing ? (
                <><Icon icon="lucide:loader-2" width={16} style={{ animation: 'spin 1s linear infinite' }} /> Placing Order...</>
              ) : (
                <><Icon icon="mdi:whatsapp" width={20} /> Order via WhatsApp</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="cart-mobile-sticky">
        {error && (
          <div className="cart-error">
            <Icon icon="lucide:alert-circle" width={16} />
            {error}
          </div>
        )}

        <div className={`cart-mobile-form-wrapper ${showMobileForm ? 'open' : ''}`}>
          <div className="cart-shipping-grid">
            <input type="text" name="fullName" placeholder="Full Name *" value={shippingInfo.fullName} onChange={handleShippingChange} className="cart-input" />
            <input type="text" name="phone" placeholder="Phone Number *" value={shippingInfo.phone} onChange={handleShippingChange} className="cart-input" />
            <input type="text" name="street" placeholder="Street Address *" value={shippingInfo.street} onChange={handleShippingChange} className="cart-input span-2" />
            <input type="text" name="apartment" placeholder="Apartment (Optional)" value={shippingInfo.apartment} onChange={handleShippingChange} className="cart-input span-2" />
            <input type="text" name="city" placeholder="City *" value={shippingInfo.city} onChange={handleShippingChange} className="cart-input" />
            <input type="text" name="state" placeholder="State *" value={shippingInfo.state} onChange={handleShippingChange} className="cart-input" />
            <input type="text" name="zipCode" placeholder="Zip Code *" value={shippingInfo.zipCode} onChange={handleShippingChange} className="cart-input span-2" />
          </div>
        </div>

        <div className="cart-mobile-actions">
          <button className="cart-mobile-details-btn" onClick={() => setShowMobileForm(!showMobileForm)}>
            <Icon icon="lucide:map-pin" width={16} />
            {showMobileForm ? 'Hide Details' : 'Delivery Details'}
          </button>
          <div className="cart-mobile-btn-group">
            {amountToPay === 0 && useCoins ? (
              <button
                onClick={handleFullCoinPayment}
                disabled={placing || isSyncing}
                style={{
                  padding: '10px 16px', borderRadius: '8px', border: 'none',
                  background: placing ? '#9ca3af' : 'linear-gradient(135deg, #d97706, #b45309)',
                  color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                {placing ? (
                  <Icon icon="lucide:loader-2" width={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <><Icon icon="lucide:coins" width={16} /> {coinsToUse} Coins</>
                )}
              </button>
            ) : (
              <>
                {/* ✅ Mobile Paystack button */}
                <button
                  onClick={handlePaystackPayment}
                  disabled={placing || isSyncing || amountToPay <= 0 || !PAYSTACK_PUBLIC_KEY}
                  className="cart-mobile-pay-btn"
                  style={{
                    background: (placing || isSyncing || !PAYSTACK_PUBLIC_KEY)
                      ? '#9ca3af'
                      : 'linear-gradient(135deg, #0ABF53, #089342)',
                  }}
                >
                  {paystackInit || placing || isSyncing ? (
                    <Icon icon="lucide:loader-2" width={16} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <>₦{amountToPay.toLocaleString()}</>
                  )}
                </button>
                {/* ✅ Mobile Bank Transfer button */}
                <button
                  onClick={handleBankTransfer}
                  disabled={placing || isSyncing}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '2px solid #f68b1e',
                    background: 'transparent',
                    color: '#f68b1e',
                    cursor: placing || isSyncing ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: placing || isSyncing ? 0.6 : 1,
                  }}
                  title="Pay via Bank Transfer"
                >
                  <Icon icon="lucide:building-2" width={18} />
                </button>
              </>
            )}
            <button
              onClick={handleWhatsAppOrder}
              disabled={placing || isSyncing}
              className="cart-mobile-whatsapp-btn"
            >
              <Icon icon="mdi:whatsapp" width={20} />
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}