import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TopNav from "../components/TopNav";
import { supabase } from "../lib/supabaseClient";

function MealPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meal, setMeal] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMeal = async () => {
      setLoading(true);

      // Load meal
      const { data: mealData, error: mealError } = await supabase
        .from("meals")
        .select("*")
        .eq("id", id)
        .single();

      if (mealError || !mealData) {
        setError("Meal not found.");
        setLoading(false);
        return;
      }

      setMeal(mealData);

      // Load ingredients via meal_foods join
      const { data: mfData } = await supabase
        .from("meal_foods")
        .select("quantity, foods(name, food_group, is_iron_rich, allergen_notes)")
        .eq("meal_id", id);

      setIngredients(mfData || []);
      setLoading(false);
    };

    loadMeal();
  }, [id]);

  if (loading) {
    return (
      <div className="page">
        <TopNav />
        <p className="muted">Loading...</p>
      </div>
    );
  }

  if (error || !meal) {
    return (
      <div className="page">
        <TopNav />
        <p className="muted">{error || "Meal not found."}</p>
        <button className="btn" onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    );
  }

  const steps = meal.steps
    ? meal.steps.split("\n").filter((s) => s.trim())
    : [];

  const hasAllergens = ingredients.some((i) => i.foods?.allergen_notes);

  return (
    <div className="page">
      <TopNav />

      <button
        onClick={() => navigate(-1)}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 14, marginBottom: 16, padding: 0 }}
      >
        ← Back
      </button>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 12, padding: "3px 10px", borderRadius: 20,
            background: "#fff3e0", color: "#e65100", border: "1px solid #ffe0b2"
          }}>
            {meal.meal_slot}
          </span>
          <span style={{
            fontSize: 12, padding: "3px 10px", borderRadius: 20,
            background: meal.meal_type === "quick" ? "#e8f5e9" : "#f3e5f5",
            color: meal.meal_type === "quick" ? "#2e7d32" : "#6a1b9a",
            border: `1px solid ${meal.meal_type === "quick" ? "#c8e6c9" : "#e1bee7"}`
          }}>
            {meal.meal_type}
          </span>
        </div>

        <h1 style={{ marginTop: 0, marginBottom: 8 }}>{meal.title}</h1>
        <p className="muted" style={{ marginBottom: 8 }}>{meal.description}</p>

        <div style={{ display: "flex", gap: 20, fontSize: 13, color: "#666", flexWrap: "wrap" }}>
          <span>🕐 {meal.prep_time_minutes} min prep</span>
          <span>👶 {meal.min_age_months}–{meal.max_age_months} months</span>
        </div>
      </div>

      {/* ── Nutrition highlight ── */}
      {meal.nutrition_highlight && (
        <div className="card" style={{ marginBottom: 16, background: "#f0faf4", borderLeft: "3px solid #4caf50" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#2e7d32" }}>
            ✓ {meal.nutrition_highlight}
          </p>
        </div>
      )}

      {/* ── Allergen warning ── */}
      {hasAllergens && (
        <div className="card" style={{ marginBottom: 16, borderLeft: "3px solid #c0392b", background: "#fdf0ef" }}>
          <h3 style={{ marginTop: 0, color: "#c0392b", fontSize: 14 }}>⚠️ Allergen notes</h3>
          {ingredients
            .filter((i) => i.foods?.allergen_notes)
            .map((i, idx) => (
              <p key={idx} style={{ margin: "4px 0", fontSize: 13, color: "#c0392b" }}>
                <strong>{i.foods.name}:</strong> {i.foods.allergen_notes}
              </p>
            ))}
        </div>
      )}

      {/* ── Ingredients ── */}
      {ingredients.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Ingredients</h3>
          {ingredients.map((item, idx) => (
            <div key={idx} style={{
              display: "flex", justifyContent: "space-between",
              padding: "6px 0", borderBottom: idx < ingredients.length - 1 ? "1px solid #f0f0f0" : "none",
              fontSize: 14
            }}>
              <span>{item.foods?.name}</span>
              <span style={{ color: "#888" }}>{item.quantity}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Steps ── */}
      {steps.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>How to make it</h3>
          {steps.map((step, idx) => (
            <div key={idx} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
              <span style={{
                minWidth: 24, height: 24, borderRadius: "50%",
                background: "#f5f5f5", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#555"
              }}>
                {idx + 1}
              </span>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#444" }}>
                {step.replace(/^\d+\.\s*/, "")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MealPage;
