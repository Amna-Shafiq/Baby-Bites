import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Link } from "react-router-dom";
import TopNav from "../components/TopNav";
import useCustomMeals from "../hooks/useCustomMeals";
import LoginPromptModal from "../components/LoginPromptModal";
import PantrySearch from "../components/PantrySearch";
import { useLanguage } from "../contexts/LanguageContext";

function Pantry() {
  const { t } = useLanguage();
  const {
    session,
    householdFoods,
    mealSuggestions,
    addHouseholdFood,
    removeHouseholdFood,
    error,
  } = useCustomMeals();

  const [pantryStatus, setPantryStatus]   = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);

  const SUGGESTED_FOODS = ["Banana", "Sweet Potato", "Oatmeal"];

  const handleAddSuggested = async (name) => {
    setPantryStatus("");
    const { data } = await supabase.from("foods").select("id, name").ilike("name", name).limit(1);
    const food = data?.[0];
    if (food) {
      await handleAddFood({ name: food.name, id: food.id });
    } else {
      const result = await addHouseholdFood({ name });
      if (result?.duplicates?.length) setPantryStatus(t("alreadyInPantry", name));
    }
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
      setPantryStatus(t("alreadyInPantry", result.duplicates[0]));
    }
  };

  return (
    <div className="page">
      <TopNav />
      {showLoginModal && <LoginPromptModal onClose={() => setShowLoginModal(false)} />}

      <span className="eyebrow eo" style={{ marginTop: "1.5rem", display: "block" }}>{t("pantryEyebrow")}</span>
      <h1>{t("pantryTitle")}</h1>

      {error && <p className="muted">{error}</p>}

      {/* ── Pantry search ── */}
      <section className="panel">
        <h2 style={{ marginBottom: "0.3rem" }}>{t("pantrySearchTitle")}</h2>
        <p className="muted" style={{ fontSize: "0.9rem", marginBottom: "1.2rem", lineHeight: 1.6 }}>
          {t("pantrySearchDesc")}
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <PantrySearch onAdd={handleAddFood} existingFoods={householdFoods} />
        </div>

        {pantryStatus && (
          <p style={{ marginTop: 10, fontSize: "0.85rem", color: "var(--muted)", fontWeight: 600 }}>
            {pantryStatus}
          </p>
        )}

        {/* ── Pantry chips ── */}
        {householdFoods.length > 0 && (
          <div style={{ marginTop: "1.4rem" }}>
            <p style={{
              fontSize: "0.72rem", fontWeight: 700, color: "var(--muted)",
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.7rem",
            }}>
              {t("pantryCount", householdFoods.length)}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {householdFoods.map((food) => (
                <span key={food.id} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 10px 5px 13px",
                  background: "var(--yellow)", border: "1px solid var(--yellow-mid)",
                  borderRadius: "100px", fontSize: "0.82rem", fontWeight: 700,
                  color: "var(--yellow-dark)",
                }}>
                  {food.name}
                  <button
                    type="button"
                    onClick={() => removeHouseholdFood(food.id)}
                    title={t("removeFromPantry")}
                    style={{
                      background: "var(--yellow-mid)", border: "none", cursor: "pointer",
                      color: "var(--yellow-dark)", fontSize: "0.7rem", lineHeight: 1,
                      width: 18, height: 18, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
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
          <div style={{ marginTop: "1.2rem" }}>
            <p className="muted" style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              {t("pantryEmpty")}
            </p>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
              Popular first foods
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SUGGESTED_FOODS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleAddSuggested(name)}
                  style={{
                    background: "var(--cream)", border: "1.5px solid var(--border)",
                    borderRadius: "100px", padding: "6px 14px",
                    fontSize: "0.82rem", fontWeight: 700, color: "var(--dark)",
                    cursor: "pointer",
                  }}
                >
                  + {name}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Meal suggestions ── */}
      {mealSuggestions.length > 0 && (
        <section className="panel">
          <h2 style={{ marginBottom: "0.3rem" }}>{t("mealsYouCanMake")}</h2>
          <p className="muted" style={{ fontSize: "0.9rem", marginBottom: "1.2rem", lineHeight: 1.6 }}>
            {t("mealsYouCanMakeDesc")}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mealSuggestions.map((meal) => (
              <Link key={meal.id} to={`/meal/${meal.id}`} style={{ textDecoration: "none" }}>
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

      {/* ── Link to custom meals ── */}
      <div style={{ marginTop: "0.5rem", marginBottom: "2rem" }}>
        <Link to="/my-meals" style={{ fontSize: "0.88rem", color: "var(--muted)", textDecoration: "underline" }}>
          {t("manageCustomMeals")}
        </Link>
      </div>
    </div>
  );
}

export default Pantry;
