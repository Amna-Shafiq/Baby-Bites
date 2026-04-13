import { Link } from "react-router-dom";
import TopNav from "../components/TopNav";

function Explore() {
  return (
    <div className="page">
      <TopNav />
      <h1>Explore</h1>
      <p>Choose what you want to discover.</p>

      <div className="card-grid">
        <Link className="explore-card" to="/foods?tag=iron-rich">
          <h3>Iron-rich foods</h3>
          <p>See foods that support iron intake and growth.</p>
        </Link>
        <Link className="explore-card" to="/foods">
          <h3>Foods by age</h3>
          <p>Filter foods by baby age in months.</p>
        </Link>
        <Link className="explore-card" to="/meals">
          <h3>Meal ideas by age</h3>
          <p>Switch between quick and fancy options.</p>
        </Link>
      </div>
    </div>
  );
}

export default Explore;

