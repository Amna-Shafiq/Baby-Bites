import { useState } from "react";
import { Link } from "react-router-dom";
import TopNav from "../components/TopNav";
import useCustomMeals from "../hooks/useCustomMeals";
import LoginPromptModal from "../components/LoginPromptModal";
import PantrySearch from "../components/PantrySearch";

function MyMeals() {
  const { session, customMeals, householdFoods, mealSuggestions, addCustomMeal, addHouseholdFood, removeHouseholdFood, error, loading } =
    useCustomMeals();

  const [title, setTitle] = useState("");
  const [minAgeMonths, setMinAgeMonths] = useState("6");
  const [maxAgeMonths, setMaxAgeMonths] = useState("12");
  const [mealSlot, setMealSlot] = useState("lunch");
  const [ingredientsText, setIngredientsText] = useState("");
  const [steps, setSteps] = useState("");
  const [nutritionHighlight, setNutritionHighlight] = useState("");
  const [status, setStatus] = useState("");
  const [pantryStatus, setPantryStatus] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);

  const submitMeal = async (e) => {
    e.preventDefault();
    setStatus("");
    const result = await addCustomMeal({
      title,
      minAgeMonths,
      maxAgeMonths,
      mealSlot,
      ingredients: ingredientsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      steps,
      nutritionHighlight,
    });
    if (result.error) {
      setStatus(result.error);
      return;
    }

    setTitle("");
    setIngredientsText("");
    setSteps("");
    setNutritionHighlight("");
    setStatus("Meal added.");
  };

  const handleAddFood = async (food) => {
    setPantryStatus("");
    const result = await addHouseholdFood({ name: food.name, food_id: food.id });
    if (result.error) {
      if (result.error === "Please log in to add foods to your pantry.") {
        setShowLoginModal(true);
      } else {
        setPantryStatus(result.error);
      }
      return;
    }
    if (result.duplicates?.length) {
      setPantryStatus(`${result.duplicates[0]} is already in your pantry.`);
    }
  };

  return (
    <div className="page">
      <TopNav />
      {showLoginModal && <LoginPromptModal onClose={() => setShowLoginModal(false)} />}
      <h1>My Meals</h1>
      {!session ? <p className="muted">Login required to manage your meals.</p> : null}
      {error ? <p className="muted">{error}</p> : null}
      {status ? <p className="muted">{status}</p> : null}

      <section className="panel">
        <h2 style={{ marginBottom: "0.3rem" }}>What's in your pantry?</h2>
        <p className="muted" style={{ fontSize: "0.9rem", marginBottom: "1.2rem", lineHeight: 1.6 }}>
          Tell us what foods you have at home and we'll include them when suggesting meals you can make.
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <PantrySearch onAdd={handleAddFood} existingFoods={householdFoods} />
        </div>

        {pantryStatus && (
          <p style={{ marginTop: 10, fontSize: "0.85rem", color: "var(--muted)", fontWeight: 600 }}>
            {pantryStatus}
          </p>
        )}

        {/* ── Pantry items ── */}
        {householdFoods.length > 0 && (
          <div style={{ marginTop: "1.4rem" }}>
            <p style={{
              fontSize: "0.72rem", fontWeight: 700, color: "var(--muted)",
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.7rem"
            }}>
              In your pantry — {householdFoods.length} item{householdFoods.length !== 1 ? "s" : ""}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {householdFoods.map((food) => (
                <span key={food.id} style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 10px 5px 13px",
                  background: "var(--yellow)",
                  border: "1px solid var(--yellow-mid)",
                  borderRadius: "100px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "var(--yellow-dark)",
                }}>
                  {food.name}
                  <button
                    type="button"
                    onClick={() => removeHouseholdFood(food.id)}
                    title="Remove from pantry"
                    style={{
                      background: "var(--yellow-mid)",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--yellow-dark)",
                      fontSize: "0.7rem",
                      lineHeight: 1,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                    }}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {householdFoods.length === 0 && session && !pantryStatus && (
          <p className="muted" style={{ marginTop: "1rem", fontSize: "0.85rem" }}>
            Your pantry is empty — add some foods above to get started.
          </p>
        )}
      </section>

      <section className="panel">
        <h3>Add custom meal</h3>
        <form onSubmit={submitMeal} className="filters">
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Meal title" required />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input
              className="input"
              value={minAgeMonths}
              onChange={(e) => setMinAgeMonths(e.target.value)}
              type="number"
              min="0"
              placeholder="Min age months"
              required
            />
            <input
              className="input"
              value={maxAgeMonths}
              onChange={(e) => setMaxAgeMonths(e.target.value)}
              type="number"
              min="0"
              placeholder="Max age months"
              required
            />
          </div>
          <select className="input" value={mealSlot} onChange={(e) => setMealSlot(e.target.value)}>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>
          <input
            className="input"
            value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
            placeholder="Ingredients (comma separated)"
          />
          <textarea
            className="input"
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder="Preparation steps"
          />
          <input
            className="input"
            value={nutritionHighlight}
            onChange={(e) => setNutritionHighlight(e.target.value)}
            placeholder="Nutrition highlight"
          />
          <button type="submit" className="btn btn-primary" disabled={!session || loading}>
            Add to My Meals
          </button>
        </form>
      </section>

      {mealSuggestions.length > 0 && (
        <section className="panel">
          <h2 style={{ marginBottom: "0.3rem" }}>Meals you can make</h2>
          <p className="muted" style={{ fontSize: "0.9rem", marginBottom: "1.2rem", lineHeight: 1.6 }}>
            Based on what's in your pantry — every ingredient is covered.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mealSuggestions.map((meal) => (
              <Link
                key={meal.id}
                to={`/meals/${meal.id}`}
                style={{ textDecoration: "none" }}
              >
                <div className="card" style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <strong style={{ fontSize: "0.97rem" }}>{meal.title}</strong>
                    <span className={`badge badge-${meal.meal_type}`} style={{ flexShrink: 0 }}>
                      {meal.meal_type}
                    </span>
                  </div>
                  <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.82rem" }}>
                    {meal.meal_slot} · {meal.min_age_months}–{meal.max_age_months} months
                    {meal.prep_time_minutes ? ` · ${meal.prep_time_minutes} min` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <h3>My added meals</h3>
        {customMeals.length === 0 ? (
          <p className="muted">No custom meals yet.</p>
        ) : (
          customMeals.map((meal) => (
            <div key={meal.id} className="card" style={{ marginBottom: 10 }}>
              <strong>{meal.title}</strong>
              <p className="muted" style={{ margin: "6px 0" }}>
                {meal.meal_slot} | {meal.min_age_months}-{meal.max_age_months} months
              </p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default MyMeals;

