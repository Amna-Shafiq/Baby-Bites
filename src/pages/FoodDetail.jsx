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
        .from("foods")
        .select("*")
        .eq("id", id)
        .single();

      if (error) { setError("Food not found."); return; }
      setFood(data);
    };
    loadFood();
  }, [id]);

  if (error) return <div className="page"><TopNav /><p>{error}</p></div>;
  if (!food) return <div className="page"><TopNav /><p>Loading...</p></div>;

  return (
    <div className="page">
      <TopNav />

      <button
        onClick={() => navigate(-1)}
        style={{ background: "none", border: "none", cursor: "pointer", marginBottom: 16, color: "#888", fontSize: 14 }}
      >
        ← Back
      </button>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        <img
          src={food.image_url}
          alt={food.name}
          onError={(e) => { e.target.src = "https://placehold.co/120x120?text=🍽"; }}
          style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 12 }}
        />
        <div style={{ flex: 1 }}>
          <h1 style={{ marginTop: 0 }}>{food.name}</h1>
          <p className="muted">Safe from: <strong>{food.safe_from_months}m+</strong></p>
          <p className="muted">Group: <strong>{food.food_group || "other"}</strong></p>
          <p className="muted">Iron rich: <strong>{food.is_iron_rich ? "✓ Yes" : "No"}</strong></p>
        </div>
      </div>

      {food.texture_tips && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ marginTop: 0 }}>Texture tips</h3>
          <p className="muted">{food.texture_tips}</p>
        </div>
      )}

      {food.allergen_notes && (
        <div className="card" style={{ marginTop: 16, borderLeft: "3px solid #c0392b" }}>
          <h3 style={{ marginTop: 0, color: "#c0392b" }}>⚠️ Allergen notes</h3>
          <p style={{ color: "#c0392b", margin: 0 }}>{food.allergen_notes}</p>
        </div>
      )}
    </div>
  );
}

export default FoodDetail;