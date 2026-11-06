
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Point from './Point';
import './Cart.css';

// ==========================================
// PRICING HELPERS
// ==========================================

const getEffectivePrice = (item, isEngineer = false) => {
  const price = Number(item.price) || 0;
  const discountPrice = Number(item.discountPrice) || 0;
  const engineeringPrice = Number(item.engineeringPrice) || 0;

  if (isEngineer && engineeringPrice > 0) {
    return engineeringPrice;
  }

  return discountPrice > 0 && discountPrice < price
    ? discountPrice
    : price;
};

// ==========================================
// BANK ACCOUNT DETAILS
// ==========================================

const BANK_ACCOUNTS = [
  {
    name: "Divine Vine-Edo",
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

  const canSeeEngPricing =
    user?.role === "admin" || user?.role === "engineer";

  const ADMIN_WHATSAPP_NUMBER = "2347033533320";

  // ==========================================
  // COMPONENT STATES
  // ==========================================

  const [backendPricing, setBackendPricing] = useState({});
  const [isPaid, setIsPaid] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [showMobileForm, setShowMobileForm] = useState(false);

  const [showBankModal, setShowBankModal] = useState(false);
  const [copiedField, setCopiedField] = useState("");

  const [monnifyInit, setMonnifyInit] = useState(false);

  const [deliverySettings, setDeliverySettings] = useState({
    deliveryFee: 2500,
  });

  // ==========================================
  // LOYALTY COINS
  // ==========================================

  const [userCoins, setUserCoins] = useState(0);
  const [useCoins, setUseCoins] = useState(false);
  const [coinsToUse, setCoinsToUse] = useState(0);

  // ==========================================
  // SHIPPING INFORMATION
  // ==========================================

  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    street: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Nigeria",
    phone: "",
  });

  const handleShippingChange = (e) => {
    setShippingInfo((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  // ==========================================
  // FETCH DELIVERY SETTINGS
  // ==========================================

  useEffect(() => {
    const fetchDeliverySettings = async () => {
      try {
        const { data } = await api.get('/settings');

        if (data?.delivery) {
          setDeliverySettings({
            deliveryFee:
              Number(data.delivery.deliveryFee) || 2500,
          });
        }
      } catch (err) {
        console.error(
          'Failed to fetch delivery settings:',
          err
        );
      }
    };

    fetchDeliverySettings();
  }, []);

  // ==========================================
  // FETCH USER COIN BALANCE
  // ==========================================

  useEffect(() => {
    if (!user) {
      setUserCoins(0);
      return;
    }

    const fetchCoins = async () => {
      try {
        const { data } = await api.get("/payments/balance");
        setUserCoins(data.coins || 0);
      } catch (err) {
        console.error("Failed to fetch coin balance:", err);
      }
    };

    fetchCoins();
  }, [user]);

  // ==========================================
  // FETCH BACKEND PRODUCT PRICING
  // ==========================================

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await api.get(
          '/products/discount-prices'
        );

        if (response.data) {
          const pricingMap = {};

          response.data.forEach((product) => {
            pricingMap[product._id] = {
              price: product.price,
              discountPrice: product.discountPrice,
              engineeringPrice: product.engineeringPrice,
            };
          });

          setBackendPricing(pricingMap);
        }
      } catch (err) {
        console.error('Error fetching pricing data:', err);
      }
    };

    if (cart.length > 0) {
      fetchPricing();
    }
  }, [cart]);

  // ==========================================
  // VALIDATED CART
  // ==========================================

  const validatedCart = cart.map((item) => {
    const productId =
      item.product?._id || item.product || item._id;

    const backendData = backendPricing[productId];

    return {
      ...item,
      price:
        backendData?.price !== undefined
          ? backendData.price
          : item.price,

      discountPrice:
        backendData?.discountPrice !== undefined
          ? backendData.discountPrice
          : item.discountPrice,

      engineeringPrice:
        backendData?.engineeringPrice !== undefined
          ? backendData.engineeringPrice
          : item.engineeringPrice,
    };
  });

  // ==========================================
  // SUBTOTAL AND SAVINGS
  // ==========================================

  const safeSubtotal = validatedCart.reduce(
    (sum, item) =>
      sum +
      getEffectivePrice(item, canSeeEngPricing) *
        (Number(item.quantity) || 1),
    0
  );

  const totalSavings = validatedCart.reduce(
    (sum, item) => {
      const price = Number(item.price) || 0;

      const effectivePrice = getEffectivePrice(
        item,
        canSeeEngPricing
      );

      if (effectivePrice > 0 && effectivePrice < price) {
        return (
          sum +
          (price - effectivePrice) *
            (Number(item.quantity) || 1)
        );
      }

      return sum;
    },
    0
  );

  const { deliveryFee: configuredDeliveryFee } =
    deliverySettings;

  const deliveryFee = configuredDeliveryFee;

  // Preserving your existing total calculation.
  const grandTotal = safeSubtotal;

  const pricingTierLabel =
    canSeeEngPricing &&
    validatedCart.some(
      (item) =>
        Number(item.engineeringPrice) > 0 &&
        Number(item.engineeringPrice) < Number(item.price)
    )
      ? "Engineer Pricing"
      : totalSavings > 0
        ? "Discounted Pricing"
        : "Standard Pricing";

  // ==========================================
  // COIN CALCULATIONS
  // ==========================================

  const maxApplicableCoins = Math.min(
    userCoins,
    Math.floor(grandTotal / 100)
  );

  const canPayFullyWithCoins =
    userCoins * 100 >= grandTotal;

  useEffect(() => {
    if (coinsToUse > maxApplicableCoins) {
      setCoinsToUse(maxApplicableCoins);
    }
  }, [maxApplicableCoins, coinsToUse]);

  const coinDiscount = coinsToUse * 100;

  const amountToPay = grandTotal - coinDiscount;

  let eligibleAmountForCoins = 0;

  validatedCart.forEach((item) => {
    const effectivePrice = getEffectivePrice(
      item,
      canSeeEngPricing
    );

    const safeQuantity = Number(item.quantity) || 1;

    const isEngPrice =
      canSeeEngPricing &&
      Number(item.engineeringPrice) > 0;

    if (
      isEngPrice &&
      Number(item.engineeringPrice) < 10000
    ) {
      return;
    }

    eligibleAmountForCoins +=
      effectivePrice * safeQuantity;
  });

  const coinsEarned = Math.floor(
    Math.max(0, eligibleAmountForCoins - coinDiscount) /
      10000
  );

  const coinsNeededForFullPayment =
    Math.ceil(grandTotal / 100);

  // ==========================================
  // PRODUCT ID HELPER
  // ==========================================

  const getProductId = (item) =>
    item.product?._id || item.product || item._id;

  // ==========================================
  // WHATSAPP ORDER MESSAGE
  // ==========================================

  const buildWhatsAppMessage = () => {
    let message =
      "Hello, I'd like to place an order:\n\n";

    validatedCart.forEach((item, index) => {
      const effectivePrice = getEffectivePrice(
        item,
        canSeeEngPricing
      );

      const safeQuantity =
        Number(item.quantity) || 1;

      message += `*${index + 1}. ${item.name}*\n`;

      message +=
        `   Qty: ${safeQuantity}  •  Price: ₦${
          (
            effectivePrice * safeQuantity
          ).toLocaleString()
        }\n\n`;
    });

    message += "____________________\n\n";

    message +=
      `*Subtotal (${pricingTierLabel}):* ₦${safeSubtotal.toLocaleString()}\n`;

    if (coinDiscount > 0) {
      message +=
        `*Coin Discount:* -₦${coinDiscount.toLocaleString()} (${coinsToUse} coins)\n`;
    }

    message +=
      `*Total to Pay:* ₦${amountToPay.toLocaleString()}\n\n`;

    message += "*Delivery Details:*\n";

    message += `Name: ${shippingInfo.fullName}\n`;

    message += `Address: ${shippingInfo.street}, ${shippingInfo.apartment}\n`;

    message +=
      `City: ${shippingInfo.city}, ${shippingInfo.state} ${shippingInfo.zipCode}\n`;

    message += `Phone: ${shippingInfo.phone}\n\n`;

    message +=
      "Please confirm availability and payment details. Thank you!";

    return message;
  };

  // ==========================================
  // BANK TRANSFER WHATSAPP MESSAGE
  // ==========================================

  const buildBankTransferWhatsAppMessage = (reference) => {
    let message = "🏦 *BANK TRANSFER NOTIFICATION*\n\n";

    message +=
      "I have made a bank transfer for my order:\n\n";

    message += "━━━━━━━━━━━━━━━━━━\n";
    message += "🛒 *ITEMS ORDERED:*\n\n";

    validatedCart.forEach((item, index) => {
      const effectivePrice = getEffectivePrice(
        item,
        canSeeEngPricing
      );

      const safeQuantity =
        Number(item.quantity) || 1;

      message += `*${index + 1}. ${item.name}*\n`;

      message +=
        `   Qty: ${safeQuantity}  •  ₦${
          (
            effectivePrice * safeQuantity
          ).toLocaleString()
        }\n\n`;
    });

    message += "━━━━━━━━━━━━━━━━━━\n\n";

    message += `*Pricing:* ${pricingTierLabel}\n`;

    message +=
      `*Subtotal:* ₦${safeSubtotal.toLocaleString()}\n`;

    if (coinDiscount > 0) {
      message +=
        `*Coin Discount:* -₦${coinDiscount.toLocaleString()} (${coinsToUse} coins)\n`;
    }

    message +=
      `*Amount Transferred:* ₦${amountToPay.toLocaleString()}\n\n`;

    message += "━━━━━━━━━━━━━━━━━━\n";
    message += "📦 *DELIVERY DETAILS:*\n\n";

    message += `👤 Name: ${shippingInfo.fullName}\n`;

    message +=
      `📍 Address: ${shippingInfo.street}${
        shippingInfo.apartment
          ? `, ${shippingInfo.apartment}`
          : ''
      }\n`;

    message +=
      `🏙️ City: ${shippingInfo.city}, ${shippingInfo.state}\n`;

    message += `📮 Zip: ${shippingInfo.zipCode}\n`;

    message += `📱 Phone: ${shippingInfo.phone}\n\n`;

    message += "━━━━━━━━━━━━━━━━━━\n";

    message += `🔢 *Order Ref:* ${reference}\n\n`;

    message +=
      "Please confirm receipt of payment. Thank you! 🙏";

    return message;
  };

  // ==========================================
  // SHIPPING VALIDATION
  // ==========================================

  const validateShipping = () => {
    const requiredFields = [
      "fullName",
      "street",
      "city",
      "state",
      "zipCode",
      "phone",
    ];

    const missingField = requiredFields.some(
      (field) => !String(shippingInfo[field] || "").trim()
    );

    if (missingField) {
      setError(
        "Please fill in all required delivery details."
      );

      return false;
    }

    setError("");

    return true;
  };

  // ==========================================
  // ORDER PAYLOAD
  // ==========================================

  const buildOrderPayload = (
    paymentMethod,
    transactionRef
  ) => ({
    items: validatedCart.map((item) => ({
      product: getProductId(item),
      name: item.name,
      image: item.image,
      price: getEffectivePrice(item, canSeeEngPricing),
      originalPrice: Number(item.price) || 0,
      engineeringPrice:
        Number(item.engineeringPrice) || undefined,
      quantity: Number(item.quantity) || 1,
    })),

    subtotal: safeSubtotal,
    deliveryFee,
    total: grandTotal,

    coinsUsed: coinsToUse,
    coinDiscount,

    amountPaid: amountToPay,

    paymentMethod,

    customerEmail: customerEmail || undefined,

    // Save the WhatsApp number for order notifications.
    whatsappPhone: shippingInfo.phone,

    bankTransferReference:
      paymentMethod === "bank_transfer"
        ? transactionRef
        : undefined,

    shippingAddress: shippingInfo,
  });

  // ==========================================
  // COPY TO CLIPBOARD
  // ==========================================

  const copyToClipboard = async (text, fieldKey) => {
    try {
      await navigator.clipboard.writeText(text);

      setCopiedField(fieldKey);

      setTimeout(() => setCopiedField(""), 2000);

    } catch (err) {
      const textarea =
        document.createElement("textarea");

      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";

      document.body.appendChild(textarea);

      textarea.select();

      try {
        document.execCommand("copy");

        setCopiedField(fieldKey);

        setTimeout(() => setCopiedField(""), 2000);

      } catch (copyError) {
        console.error("Failed to copy:", copyError);
      }

      document.body.removeChild(textarea);
    }
  };

  // ==========================================
  // MONNIFY PAYMENT
  // ==========================================

  // Create a pending order first, then initialize Monnify.
  const handleMonnifyPayment = async () => {
    if (placing) return;

    if (!user) {
      setError(
        "Please log in before making a Monnify payment."
      );
      return;
    }

    if (!validateShipping()) {
      setShowMobileForm(true);
      return;
    }

    if (amountToPay <= 0) {
      setError(
        "Amount must be greater than zero for Monnify payment."
      );
      return;
    }

    if (!customerEmail) {
      setError(
        "Your account must have an email address for Monnify payment."
      );
      return;
    }

    setPlacing(true);
    setMonnifyInit(true);
    setError("");

    let createdOrderId = null;

    try {
      const orderData = buildOrderPayload(
        "monnify",
        null
      );

      const orderResponse = await api.post(
        "/orders",
        orderData
      );

      const order = orderResponse.data?.order;

      if (!order?._id) {
        throw new Error(
          orderResponse.data?.message ||
          "Order was not created successfully. Please try again."
        );
      }

      createdOrderId = order._id;

      const paymentResponse = await api.post(
        "/payments/monnify/initialize",
        { orderId: createdOrderId }
      );

      const checkoutUrl =
        paymentResponse.data?.checkoutUrl;

      if (
        !paymentResponse.data?.success ||
        !checkoutUrl
      ) {
        throw new Error(
          paymentResponse.data?.message ||
          "Unable to initialize Monnify payment."
        );
      }

      // Keep the pending order.
      // The return page verifies payment before clearing the cart.
      window.location.assign(checkoutUrl);

    } catch (err) {
      console.error("Monnify payment error:", err);

      const message =
        err.response?.data?.message ||
        err.message ||
        "Unable to start Monnify payment.";

      setError(
        createdOrderId
          ? `${message} Your order reference is ${createdOrderId}. Please contact support if necessary.`
          : message
      );

      setPlacing(false);
      setMonnifyInit(false);
    }
  };

  // ==========================================
  // BANK TRANSFER
  // ==========================================

  const handleBankTransfer = () => {
    if (placing) return;

    if (!validateShipping()) {
      setShowMobileForm(true);
      return;
    }

    setShowBankModal(true);
  };

  // ==========================================
  // CONFIRM BANK TRANSFER
  // ==========================================

  const handleConfirmTransfer = async () => {
    if (placing) return;

    setPlacing(true);
    setError("");

    try {
      const reference =
        `BT-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 6)
          .toUpperCase()}`;

      const orderData = buildOrderPayload(
        "bank_transfer",
        reference
      );

      await api.post("/orders", orderData);

      const message =
        buildBankTransferWhatsAppMessage(reference);

      window.open(
        `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
        "_blank"
      );

      await clearCart();

      setShowBankModal(false);
      setIsPaid(true);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to place order. Please try again."
      );

    } finally {
      setPlacing(false);
    }
  };

  // ==========================================
  // FULL COIN PAYMENT
  // ==========================================

  const handleFullCoinPayment = async () => {
    if (placing) return;

    if (!validateShipping()) {
      setShowMobileForm(true);
      return;
    }

    setPlacing(true);
    setError("");

    try {
      const fullCoinsNeeded =
        Math.ceil(grandTotal / 100);

      const coinsForPayment = Math.min(
        userCoins,
        fullCoinsNeeded
      );

      const orderData = {
        items: validatedCart.map((item) => ({
          product: getProductId(item),
          name: item.name,
          image: item.image,
          price: getEffectivePrice(
            item,
            canSeeEngPricing
          ),
          originalPrice: Number(item.price) || 0,
          engineeringPrice:
            Number(item.engineeringPrice) || undefined,
          quantity: Number(item.quantity) || 1,
        })),

        subtotal: safeSubtotal,
        deliveryFee,
        total: grandTotal,

        coinsUsed: coinsForPayment,
        coinDiscount: coinsForPayment * 100,

        amountPaid: 0,

        paymentMethod: "coins",

        whatsappPhone: shippingInfo.phone,

        bankTransferReference: undefined,

        shippingAddress: shippingInfo,
      };

      await api.post("/orders", orderData);

      await clearCart();

      setIsPaid(true);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to place order with coins."
      );

    } finally {
      setPlacing(false);
    }
  };

  // ==========================================
  // WHATSAPP ORDER
  // ==========================================

  const handleWhatsAppOrder = async () => {
    if (placing) return;

    if (!validateShipping()) {
      setShowMobileForm(true);
      return;
    }

    setPlacing(true);
    setError("");

    try {
      const message = buildWhatsAppMessage();

      window.open(
        `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
        "_blank"
      );

      try {
        const orderData = buildOrderPayload(
          "whatsapp",
          null
        );

        await api.post("/orders", orderData);

      } catch (saveErr) {
        console.warn(
          "Order not saved to DB, but WhatsApp opened:",
          saveErr
        );
      }

      await clearCart();

      setIsPaid(true);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Something went wrong."
      );

    } finally {
      setPlacing(false);
    }
  };

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (isLoading) {
    return (
      <div
        className="cart-empty"
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon
          icon="lucide:loader-2"
          width={40}
          style={{
            animation: 'spin 1s linear infinite',
            color: '#f68b1e',
          }}
        />

        <p style={{ marginTop: '16px', color: '#666' }}>
          Loading your cart...
        </p>

        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // ==========================================
  // ORDER SUCCESS
  // ==========================================

  if (isPaid) {
    return (
      <div className="cart-empty">
        <Icon
          icon="lucide:check-circle"
          width={64}
          style={{ color: '#25D366' }}
        />

        <h2>Order Placed Successfully!</h2>

        <p>
          Thank you for your purchase.
          We are processing your order.
        </p>

        <Link to="/" className="cart-empty-btn">
          Continue Shopping
        </Link>
      </div>
    );
  }

  // ==========================================
  // EMPTY CART
  // ==========================================

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <Icon
          icon="lucide:shopping-cart"
          width={64}
        />

        <h2>Your cart is empty</h2>

        <p>
          Looks like you have not added anything to your cart.
        </p>

        <Link to="/" className="cart-empty-btn">
          Continue Shopping
        </Link>
      </div>
    );
  }

  // ==========================================
  // MAIN COMPONENT
  // ==========================================

  return (
    <div className="cart-page">

      {isSyncing && (
        <div className="cart-sync-banner">
          <Icon
            icon="lucide:loader-2"
            width={14}
            style={{
              animation: 'spin 1s linear infinite',
            }}
          />
          Saving cart...
        </div>
      )}

      {/* ======================================
          BANK TRANSFER MODAL
      ====================================== */}

      {showBankModal && (
        <div
          className="bank-modal-overlay"
          onClick={() => {
            if (!placing) setShowBankModal(false);
          }}
        >
          <div
            className="bank-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="bank-modal-close"
              onClick={() => setShowBankModal(false)}
              disabled={placing}
            >
              <Icon icon="lucide:x" width={20} />
            </button>

            <div className="bank-modal-header">
              <div className="bank-modal-icon-wrap">
                <Icon
                  icon="lucide:building-2"
                  width={28}
                  color="#f68b1e"
                />
              </div>

              <h2>Bank Transfer Details</h2>

              <p>
                Transfer the exact amount below to the account.
              </p>
            </div>

            <div className="bank-modal-amount">
              <span className="bank-modal-amount-label">
                Amount to Pay
              </span>

              <span className="bank-modal-amount-value">
                ₦{amountToPay.toLocaleString()}
              </span>

              {coinsToUse > 0 && (
                <span className="bank-modal-amount-coins">
                  + {coinsToUse} coins applied
                  (₦{coinDiscount.toLocaleString()} off)
                </span>
              )}
            </div>

            <div className="bank-modal-accounts">
              {BANK_ACCOUNTS.map((account, index) => (
                <div
                  key={index}
                  className="bank-account-card"
                >
                  <div className="bank-account-top">
                    <div
                      className="bank-account-icon"
                      style={{
                        background: `${account.color}15`,
                        color: account.color,
                      }}
                    >
                      <Icon
                        icon={account.icon}
                        width={18}
                      />
                    </div>

                    <span
                      className="bank-account-bank"
                      style={{ color: account.color }}
                    >
                      {account.bank}
                    </span>
                  </div>

                  <div className="bank-account-field">
                    <span className="bank-account-label">
                      Account Name
                    </span>

                    <div className="bank-account-value-row">
                      <span className="bank-account-value">
                        {account.name}
                      </span>

                      <button
                        className={`bank-copy-btn ${
                          copiedField === `name-${index}`
                            ? "copied"
                            : ""
                        }`}
                        onClick={() =>
                          copyToClipboard(
                            account.name,
                            `name-${index}`
                          )
                        }
                      >
                        <Icon
                          icon={
                            copiedField === `name-${index}`
                              ? "lucide:check"
                              : "lucide:copy"
                          }
                          width={14}
                        />

                        {copiedField === `name-${index}`
                          ? "Copied"
                          : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div className="bank-account-field">
                    <span className="bank-account-label">
                      Account Number
                    </span>

                    <div className="bank-account-value-row">
                      <span className="bank-account-value bank-account-number">
                        {account.accountNumber}
                      </span>

                      <button
                        className={`bank-copy-btn ${
                          copiedField === `acc-${index}`
                            ? "copied"
                            : ""
                        }`}
                        onClick={() =>
                          copyToClipboard(
                            account.accountNumber,
                            `acc-${index}`
                          )
                        }
                      >
                        <Icon
                          icon={
                            copiedField === `acc-${index}`
                              ? "lucide:check"
                              : "lucide:copy"
                          }
                          width={14}
                        />

                        {copiedField === `acc-${index}`
                          ? "Copied"
                          : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bank-modal-notice">
              <Icon icon="lucide:info" width={16} />

              <span>
                Transfer exactly{" "}
                <strong>
                  ₦{amountToPay.toLocaleString()}
                </strong>
                {" "}then click the button below.
                Your order and transfer reference will
                be sent to us through WhatsApp.
              </span>
            </div>

            <div className="bank-modal-actions">
              <button
                className="bank-modal-confirm-btn"
                onClick={handleConfirmTransfer}
                disabled={placing}
              >
                {placing ? (
                  <>
                    <Icon
                      icon="lucide:loader-2"
                      width={16}
                      className="cart-spin"
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    <Icon
                      icon="mdi:whatsapp"
                      width={18}
                    />
                    I've Made the Transfer — Send on WhatsApp
                  </>
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

        {/* ======================================
            LEFT: CART ITEMS
        ====================================== */}

        <div className="cart-items-section">

          <div className="cart-header">
            <h2>Shopping Cart ({totalQty})</h2>
          </div>

          <Point />

          {validatedCart.map((item) => {
            const productId = getProductId(item);

            const safePrice =
              Number(item.price) || 0;

            const safeEngineeringPrice =
              Number(item.engineeringPrice) || 0;

            const effectivePrice = getEffectivePrice(
              item,
              canSeeEngPricing
            );

            const safeQuantity =
              Number(item.quantity) || 1;

            const itemTotal =
              effectivePrice * safeQuantity;

            const hasDiscount =
              effectivePrice < safePrice;

            const isEngPrice =
              canSeeEngPricing &&
              safeEngineeringPrice > 0 &&
              safeEngineeringPrice < safePrice;

            return (
              <div
                key={item._id || productId}
                className="cart-item"
              >
                <Link
                  to={`/product/${productId}`}
                  className="cart-item-img"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                  />
                </Link>

                <div className="cart-item-details">
                  <div>
                    <Link
                      to={`/product/${productId}`}
                      className="cart-item-name"
                    >
                      {item.name}
                    </Link>

                    <p className="cart-item-sold">
                      Sold by Divine Vine-Edo
                    </p>
                  </div>

                  <div className="cart-item-bottom">
                    <div className="cart-qty-control">
                      <button
                        onClick={() =>
                          updateCartQty(
                            productId,
                            safeQuantity - 1
                          )
                        }
                        disabled={
                          safeQuantity <= 1 || isSyncing
                        }
                        className="cart-qty-btn"
                      >
                        <Icon
                          icon="lucide:minus"
                          width={14}
                        />
                      </button>

                      <span className="cart-qty-num">
                        {safeQuantity}
                      </span>

                      <button
                        onClick={() =>
                          updateCartQty(
                            productId,
                            safeQuantity + 1
                          )
                        }
                        disabled={isSyncing}
                        className="cart-qty-btn"
                      >
                        <Icon
                          icon="lucide:plus"
                          width={14}
                        />
                      </button>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                      }}
                    >
                      {hasDiscount && (
                        <span
                          style={{
                            fontSize: '12px',
                            color: '#999',
                            textDecoration: 'line-through',
                            marginBottom: '2px',
                          }}
                        >
                          ₦{(
                            safePrice * safeQuantity
                          ).toLocaleString()}
                        </span>
                      )}

                      <span className="cart-item-total">
                        ₦{itemTotal.toLocaleString()}
                      </span>

                      {hasDiscount && (
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#e8590c',
                            marginTop: '1px',
                          }}
                        >
                          ₦{effectivePrice.toLocaleString()}
                          {" "}
                          {isEngPrice
                            ? 'eng. price'
                            : 'each'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    removeFromCart(productId)
                  }
                  className="cart-item-remove"
                  disabled={isSyncing}
                  aria-label="Remove item"
                >
                  <Icon
                    icon="lucide:trash-2"
                    width={18}
                  />
                </button>
              </div>
            );
          })}

          {totalSavings > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#d4edda',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '10px',
                marginTop: '10px',
              }}
            >
              <Icon
                icon="lucide:tag"
                width={16}
                style={{ color: '#155724' }}
              />

              <span
                style={{
                  marginLeft: '8px',
                  color: '#155724',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                You're saving ₦
                {totalSavings.toLocaleString()}
                {" "}with {pricingTierLabel}!
              </span>
            </div>
          )}
        </div>

        {/* ======================================
            RIGHT: ORDER SUMMARY
        ====================================== */}

        <div className="cart-summary-section">
          <div className="cart-summary-card">

            <h3>Order Summary</h3>

            <Point />

            {/* ==================================
                LOYALTY COINS
            ================================== */}

            {userCoins > 0 && (
              <div
                style={{
                  background:
                    'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                  border: '1px solid #fcd34d',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(217, 119, 6, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon
                        icon="lucide:coins"
                        width={16}
                        color="#d97706"
                      />
                    </div>

                    <div>
                      <span
                        style={{
                          fontWeight: 700,
                          color: '#92400e',
                          fontSize: '14px',
                          display: 'block',
                        }}
                      >
                        Loyalty Coins
                      </span>

                      <span
                        style={{
                          fontSize: '11px',
                          color: '#b45309',
                        }}
                      >
                        {userCoins} coins available
                        {" "}(
                        ₦{(
                          userCoins * 100
                        ).toLocaleString()} value)
                      </span>
                    </div>
                  </div>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      background: useCoins
                        ? '#d97706'
                        : 'transparent',
                      border: useCoins
                        ? 'none'
                        : '2px solid #d97706',
                      borderRadius: '20px',
                      padding: '5px 14px',
                      transition: 'all 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={useCoins}
                      onChange={(e) => {
                        setUseCoins(e.target.checked);

                        if (e.target.checked) {
                          setCoinsToUse(maxApplicableCoins);
                        } else {
                          setCoinsToUse(0);
                        }
                      }}
                      style={{ display: 'none' }}
                    />

                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: useCoins ? '#fff' : '#d97706',
                      }}
                    >
                      {useCoins ? 'Applied' : 'Use Coins'}
                    </span>
                  </label>
                </div>

                {useCoins && (
                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '10px',
                      borderTop: '1px solid #fde68a',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '6px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#92400e',
                          fontWeight: 600,
                        }}
                      >
                        How many coins to use?
                      </span>

                      <span
                        style={{
                          fontSize: '12px',
                          color: '#b45309',
                          fontWeight: 700,
                        }}
                      >
                        {coinsToUse} coins = ₦
                        {(coinsToUse * 100).toLocaleString()}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max={maxApplicableCoins}
                      value={coinsToUse}
                      onChange={(e) =>
                        setCoinsToUse(
                          parseInt(e.target.value, 10)
                        )
                      }
                      style={{
                        width: '100%',
                        accentColor: '#d97706',
                        height: '6px',
                      }}
                    />

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        color: '#92400e',
                        marginTop: '4px',
                      }}
                    >
                      <span>0</span>
                      <span>{maxApplicableCoins} max</span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: '6px',
                        marginTop: '8px',
                      }}
                    >
                      <button
                        onClick={() => setCoinsToUse(0)}
                        className="cart-coin-action"
                      >
                        None
                      </button>

                      <button
                        onClick={() =>
                          setCoinsToUse(
                            Math.floor(
                              maxApplicableCoins / 2
                            )
                          )
                        }
                        className="cart-coin-action"
                      >
                        Half
                      </button>

                      <button
                        onClick={() =>
                          setCoinsToUse(maxApplicableCoins)
                        }
                        className="cart-coin-action"
                      >
                        Max ({maxApplicableCoins})
                      </button>
                    </div>
                  </div>
                )}

                {canPayFullyWithCoins && !useCoins && (
                  <div
                    style={{
                      marginTop: '10px',
                      paddingTop: '10px',
                      borderTop: '1px solid #fde68a',
                      textAlign: 'center',
                    }}
                  >
                    <button
                      onClick={() => {
                        setUseCoins(true);
                        setCoinsToUse(
                          coinsNeededForFullPayment
                        );
                      }}
                      className="cart-full-coin-btn"
                    >
                      <Icon
                        icon="lucide:coins"
                        width={16}
                      />

                      Buy Fully with {coinsNeededForFullPayment} Coins
                    </button>

                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: '11px',
                        color: '#92400e',
                      }}
                    >
                      No cash payment needed.
                    </p>
                  </div>
                )}
              </div>
            )}

            {userCoins === 0 && user && (
              <div className="cart-no-coins">
                <Icon
                  icon="lucide:coins"
                  width={16}
                  color="#9ca3af"
                />

                <span>
                  You have no loyalty coins yet.
                  Earn 1 coin for every ₦10,000 spent!
                  {canSeeEngPricing
                    ? " (Engineering prices below ₦10k excluded)"
                    : ""}
                </span>
              </div>
            )}

            {coinsEarned > 0 && (
              <div className="cart-coins-earned">
                <Icon
                  icon="lucide:coins"
                  width={16}
                />

                You'll earn {coinsEarned} Coin
                {coinsEarned !== 1 ? 's' : ''} with this order!
              </div>
            )}

            {/* ==================================
                DELIVERY DETAILS
            ================================== */}

            <div className="cart-shipping-form">
              <h4 className="cart-shipping-title">
                <Icon
                  icon="lucide:map-pin"
                  width={16}
                />
                Delivery Details
              </h4>

              <div className="cart-shipping-grid">
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name *"
                  value={shippingInfo.fullName}
                  onChange={handleShippingChange}
                  className="cart-input"
                />

                <input
                  type="tel"
                  name="phone"
                  placeholder="WhatsApp / Phone Number *"
                  value={shippingInfo.phone}
                  onChange={handleShippingChange}
                  className="cart-input"
                />

                <input
                  type="text"
                  name="street"
                  placeholder="Street Address *"
                  value={shippingInfo.street}
                  onChange={handleShippingChange}
                  className="cart-input span-2"
                />

                <input
                  type="text"
                  name="apartment"
                  placeholder="Apartment/Suite (Optional)"
                  value={shippingInfo.apartment}
                  onChange={handleShippingChange}
                  className="cart-input span-2"
                />

                <input
                  type="text"
                  name="city"
                  placeholder="City *"
                  value={shippingInfo.city}
                  onChange={handleShippingChange}
                  className="cart-input"
                />

                <input
                  type="text"
                  name="state"
                  placeholder="State *"
                  value={shippingInfo.state}
                  onChange={handleShippingChange}
                  className="cart-input"
                />

                <input
                  type="text"
                  name="zipCode"
                  placeholder="Zip Code *"
                  value={shippingInfo.zipCode}
                  onChange={handleShippingChange}
                  className="cart-input"
                />
              </div>
            </div>

            {/* ==================================
                ORDER TOTALS
            ================================== */}

            <div className="cart-summary-row">
              <span>
                Subtotal ({totalQty} items)
                <small
                  style={{
                    fontWeight: 400,
                    color: '#6b7280',
                    display: 'block',
                    marginTop: '2px',
                  }}
                >
                  {pricingTierLabel}
                </small>
              </span>

              <span>
                ₦{safeSubtotal.toLocaleString()}
              </span>
            </div>

            {totalSavings > 0 && (
              <div className="cart-summary-row text-green">
                <span>Discount Savings</span>

                <span>
                  -₦{totalSavings.toLocaleString()}
                </span>
              </div>
            )}

            {coinsToUse > 0 && (
              <div
                className="cart-summary-row"
                style={{
                  color: '#d97706',
                  fontWeight: 600,
                }}
              >
                <span>
                  Coin Discount ({coinsToUse} coins)
                </span>

                <span>
                  -₦{coinDiscount.toLocaleString()}
                </span>
              </div>
            )}

            <div className="cart-summary-divider" />

            <div className="cart-summary-row cart-summary-total">
              <span>
                {amountToPay === 0
                  ? 'Fully Covered by Coins'
                  : 'Amount to Pay'}
              </span>

              <span
                style={{
                  color:
                    amountToPay === 0
                      ? '#d97706'
                      : undefined,
                }}
              >
                {amountToPay === 0
                  ? `₦${grandTotal.toLocaleString()}`
                  : `₦${amountToPay.toLocaleString()}`}
              </span>
            </div>

            {amountToPay > 0 && coinsToUse > 0 && (
              <div className="cart-payment-breakdown">
                You pay ₦{amountToPay.toLocaleString()}
                {" "}+ {coinsToUse} coins
              </div>
            )}

            {error && (
              <div className="cart-error">
                <Icon
                  icon="lucide:alert-circle"
                  width={16}
                />
                {error}
              </div>
            )}

            {/* ==================================
                PAYMENT OPTIONS
            ================================== */}

            <div className="cart-payment-section">

              <div className="cart-payment-heading">
                <h4>Choose Your Payment Method</h4>

                <p>
                  Select how you would like to pay
                  for your order.
                </p>
              </div>

              {amountToPay === 0 && useCoins ? (
                <button
                  className="cart-checkout-btn cart-coin-checkout"
                  onClick={handleFullCoinPayment}
                  disabled={placing || isSyncing}
                >
                  {placing || isSyncing ? (
                    <>
                      <Icon
                        icon="lucide:loader-2"
                        width={17}
                        className="cart-spin"
                      />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Icon
                        icon="lucide:coins"
                        width={18}
                      />
                      Pay with {coinsToUse} Coins
                      (₦{grandTotal.toLocaleString()})
                    </>
                  )}
                </button>
              ) : (
                <div className="cart-payment-methods">

                  {/* MONNIFY */}

                  <button
                    type="button"
                    className="cart-payment-option cart-payment-monnify"
                    onClick={handleMonnifyPayment}
                    disabled={
                      placing ||
                      isSyncing ||
                      amountToPay <= 0 ||
                      !user ||
                      !customerEmail
                    }
                  >
                    <span className="cart-payment-icon">
                      <Icon
                        icon="lucide:shield-check"
                        width={25}
                      />
                    </span>

                    <span className="cart-payment-content">
                      <strong>Pay with Monnify</strong>

                      <small>
                        Secure online payment
                      </small>

                      <small className="cart-payment-hint">
                        Card, bank transfer and supported payment channels
                      </small>
                    </span>

                    <span className="cart-payment-arrow">
                      {monnifyInit ? (
                        <Icon
                          icon="lucide:loader-2"
                          width={19}
                          className="cart-spin"
                        />
                      ) : (
                        <Icon
                          icon="lucide:arrow-right"
                          width={20}
                        />
                      )}
                    </span>
                  </button>

                  {!user && (
                    <p className="cart-payment-notice">
                      <Icon
                        icon="lucide:info"
                        width={14}
                      />
                      Log in to use Monnify.
                    </p>
                  )}

                  {user && !customerEmail && (
                    <p className="cart-payment-notice">
                      <Icon
                        icon="lucide:info"
                        width={14}
                      />
                      Add an email address to your account
                      to use Monnify.
                    </p>
                  )}

                  {/* BANK TRANSFER */}

                  <button
                    type="button"
                    className="cart-payment-option cart-payment-bank"
                    onClick={handleBankTransfer}
                    disabled={
                      placing ||
                      isSyncing ||
                      amountToPay < 0
                    }
                  >
                    <span className="cart-payment-icon">
                      <Icon
                        icon="lucide:landmark"
                        width={25}
                      />
                    </span>

                    <span className="cart-payment-content">
                      <strong>Direct Bank Transfer</strong>

                      <small>
                        Transfer to our bank account
                      </small>

                      <small className="cart-payment-hint">
                        Account details and copy buttons provided
                      </small>
                    </span>

                    <span className="cart-payment-arrow">
                      <Icon
                        icon="lucide:arrow-right"
                        width={20}
                      />
                    </span>
                  </button>

                  {/* WHATSAPP */}

                  <button
                    type="button"
                    className="cart-payment-option cart-payment-whatsapp"
                    onClick={handleWhatsAppOrder}
                    disabled={placing || isSyncing}
                  >
                    <span className="cart-payment-icon">
                      <Icon
                        icon="mdi:whatsapp"
                        width={27}
                      />
                    </span>

                    <span className="cart-payment-content">
                      <strong>Order via WhatsApp</strong>

                      <small>
                        Chat with our sales team
                      </small>

                      <small className="cart-payment-hint">
                        Confirm product availability and payment details
                      </small>
                    </span>

                    <span className="cart-payment-arrow">
                      <Icon
                        icon="lucide:arrow-right"
                        width={20}
                      />
                    </span>
                  </button>

                </div>
              )}

              <div className="cart-payment-security">
                <Icon
                  icon="lucide:shield-check"
                  width={15}
                />

                Secure checkout. Your order details
                are processed through our backend.
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ======================================
          MOBILE STICKY CHECKOUT BAR
      ====================================== */}

      <div className="cart-mobile-sticky">

        {error && (
          <div className="cart-error">
            <Icon
              icon="lucide:alert-circle"
              width={16}
            />
            {error}
          </div>
        )}

        <div
          className={`cart-mobile-form-wrapper ${
            showMobileForm ? 'open' : ''
          }`}
        >
          <div className="cart-shipping-grid">

            <input
              type="text"
              name="fullName"
              placeholder="Full Name *"
              value={shippingInfo.fullName}
              onChange={handleShippingChange}
              className="cart-input"
            />

            <input
              type="tel"
              name="phone"
              placeholder="WhatsApp / Phone Number *"
              value={shippingInfo.phone}
              onChange={handleShippingChange}
              className="cart-input"
            />

            <input
              type="text"
              name="street"
              placeholder="Street Address *"
              value={shippingInfo.street}
              onChange={handleShippingChange}
              className="cart-input span-2"
            />

            <input
              type="text"
              name="apartment"
              placeholder="Apartment (Optional)"
              value={shippingInfo.apartment}
              onChange={handleShippingChange}
              className="cart-input span-2"
            />

            <input
              type="text"
              name="city"
              placeholder="City *"
              value={shippingInfo.city}
              onChange={handleShippingChange}
              className="cart-input"
            />

            <input
              type="text"
              name="state"
              placeholder="State *"
              value={shippingInfo.state}
              onChange={handleShippingChange}
              className="cart-input"
            />

            <input
              type="text"
              name="zipCode"
              placeholder="Zip Code *"
              value={shippingInfo.zipCode}
              onChange={handleShippingChange}
              className="cart-input span-2"
            />
          </div>
        </div>

        <div className="cart-mobile-actions">

          <button
            className="cart-mobile-details-btn"
            onClick={() =>
              setShowMobileForm(!showMobileForm)
            }
          >
            <Icon
              icon="lucide:map-pin"
              width={16}
            />

            {showMobileForm
              ? 'Hide Details'
              : 'Delivery Details'}
          </button>

          <div className="cart-mobile-payment-label">
            {amountToPay === 0 && useCoins
              ? 'Pay with coins'
              : `Choose payment · ₦${amountToPay.toLocaleString()}`}
          </div>

          <div className="cart-mobile-btn-group">

            {amountToPay === 0 && useCoins ? (
              <button
                onClick={handleFullCoinPayment}
                disabled={placing || isSyncing}
                className="cart-mobile-method-btn cart-mobile-coins"
              >
                {placing ? (
                  <Icon
                    icon="lucide:loader-2"
                    width={17}
                    className="cart-spin"
                  />
                ) : (
                  <>
                    <Icon
                      icon="lucide:coins"
                      width={17}
                    />
                    Coins
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={handleMonnifyPayment}
                  disabled={
                    placing ||
                    isSyncing ||
                    amountToPay <= 0 ||
                    !user ||
                    !customerEmail
                  }
                  className="cart-mobile-method-btn cart-mobile-monnify"
                >
                  {monnifyInit ? (
                    <Icon
                      icon="lucide:loader-2"
                      width={17}
                      className="cart-spin"
                    />
                  ) : (
                    <>
                      <Icon
                        icon="lucide:shield-check"
                        width={17}
                      />
                      Monnify
                    </>
                  )}
                </button>

                <button
                  onClick={handleBankTransfer}
                  disabled={
                    placing ||
                    isSyncing ||
                    amountToPay < 0
                  }
                  className="cart-mobile-method-btn cart-mobile-bank"
                >
                  <Icon
                    icon="lucide:landmark"
                    width={17}
                  />
                  Bank
                </button>

                <button
                  onClick={handleWhatsAppOrder}
                  disabled={placing || isSyncing}
                  className="cart-mobile-method-btn cart-mobile-whatsapp"
                >
                  <Icon
                    icon="mdi:whatsapp"
                    width={19}
                  />
                  WhatsApp
                </button>
              </>
            )}

          </div>
        </div>
      </div>

      {/* ======================================
          COMPONENT STYLES
      ====================================== */}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .cart-spin {
            animation: spin 1s linear infinite;
          }

          .cart-payment-section {
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
          }

          .cart-payment-heading {
            margin-bottom: 14px;
          }

          .cart-payment-heading h4 {
            margin: 0 0 5px;
            font-size: 16px;
            font-weight: 800;
            color: #202124;
          }

          .cart-payment-heading p {
            margin: 0;
            font-size: 12px;
            color: #6b7280;
            line-height: 1.5;
          }

          .cart-payment-methods {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .cart-payment-option {
            width: 100%;
            min-height: 76px;
            padding: 13px 14px;
            display: flex;
            align-items: center;
            gap: 12px;
            text-align: left;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            background: #fff;
            color: #202124;
            cursor: pointer;
            transition: border-color .2s, background .2s, transform .2s;
          }

          .cart-payment-option:hover:not(:disabled) {
            transform: translateY(-1px);
            border-color: #f68b1e;
            background: #fffdf9;
          }

          .cart-payment-option:disabled {
            opacity: .55;
            cursor: not-allowed;
          }

          .cart-payment-icon {
            width: 44px;
            height: 44px;
            flex-shrink: 0;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .cart-payment-monnify {
            border: 2px solid #0756a5;
            background: #f5f9ff;
          }

          .cart-payment-monnify .cart-payment-icon {
            background: #e1edff;
            color: #0756a5;
          }

          .cart-payment-bank .cart-payment-icon {
            background: #fff1df;
            color: #d97706;
          }

          .cart-payment-whatsapp .cart-payment-icon {
            background: #e5f9ed;
            color: #159447;
          }

          .cart-payment-content {
            min-width: 0;
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 3px;
          }

          .cart-payment-content strong {
            font-size: 14px;
            font-weight: 800;
          }

          .cart-payment-content small {
            font-size: 11px;
            color: #60656f;
            line-height: 1.4;
          }

          .cart-payment-content .cart-payment-hint {
            font-size: 10px;
            color: #858b95;
          }

          .cart-payment-arrow {
            flex-shrink: 0;
            color: #737984;
            display: flex;
            align-items: center;
          }

          .cart-payment-monnify .cart-payment-arrow {
            color: #0756a5;
          }

          .cart-payment-notice {
            display: flex;
            align-items: flex-start;
            gap: 6px;
            margin: -3px 0 2px;
            font-size: 11px;
            line-height: 1.5;
            color: #a16207;
          }

          .cart-payment-notice svg {
            flex-shrink: 0;
            margin-top: 1px;
          }

          .cart-payment-security {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            margin-top: 13px;
            font-size: 10px;
            line-height: 1.5;
            text-align: center;
            color: #737984;
          }

          .cart-payment-security svg {
            flex-shrink: 0;
            color: #159447;
          }

          .cart-payment-breakdown {
            font-size: 11px;
            color: #6b7280;
            text-align: right;
            margin: -4px 0 8px;
          }

          .cart-coin-action {
            flex: 1;
            padding: 7px 4px;
            border-radius: 6px;
            border: 1px solid #fde68a;
            background: white;
            color: #92400e;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
          }

          .cart-full-coin-btn {
            width: 100%;
            padding: 10px;
            border-radius: 8px;
            border: none;
            background: linear-gradient(135deg, #d97706, #b45309);
            color: #fff;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }

          .cart-coin-checkout {
            background: linear-gradient(135deg, #d97706, #b45309);
          }

          .cart-no-coins,
          .cart-coins-earned {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 12px;
            border-radius: 9px;
            margin-bottom: 12px;
            font-size: 12px;
            line-height: 1.5;
          }

          .cart-no-coins {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            color: #6b7280;
          }

          .cart-coins-earned {
            background: #fff3cd;
            color: #856404;
            font-weight: 600;
          }

          .cart-mobile-payment-label {
            width: 100%;
            margin: 8px 0 6px;
            text-align: center;
            font-size: 11px;
            font-weight: 700;
            color: #555;
          }

          .cart-mobile-method-btn {
            min-height: 42px;
            flex: 1;
            padding: 8px 10px;
            border: none;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
            cursor: pointer;
          }

          .cart-mobile-method-btn:disabled {
            opacity: .5;
            cursor: not-allowed;
          }

          .cart-mobile-monnify {
            background: #0756a5;
            color: #fff;
          }

          .cart-mobile-bank {
            background: #fff1df;
            color: #b45309;
            border: 1px solid #f68b1e;
          }

          .cart-mobile-whatsapp {
            background: #25D366;
            color: #fff;
          }

          .cart-mobile-coins {
            background: #d97706;
            color: #fff;
          }

          @media (max-width: 600px) {
            .cart-payment-option {
              min-height: 70px;
              padding: 11px;
              gap: 10px;
            }

            .cart-payment-icon {
              width: 40px;
              height: 40px;
            }

            .cart-payment-content strong {
              font-size: 13px;
            }

            .cart-payment-content small {
              font-size: 10px;
            }

            .cart-mobile-btn-group {
              width: 100%;
              display: flex;
              gap: 6px;
            }

            .cart-mobile-method-btn {
              padding: 9px 5px;
              font-size: 10px;
            }

            .cart-mobile-actions {
              flex-wrap: wrap;
            }
          }

          @media (max-width: 360px) {
            .cart-mobile-method-btn {
              gap: 3px;
              font-size: 9px;
              padding: 8px 3px;
            }
          }
        `}
      </style>
    </div>
  );
}
