import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TopNav from "../components/TopNav";
import { supabase } from "../lib/supabaseClient";

function MealPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meal, setMeal]           = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  useEffect(() => {
    const loadMeal = async () => {
      setLoading(true);

      const { data: mealData, error: mealError } = await supabase
        .from("meals").select("*").eq("id", id).single();

      if (mealError || !mealData) {
        setError("Meal not found.");
        setLoading(false);
        return;
      }
      setMeal(mealData);

      const { data: mfData } = await supabase
        .from("meal_foods")
        .select("quantity, foods(name, food_group, is_iron_rich, allergen_notes)")
        .eq("meal_id", id);

      setIngredients(mfData || []);
      setLoading(false);
    };
    loadMeal();
  }, [id]);

  if (loading) return <div className="page"><TopNav /><p className="muted" style={{ marginTop: "2rem" }}>Loading...</p></div>;
  if (error || !meal) return (
    <div className="page">
      <TopNav />
      <p className="muted" style={{ marginTop: "2rem" }}>{error || "Meal not found."}</p>
      <button className="btn" onClick={() => navigate(-1)} style={{ marginTop: 12 }}>← Go Back</button>
    </div>
  );

  const steps = meal.steps ? meal.steps.split("\n").filter((s) => s.trim()) : [];
  const hasAllergens = ingredients.some((i) => i.foods?.allergen_notes);

  return (
    <div className="page">
      <TopNav />

      <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginTop: "1.5rem", paddingLeft: 0 }}>
        ← Back
      </button>

      {/* ── Header ── */}
      <div style={{ margin: "1rem 0 1.5rem" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          <span className="badge badge-slot">{meal.meal_slot}</span>
          <span className={`badge ${meal.meal_type === "quick" ? "badge-quick" : "badge-fancy"}`}>
            {meal.meal_type}
          </span>
        </div>
        <h1 style={{ marginBottom: 8 }}>{meal.title}</h1>
        <p className="muted" style={{ marginBottom: 10 }}>{meal.description}</p>
        <div style={{ display: "flex", gap: 16, fontSize: "0.88rem", color: "var(--muted)", flexWrap: "wrap" }}>
          <span>🕐 {meal.prep_time_minutes} min prep</span>
          <span>👶 {meal.min_age_months}–{meal.max_age_months} months</span>
        </div>
      </div>

      {/* ── Nutrition highlight ── */}
      {meal.nutrition_highlight && (
        <div className="card card-nutrition">
          <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--green-dark)", fontWeight: 700 }}>
            ✓ {meal.nutrition_highlight}
          </p>
        </div>
      )}

      {/* ── Allergen warning ── */}
      {hasAllergens && (
        <div className="card card-allergen">
          <h3 style={{ marginBottom: 8, color: "#c0392b", fontSize: "0.95rem" }}>⚠️ Allergen notes</h3>
          {ingredients.filter((i) => i.foods?.allergen_notes).map((i, idx) => (
            <p key={idx} style={{ margin: "3px 0", fontSize: "0.85rem", color: "#c0392b" }}>
              <strong>{i.foods.name}:</strong> {i.foods.allergen_notes}
            </p>
          ))}
        </div>
      )}

      {/* ── Ingredients ── */}
      {ingredients.length > 0 && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h3 style={{ marginBottom: "0.75rem" }}>Ingredients</h3>
          {ingredients.map((item, idx) => (
            <div key={idx} className="ingredient-row">
              <span>{item.foods?.name}</span>
              <span className="muted">{item.quantity}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Steps ── */}
      {steps.length > 0 && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>How to make it</h3>
          {steps.map((step, idx) => (
            <div key={idx} className="step-item">
              <span className="step-num">{idx + 1}</span>
              <p className="step-text">{step.replace(/^\d+\.\s*/, "")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MealPage;
