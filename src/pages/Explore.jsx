import { Link } from "react-router-dom";
import TopNav from "../components/TopNav";

function Explore() {
  return (
    <div className="page">
      <TopNav />

      <span className="eyebrow eo" style={{ marginTop: "1.5rem", display: "block" }}>Discover</span>
      <h1>Explore</h1>
      <p className="page-sub">Browse safe foods, age-appropriate meals, and nutrition guides for your baby.</p>

      <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        <Link className="explore-card" to="/foods?tag=iron-rich">
          <div style={{ fontSize: 28, marginBottom: "0.75rem" }}>🩸</div>
          <h3>Iron-rich foods</h3>
          <p>See foods that support iron intake and healthy growth.</p>
        </Link>
        <Link className="explore-card" to="/foods">
          <div style={{ fontSize: 28, marginBottom: "0.75rem" }}>🥕</div>
          <h3>Foods by age</h3>
          <p>Filter the full food library by your baby's age in months.</p>
        </Link>
        <Link className="explore-card" to="/meals">
          <div style={{ fontSize: 28, marginBottom: "0.75rem" }}>🍽️</div>
          <h3>Meal ideas by age</h3>
          <p>Switch between quick and fancy options for every meal slot.</p>
        </Link>
      </div>
    </div>
  );
}

export default Explore;
