import { Link } from "react-router-dom";

function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer-logo">
        <span className="brand-dot" />
        Baby Bites
      </div>
      <div className="app-footer-links">
        <Link to="/explore">Explore</Link>
        <Link to="/meals">Meals</Link>
        <Link to="/foods">Foods</Link>
        <a href="#">Privacy</a>
      </div>
      <div className="app-footer-copy">© 2026 Baby Bites</div>
    </footer>
  );
}

export default AppFooter;
