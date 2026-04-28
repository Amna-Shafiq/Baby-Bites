import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";

const IconInstagram = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/>
  </svg>
);

const IconYouTube = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.2 2.8 12 2.8 12 2.8s-4.2 0-6.8.2c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.3v2c0 2.1.3 4.3.3 4.3s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.5 21.8 12 21.8 12 21.8s4.2 0 6.8-.3c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.3v-2C23.3 9.1 23 7 23 7zM9.7 15.5V8.4l6.6 3.6-6.6 3.5z"/>
  </svg>
);

function AppFooter() {
  return (
    <footer className="app-footer">
      <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
        <div className="app-footer-logo">
          <BrandLogo size="1.1rem" />
        </div>
      </Link>
      <div className="app-footer-links">
        <Link to="/explore">Explore</Link>
        <Link to="/meals">Meals</Link>
        <Link to="/foods">Foods</Link>
        <Link to="/about">About</Link>
      </div>
      <div className="app-footer-social">
        <a href="#" className="social-icon" aria-label="Instagram"><IconInstagram /></a>
        <a href="#" className="social-icon" aria-label="YouTube"><IconYouTube /></a>
      </div>
      <div className="app-footer-copy">© 2026 Baby Bites</div>
    </footer>
  );
}

export default AppFooter;
