import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Point from "../pages/Point";
import "./Rewards.css";

export default function Rewards() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="rewards-page">
        <div className="rewards-empty">
          <Icon icon="lucide:lock" width={48} />
          <h2>Login Required</h2>
          <p>You need to be logged in to view your rewards.</p>
          <Link to="/login" className="rewards-btn">Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rewards-page">
      <div className="rewards-container">
        <div className="rewards-header">
          <Link to="/" className="rewards-back">
            <Icon icon="lucide:arrow-left" width={20} />
            <span>Back</span>
          </Link>
          <h1>My Rewards</h1>
          <p className="rewards-subtitle">Earn coins with every purchase and redeem them for discounts</p>
        </div>

        <Point />

        <div className="rewards-how">
          <h2><Icon icon="lucide:help-circle" width={20} /> How It Works</h2>
          <div className="rewards-steps">
            <div className="rewards-step">
              <div className="rewards-step__icon">
                <Icon icon="lucide:shopping-cart" width={24} />
              </div>
              <h3>Shop</h3>
              <p>Place orders on Divine SolarHub</p>
            </div>
            <div className="rewards-step">
              <div className="rewards-step__icon">
                <Icon icon="lucide:coins" width={24} />
              </div>
              <h3>Earn</h3>
              <p>Get 1 coin per ₦10,000 spent</p>
            </div>
            <div className="rewards-step">
              <div className="rewards-step__icon">
                <Icon icon="lucide:gift" width={24} />
              </div>
              <h3>Redeem</h3>
              <p>Each coin is worth ₦100 off</p>
            </div>
          </div>
        </div>

        <div className="rewards-info-card">
          <Icon icon="lucide:info" width={18} />
          <div>
            <h3>Important</h3>
            <p>Coins are automatically credited to your account after a successful payment. They can be applied at checkout for discounts on future orders.</p>
          </div>
        </div>

        <div className="rewards-actions">
          <Link to="/" className="rewards-btn rewards-btn--primary">
            <Icon icon="lucide:shopping-bag" width={18} />
            Start Shopping
          </Link>
          <Link to="/my-orders" className="rewards-btn rewards-btn--outline">
            <Icon icon="lucide:package" width={18} />
            View My Orders
          </Link>
        </div>
      </div>
    </div>
  );
}