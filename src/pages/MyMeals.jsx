import { useState } from "react";
import TopNav from "../components/TopNav";
import useCustomMeals from "../hooks/useCustomMeals";

function MyMeals() {
  const { session, customMeals, householdFoods, addCustomMeal, addHouseholdFood, error, loading } =
    useCustomMeals();

  const [title, setTitle] = useState("");
  const [minAgeMonths, setMinAgeMonths] = useState("6");
  const [maxAgeMonths, setMaxAgeMonths] = useState("12");
  const [mealSlot, setMealSlot] = useState("lunch");
  const [ingredientsText, setIngredientsText] = useState("");
  const [steps, setSteps] = useState("");
  const [nutritionHighlight, setNutritionHighlight] = useState("");
  const [householdFood, setHouseholdFood] = useState("");
  const [status, setStatus] = useState("");

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

  const submitHouseholdFood = async (e) => {
    e.preventDefault();
    setStatus("");
    const result = await addHouseholdFood(householdFood);
    if (result.error) {
      setStatus(result.error);
      return;
    }
    setHouseholdFood("");
    setStatus("Household food saved.");
  };

  return (
    <div className="page">
      <TopNav />
      <h1>My Meals</h1>
      {!session ? <p className="muted">Login required to manage your meals.</p> : null}
      {error ? <p className="muted">{error}</p> : null}
      {status ? <p className="muted">{status}</p> : null}

      <section className="panel">
        <h3>Add household food</h3>
        <form onSubmit={submitHouseholdFood} className="filters">
          <input
            className="input"
            value={householdFood}
            onChange={(e) => setHouseholdFood(e.target.value)}
            placeholder="e.g. Khichdi, dal soup, soft roti mash"
          />
          <button type="submit" className="btn btn-primary" disabled={!session}>
            Save food
          </button>
        </form>

        {householdFoods.length > 0 ? (
          <p className="muted">Common foods: {householdFoods.map((f) => f.name).join(", ")}</p>
        ) : null}
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

