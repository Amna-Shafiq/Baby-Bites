import { useState } from "react";
import { Link } from "react-router-dom";
import TopNav from "../components/TopNav";
import useCustomMeals from "../hooks/useCustomMeals";
import useFavorites from "../hooks/useFavorites";

function MyMeals() {
  const { session, customMeals, addCustomMeal, error, loading } = useCustomMeals();
  const { favoriteMeals, toggleFavorite } = useFavorites();

  const [title, setTitle]                     = useState("");
  const [minAgeMonths, setMinAgeMonths]       = useState("6");
  const [maxAgeMonths, setMaxAgeMonths]       = useState("12");
  const [mealSlot, setMealSlot]               = useState("lunch");
  const [ingredientsText, setIngredientsText] = useState("");
  const [steps, setSteps]                     = useState("");
  const [nutritionHighlight, setNutritionHighlight] = useState("");
  const [status, setStatus]                   = useState("");

  const submitMeal = async (e) => {
    e.preventDefault();
    setStatus("");
    const result = await addCustomMeal({
      title,
      minAgeMonths,
      maxAgeMonths,
      mealSlot,
      ingredients: ingredientsText.split(",").map((s) => s.trim()).filter(Boolean),
      steps,
      nutritionHighlight,
    });
    if (result.error) { setStatus(result.error); return; }
    setTitle(""); setIngredientsText(""); setSteps(""); setNutritionHighlight("");
    setStatus("Meal added!");
  };

  return (
    <div className="page">
      <TopNav />

      <span className="eyebrow eo" style={{ marginTop: "1.5rem", display: "block" }}>Recipes</span>
      <h1>My Meals</h1>

      {error  && <p className="muted">{error}</p>}
      {status && <p style={{ fontSize: "0.88rem", color: "var(--muted)", fontWeight: 600 }}>{status}</p>}

      {/* ── Add custom meal ── */}
      <section className="panel">
        <h2 style={{ marginBottom: "0.3rem" }}>Add a custom meal</h2>
        <p className="muted" style={{ fontSize: "0.9rem", marginBottom: "1.2rem", lineHeight: 1.6 }}>
          Save a recipe you love so it shows up alongside the built-in meal library.
        </p>
        <form onSubmit={submitMeal} className="filters">
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Meal title" required />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input
              className="input" type="number" min="0"
              value={minAgeMonths} onChange={(e) => setMinAgeMonths(e.target.value)}
              placeholder="Min age (months)" required
            />
            <input
              className="input" type="number" min="0"
              value={maxAgeMonths} onChange={(e) => setMaxAgeMonths(e.target.value)}
              placeholder="Max age (months)" required
            />
          </div>
          <select className="input" value={mealSlot} onChange={(e) => setMealSlot(e.target.value)}>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>
          <input
            className="input" value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
            placeholder="Ingredients (comma separated)"
          />
          <textarea
            className="input" value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder="Preparation steps" rows={3} style={{ resize: "vertical" }}
          />
          <input
            className="input" value={nutritionHighlight}
            onChange={(e) => setNutritionHighlight(e.target.value)}
            placeholder="Nutrition highlight"
          />
          <button type="submit" className="btn btn-primary" disabled={!session || loading}>
            Save meal
          </button>
        </form>
      </section>

      {/* ── Favourites ── */}
      <section className="panel">
        <h2 style={{ marginBottom: "0.3rem" }}>Saved favourites</h2>
        <p className="muted" style={{ fontSize: "0.9rem", marginBottom: "1.2rem", lineHeight: 1.6 }}>
          Meals you've hearted from the Meals page.
        </p>
        {favoriteMeals.length === 0 ? (
          <p className="muted">No favourites yet — tap ♡ on any meal to save it here.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {favoriteMeals.map((meal) => (
              <div key={meal.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div>
                  <Link to={`/meal/${meal.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <strong style={{ fontSize: "0.97rem" }}>{meal.title}</strong>
                  </Link>
                  <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.82rem" }}>
                    {meal.meal_slot} · {meal.min_age_months}–{meal.max_age_months} months
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFavorite(meal.id)}
                  title="Remove from favourites"
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: "#e74c3c", flexShrink: 0, padding: 4 }}
                >
                  ♥
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── My added meals ── */}
      <section className="panel">
        <h2 style={{ marginBottom: "1rem" }}>Your meals</h2>
        {customMeals.length === 0 ? (
          <p className="muted">No custom meals yet — add one above.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {customMeals.map((meal) => (
              <div key={meal.id} className="card">
                <strong style={{ fontSize: "0.97rem" }}>{meal.title}</strong>
                <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.82rem" }}>
                  {meal.meal_slot} · {meal.min_age_months}–{meal.max_age_months} months
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div style={{ marginBottom: "2rem" }}>
        <Link to="/pantry" style={{ fontSize: "0.88rem", color: "var(--muted)", textDecoration: "underline" }}>
          ← Back to Pantry
        </Link>
      </div>
    </div>
  );
}

export default MyMeals;
