import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import TopNav from "../components/TopNav";
import { supabase } from "../lib/supabaseClient";

function FoodDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [food, setFood]     = useState(null);
  const [meals, setMeals]   = useState([]);
  const [error, setError]   = useState("");

  useEffect(() => {
    const load = async () => {
      // Load food + meals that use this food in parallel
      const [foodRes, mealsRes] = await Promise.all([
        supabase.from("foods").select("*").eq("id", id).single(),
        supabase
          .from("meal_foods")
          .select("meals(*)")
          .eq("food_id", id),
      ]);
      if (foodRes.error) { setError("Food not found."); return; }
      setFood(foodRes.data);
      setMeals(
        (mealsRes.data || [])
          .map((r) => r.meals)
          .filter((m) => m && m.is_public)
      );
    };
    load();
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

      {/* ── Meals using this food ── */}
      <div className="panel" style={{ marginTop: "1.5rem" }}>
        <h2 style={{ marginBottom: "0.3rem" }}>Meals with {food.name}</h2>
        <p className="muted" style={{ fontSize: "0.9rem", marginBottom: "1.2rem", lineHeight: 1.6 }}>
          Recipes from the meal library that include this ingredient.
        </p>
        {meals.length === 0 ? (
          <p className="muted">No meals found for this food yet.</p>
        ) : (
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, scrollSnapType: "x mandatory" }}>
            {meals.map((meal) => (
              <Link key={meal.id} to={`/meal/${meal.id}`} style={{ textDecoration: "none", flexShrink: 0, scrollSnapAlign: "start" }}>
                <div style={{
                  width: 200,
                  background: "var(--cream)",
                  border: "1.5px solid var(--border)",
                  borderRadius: 16,
                  padding: "1rem",
                  cursor: "pointer",
                  height: "100%",
                }}>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
                    <span className="badge badge-slot">{meal.meal_slot}</span>
                    <span className={`badge badge-${meal.meal_type}`}>{meal.meal_type}</span>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: "0.92rem", margin: "0 0 6px", color: "var(--dark)", fontFamily: "Fraunces, serif", lineHeight: 1.3 }}>
                    {meal.title}
                  </p>
                  <p className="muted" style={{ fontSize: "0.78rem", margin: 0 }}>
                    {meal.min_age_months}–{meal.max_age_months}m
                    {meal.prep_time_minutes ? ` · ${meal.prep_time_minutes} min` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FoodDetail;
