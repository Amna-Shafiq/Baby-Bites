import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

function NotFound() {
  return (
    <div className="page" style={{ textAlign: "center", paddingTop: "5rem", paddingBottom: "5rem" }}>
      <Helmet>
        <title>Page Not Found | Baby Bites</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🥕</div>
      <h1 style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", marginBottom: "0.5rem" }}>404</h1>
      <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--dark)", marginBottom: "0.5rem" }}>
        This page doesn't exist yet
      </p>
      <p style={{ color: "var(--muted)", fontSize: "0.95rem", maxWidth: 380, margin: "0 auto 2rem" }}>
        It may have been moved, or you may have followed a broken link. Let's get you back on track.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center", marginBottom: "2.5rem" }}>
        <Link to="/" className="btn btn-primary">Go home</Link>
        <Link to="/foods" className="btn">Browse foods</Link>
        <Link to="/meals" className="btn">Find a meal</Link>
      </div>

      <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
        Think this is a mistake?{" "}
        <Link to="/about#contact" style={{ color: "var(--orange-dark)", fontWeight: 700 }}>
          Let us know
        </Link>
      </p>
    </div>
  );
}

export default NotFound;
