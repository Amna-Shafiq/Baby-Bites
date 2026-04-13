import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TopNav from "../components/TopNav";
import { supabase } from "../lib/supabaseClient";

function FoodDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [food, setFood] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFood = async () => {
      const { data, error } = await supabase
        .from("foods").select("*").eq("id", id).single();
      if (error) { setError("Food not found."); return; }
      setFood(data);
    };
    loadFood();
  }, [id]);

  if (error) return <div className="page"><TopNav /><p className="muted" style={{ marginTop: "2rem" }}>{error}</p></div>;
  if (!food)  return <div className="page"><TopNav /><p className="muted" style={{ marginTop: "2rem" }}>Loading...</p></div>;

  return (
    <div className="page">
      <TopNav />

      <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginTop: "1.5rem", paddingLeft: 0 }}>
        ← Back
      </button>

      {/* ── Food header ── */}
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap", margin: "1.5rem 0" }}>
        <img
          src={food.image_url}
          alt={food.name}
          onError={(e) => { e.target.src = "https://placehold.co/120x120?text=🍽"; }}
          style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 16, border: "1.5px solid var(--border)" }}
        />
        <div style={{ flex: 1 }}>
          <span className="eyebrow eo">{food.food_group || "food"}</span>
          <h1 style={{ marginBottom: "0.75rem" }}>{food.name}</h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="badge badge-age">Safe from {food.safe_from_months}m+</span>
            {food.is_iron_rich && <span className="badge badge-quick">✓ Iron-rich</span>}
          </div>
        </div>
      </div>

      {/* ── Texture tips ── */}
      {food.texture_tips && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h3 style={{ marginBottom: "0.6rem" }}>Texture tips</h3>
          <p className="muted" style={{ margin: 0 }}>{food.texture_tips}</p>
        </div>
      )}

      {/* ── Allergen notes ── */}
      {food.allergen_notes && (
        <div className="card card-allergen">
          <h3 style={{ marginBottom: "0.5rem", color: "#c0392b", fontSize: "0.95rem" }}>⚠️ Allergen notes</h3>
          <p style={{ color: "#c0392b", margin: 0, fontSize: "0.9rem" }}>{food.allergen_notes}</p>
        </div>
      )}
    </div>
  );
}

export default FoodDetail;
