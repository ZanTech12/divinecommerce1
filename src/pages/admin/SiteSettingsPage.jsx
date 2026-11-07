
import { useState } from "react";
import { Icon } from "@iconify/react";
import api from "../../api/axios";
import Toast from "./Toast";
import companyLogo from "../../assets/Divine Vine edo logo.png";
import "./SiteSettingsPage.css";

export default function SiteSettingsPage({ initialSettings }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeSection, setActiveSection] = useState("company");

  const [form, setForm] = useState({
    companyName: initialSettings?.companyName || "",
    companyTagline: initialSettings?.companyTagline || "",
    address: initialSettings?.address || "",
    phone: initialSettings?.phone || "",
    phone2: initialSettings?.phone2 || "",
    email: initialSettings?.email || "",
    whatsapp: initialSettings?.whatsapp || "",
    facebook: initialSettings?.facebook || "",
    instagram: initialSettings?.instagram || "",
    twitter: initialSettings?.twitter || "",
    tiktok: initialSettings?.tiktok || "",
    youtube: initialSettings?.youtube || "",
    currency: initialSettings?.currency || "₦",
    freeDeliveryThreshold: initialSettings?.freeDeliveryThreshold ?? 15000,
    returnDays: initialSettings?.returnDays ?? 30,
    supportHours: initialSettings?.supportHours || "24/7",
    footerText: initialSettings?.footerText || "",
    aboutUs: initialSettings?.aboutUs || "",
    appStoreLink: initialSettings?.appStoreLink || "",
    googlePlayLink: initialSettings?.googlePlayLink || "",
  });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put("/site-settings", form);
      showMessage("success", "Settings saved successfully");
    } catch (error) {
      console.error("Save site settings error:", error);
      showMessage("error", "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { key: "company", label: "Company Info", icon: "lucide:building-2" },
    { key: "social", label: "Social Media", icon: "lucide:share-2" },
    { key: "store", label: "Store Settings", icon: "lucide:store" },
    { key: "apps", label: "App Links", icon: "lucide:smartphone" },
    { key: "about", label: "About Us", icon: "lucide:file-text" },
  ];

  return (
    <div className="site-settings-page">
      <Toast message={message} />

      {/* Header */}
      <div className="settings-header">
        <h2 className="settings-header__title">Site Settings</h2>
        <p className="settings-header__subtitle">
          Manage your store configuration
        </p>
      </div>

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="settings-form__layout">

          {/* Section Navigation */}
          <div className="settings-nav-wrapper">
            <nav className="settings-nav">
              <ul className="settings-nav__list">
                {sections.map((section) => (
                  <li key={section.key}>
                    <button
                      type="button"
                      onClick={() => setActiveSection(section.key)}
                      className={`settings-nav__item ${
                        activeSection === section.key
                          ? "settings-nav__item--active"
                          : ""
                      }`}
                    >
                      <Icon
                        icon={section.icon}
                        width={18}
                        className="settings-nav__icon"
                      />
                      <span className="settings-nav__label">
                        {section.label}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Content */}
          <div className="settings-content">

            {/* Company Information */}
            {activeSection === "company" && (
              <div className="settings-section">
                <div className="settings-section__header">
                  <h3 className="settings-section__title">
                    <Icon
                      icon="lucide:building-2"
                      width={20}
                      className="settings-section__title-icon"
                    />
                    Company Information
                  </h3>
                  <p className="settings-section__description">
                    Basic details about your company
                  </p>
                </div>

                <div className="settings-section__body settings-section__body--spaced">
                  <div className="settings-grid">

                    <div className="settings-field settings-field--full">
                      <label className="settings-field__label">
                        Company Name
                      </label>
                      <input
                        value={form.companyName}
                        onChange={(e) =>
                          setForm({ ...form, companyName: e.target.value })
                        }
                        className="settings-field__input"
                      />
                    </div>

                    <div className="settings-field settings-field--full">
                      <label className="settings-field__label">
                        Tagline
                      </label>
                      <input
                        value={form.companyTagline}
                        onChange={(e) =>
                          setForm({ ...form, companyTagline: e.target.value })
                        }
                        className="settings-field__input"
                      />
                    </div>

                    {/* Permanent Local Company Logo */}
                    <div className="settings-field settings-field--full">
                      <label className="settings-field__label">
                        Permanent Company Logo
                      </label>

                      <div className="settings-logo-preview">
                        <img
                          src={companyLogo}
                          alt="Divine Vine-Edo Company Logo"
                          className="settings-logo-preview__img"
                        />
                      </div>

                      <small className="settings-field__hint">
                        This is the permanent company logo bundled with the
                        application. It cannot be changed from Site Settings.
                      </small>
                    </div>

                    <div className="settings-field settings-field--full">
                      <label className="settings-field__label">
                        Address
                      </label>
                      <textarea
                        value={form.address}
                        onChange={(e) =>
                          setForm({ ...form, address: e.target.value })
                        }
                        className="settings-field__textarea"
                      />
                    </div>

                    <div className="settings-field">
                      <label className="settings-field__label">
                        Phone Number
                      </label>
                      <input
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                        className="settings-field__input"
                        placeholder="+234..."
                      />
                    </div>

                    <div className="settings-field">
                      <label className="settings-field__label">
                        Phone Number 2
                      </label>
                      <input
                        value={form.phone2}
                        onChange={(e) =>
                          setForm({ ...form, phone2: e.target.value })
                        }
                        className="settings-field__input"
                      />
                    </div>

                    <div className="settings-field">
                      <label className="settings-field__label">
                        Email
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        className="settings-field__input"
                      />
                    </div>

                    <div className="settings-field">
                      <label className="settings-field__label">
                        WhatsApp
                      </label>
                      <input
                        value={form.whatsapp}
                        onChange={(e) =>
                          setForm({ ...form, whatsapp: e.target.value })
                        }
                        className="settings-field__input"
                      />
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* Social Media Links */}
            {activeSection === "social" && (
              <div className="settings-section">
                <div className="settings-section__header">
                  <h3 className="settings-section__title">
                    <Icon
                      icon="lucide:share-2"
                      width={20}
                      className="settings-section__title-icon"
                    />
                    Social Media Links
                  </h3>
                  <p className="settings-section__description">
                    Connect your social media profiles
                  </p>
                </div>

                <div className="settings-section__body settings-section__body--spaced">
                  <div className="settings-grid">
                    {[
                      {
                        key: "facebook",
                        label: "Facebook",
                        icon: "lucide:facebook",
                        colorClass: "settings-social-icon--facebook",
                      },
                      {
                        key: "instagram",
                        label: "Instagram",
                        icon: "lucide:instagram",
                        colorClass: "settings-social-icon--instagram",
                      },
                      {
                        key: "twitter",
                        label: "Twitter / X",
                        icon: "lucide:twitter",
                        colorClass: "settings-social-icon--twitter",
                      },
                      {
                        key: "tiktok",
                        label: "TikTok",
                        icon: "lucide:music",
                        colorClass: "settings-social-icon--tiktok",
                      },
                      {
                        key: "youtube",
                        label: "YouTube",
                        icon: "lucide:youtube",
                        colorClass: "settings-social-icon--youtube",
                      },
                    ].map((social) => (
                      <div key={social.key} className="settings-field">
                        <label className="settings-field__label">
                          <Icon
                            icon={social.icon}
                            width={16}
                            className={`settings-field__label-icon ${social.colorClass}`}
                          />
                          {social.label}
                        </label>

                        <input
                          value={form[social.key]}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              [social.key]: e.target.value,
                            })
                          }
                          className="settings-field__input"
                          placeholder={`https://${social.key}.com/...`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Store Settings */}
            {activeSection === "store" && (
              <div className="settings-section">
                <div className="settings-section__header">
                  <h3 className="settings-section__title">
                    <Icon
                      icon="lucide:store"
                      width={20}
                      className="settings-section__title-icon"
                    />
                    Store Settings
                  </h3>
                  <p className="settings-section__description">
                    Configure your store preferences
                  </p>
                </div>

                <div className="settings-section__body settings-section__body--spaced">
                  <div className="settings-grid settings-grid--3">

                    <div className="settings-field">
                      <label className="settings-field__label">
                        Currency Symbol
                      </label>
                      <input
                        value={form.currency}
                        onChange={(e) =>
                          setForm({ ...form, currency: e.target.value })
                        }
                        className="settings-field__input"
                      />
                    </div>

                    <div className="settings-field">
                      <label className="settings-field__label">
                        Free Delivery From (₦)
                      </label>
                      <input
                        type="number"
                        value={form.freeDeliveryThreshold}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            freeDeliveryThreshold: Number(e.target.value),
                          })
                        }
                        className="settings-field__input"
                      />
                    </div>

                    <div className="settings-field">
                      <label className="settings-field__label">
                        Return Days
                      </label>
                      <input
                        type="number"
                        value={form.returnDays}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            returnDays: Number(e.target.value),
                          })
                        }
                        className="settings-field__input"
                      />
                    </div>

                    <div className="settings-field">
                      <label className="settings-field__label">
                        Support Hours
                      </label>
                      <input
                        value={form.supportHours}
                        onChange={(e) =>
                          setForm({ ...form, supportHours: e.target.value })
                        }
                        className="settings-field__input"
                      />
                    </div>

                    <div className="settings-field settings-field--full">
                      <label className="settings-field__label">
                        Footer Text
                      </label>
                      <input
                        value={form.footerText}
                        onChange={(e) =>
                          setForm({ ...form, footerText: e.target.value })
                        }
                        className="settings-field__input"
                      />
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* App Download Links */}
            {activeSection === "apps" && (
              <div className="settings-section">
                <div className="settings-section__header">
                  <h3 className="settings-section__title">
                    <Icon
                      icon="lucide:smartphone"
                      width={20}
                      className="settings-section__title-icon"
                    />
                    App Download Links
                  </h3>
                  <p className="settings-section__description">
                    Links to your mobile applications
                  </p>
                </div>

                <div className="settings-section__body settings-section__body--spaced">
                  <div className="settings-grid">

                    <div className="settings-field">
                      <label className="settings-field__label">
                        <Icon
                          icon="lucide:apple"
                          width={16}
                          className="settings-field__label-icon"
                          style={{ color: "#1e293b" }}
                        />
                        App Store Link
                      </label>
                      <input
                        value={form.appStoreLink}
                        onChange={(e) =>
                          setForm({ ...form, appStoreLink: e.target.value })
                        }
                        className="settings-field__input"
                      />
                    </div>

                    <div className="settings-field">
                      <label className="settings-field__label">
                        <Icon
                          icon="lucide:play"
                          width={16}
                          className="settings-field__label-icon"
                          style={{ color: "#16a34a" }}
                        />
                        Google Play Link
                      </label>
                      <input
                        value={form.googlePlayLink}
                        onChange={(e) =>
                          setForm({ ...form, googlePlayLink: e.target.value })
                        }
                        className="settings-field__input"
                      />
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* About Us */}
            {activeSection === "about" && (
              <div className="settings-section">
                <div className="settings-section__header">
                  <h3 className="settings-section__title">
                    <Icon
                      icon="lucide:file-text"
                      width={20}
                      className="settings-section__title-icon"
                    />
                    About Us
                  </h3>
                  <p className="settings-section__description">
                    Information about your company
                  </p>
                </div>

                <div className="settings-section__body">
                  <div className="settings-field">
                    <textarea
                      value={form.aboutUs}
                      onChange={(e) =>
                        setForm({ ...form, aboutUs: e.target.value })
                      }
                      className="settings-field__textarea settings-field__textarea--tall"
                      placeholder="About your company..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="settings-save-area">
              <button
                type="submit"
                disabled={saving}
                className="settings-save-btn"
              >
                {saving ? (
                  <Icon
                    icon="lucide:loader-2"
                    width={16}
                    className="settings-save-btn__icon settings-save-btn__icon--spinning"
                  />
                ) : (
                  <Icon
                    icon="lucide:check"
                    width={16}
                    className="settings-save-btn__icon"
                  />
                )}
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}
