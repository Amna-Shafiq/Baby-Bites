import { useState, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { Link } from "react-router-dom";
import { mealSlug } from "../lib/mealSlug";

import useCustomMeals from "../hooks/useCustomMeals";
import LoginPromptModal from "../components/LoginPromptModal";
import PantrySearch from "../components/PantrySearch";
import { useLanguage } from "../contexts/LanguageContext";

const ALLERGEN_MAP = {
  is_dairy_free:  ["dairy", "milk", "cheese", "butter", "cream", "lactose", "yogurt"],
  is_egg_free:    ["egg"],
  is_nut_free:    ["nut", "peanut", "almond", "cashew", "walnut", "pecan"],
  is_soy_free:    ["soy", "tofu", "edamame"],
  is_fish_free:   ["fish", "salmon", "tuna", "cod", "shellfish", "seafood"],
  is_gluten_free: ["gluten", "wheat", "barley", "rye"],
};

const ALLERGEN_PILLS = [
  { flag: "is_dairy_free",  label: "Dairy-free",  icon: "🥛" },
  { flag: "is_egg_free",    label: "Egg-free",    icon: "🥚" },
  { flag: "is_nut_free",    label: "Nut-free",    icon: "🥜" },
  { flag: "is_soy_free",    label: "Soy-free",    icon: "🌱" },
  { flag: "is_fish_free",   label: "Fish-free",   icon: "🐟" },
  { flag: "is_gluten_free", label: "Gluten-free", icon: "🌾" },
];

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
  const [activeAllergens, setActiveAllergens] = useState(new Set());

  const toggleAllergen = (flag) => {
    setActiveAllergens(prev => {
      const next = new Set(prev);
      if (next.has(flag)) next.delete(flag); else next.add(flag);
      return next;
    });
  };

  const filteredSuggestions = useMemo(() => {
    if (activeAllergens.size === 0) return mealSuggestions;
    return mealSuggestions.filter((meal) => {
      const allNotes = (meal.meal_foods || [])
        .map((mf) => mf.foods?.allergen_notes || "").join(" ").toLowerCase();
      return [...activeAllergens].every(flag =>
        !(ALLERGEN_MAP[flag] || []).some(kw => allNotes.includes(kw))
      );
    });
  }, [mealSuggestions, activeAllergens]);

  const canMakeNow  = filteredSuggestions.filter((m) => m.matchCount === m.totalCount);
  const almostThere = filteredSuggestions.filter((m) => m.totalCount - m.matchCount === 1);

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

  const totalSuggestions = canMakeNow.length + almostThere.length;

  return (
    <div className="page">

      {showLoginModal && <LoginPromptModal onClose={() => setShowLoginModal(false)} />}

      <span className="eyebrow eo" style={{ marginTop: "1.5rem", display: "block" }}>{t("pantryEyebrow")}</span>
      <h1 style={{ marginBottom: householdFoods.length > 0 ? "0.5rem" : "1rem" }}>{t("pantryTitle")}</h1>

      {/* ── Summary bar ── */}
      {householdFoods.length > 0 && (
        <div style={{
          display: "flex", gap: 20, marginBottom: "1.25rem",
          padding: "10px 16px", borderRadius: 12,
          background: "var(--cream)", border: "1px solid var(--border)",
        }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: "1.3rem", color: "var(--dark)", lineHeight: 1 }}>{householdFoods.length}</p>
            <p style={{ margin: "2px 0 0", fontSize: "0.7rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>In pantry</p>
          </div>
          <div style={{ width: 1, background: "var(--border)" }} />
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: "1.3rem", color: "var(--green-dark)", lineHeight: 1 }}>{canMakeNow.length}</p>
            <p style={{ margin: "2px 0 0", fontSize: "0.7rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Ready to make</p>
          </div>
          <div style={{ width: 1, background: "var(--border)" }} />
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: "1.3rem", color: "var(--yellow-dark)", lineHeight: 1 }}>{almostThere.length}</p>
            <p style={{ margin: "2px 0 0", fontSize: "0.7rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Almost there</p>
          </div>
        </div>
      )}

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

      {/* ── Staples note + allergen filters ── */}
      {householdFoods.length > 0 && (
        <section className="panel" style={{ paddingBottom: "1rem" }}>
          <p style={{
            fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.6,
            marginBottom: "1rem",
          }}>
            💡 We assume you always have <strong>salt, oil, ghee, butter, cumin, coriander, turmeric, ginger, garlic</strong> and other common spices. Just add your main ingredients above.
          </p>
          <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.6rem" }}>
            Dietary filters
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ALLERGEN_PILLS.map(({ flag, label, icon }) => {
              const active = activeAllergens.has(flag);
              return (
                <button
                  key={flag}
                  type="button"
                  onClick={() => toggleAllergen(flag)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 12px", borderRadius: 20, cursor: "pointer",
                    fontSize: "0.78rem", fontWeight: 700,
                    background: active ? "var(--orange-dark)" : "var(--cream)",
                    color: active ? "#fff" : "var(--muted)",
                    border: active ? "1.5px solid var(--orange-dark)" : "1.5px solid var(--border)",
                    transition: "all 0.15s",
                  }}
                >
                  {icon} {label}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Empty suggestions state ── */}
      {householdFoods.length > 0 && totalSuggestions === 0 && (
        <div style={{
          textAlign: "center", padding: "2rem 1rem",
          background: "var(--cream)", borderRadius: 16,
          border: "1px solid var(--border)", marginBottom: "1rem",
        }}>
          <p style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>🍽️</p>
          <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--dark)", margin: "0 0 0.3rem" }}>No meals found yet</p>
          <p style={{ fontSize: "0.82rem", color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
            Try adding more ingredients, or remove a dietary filter.
          </p>
        </div>
      )}

      {/* ── Can make now ── */}
      {canMakeNow.length > 0 && (
        <section className="panel">
          <h2 style={{ marginBottom: "0.25rem" }}>
            ✅ You can make now
            <span style={{
              marginLeft: 10, fontSize: "0.75rem", fontWeight: 700,
              background: "var(--green-light)", color: "var(--green-dark)",
              border: "1px solid #a8e6c4", borderRadius: 20, padding: "2px 10px",
              verticalAlign: "middle",
            }}>{canMakeNow.length}</span>
          </h2>
          <p className="muted" style={{ fontSize: "0.88rem", marginBottom: "1rem", lineHeight: 1.6 }}>
            You have all the ingredients for these meals.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
            {canMakeNow.map((meal) => (
              <Link key={meal.id} to={`/meal/${mealSlug(meal)}`} style={{ textDecoration: "none" }}>
                <div style={{
                  background: "var(--card-bg, #fff)", borderRadius: 14,
                  border: "1.5px solid var(--border)", borderTop: "3px solid var(--green-dark)",
                  overflow: "hidden", cursor: "pointer", height: "100%",
                  display: "flex", flexDirection: "column",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(45,36,22,0.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
                >
                  {meal.image_url ? (
                    <img src={meal.image_url} alt={meal.title} style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ width: "100%", height: 90, background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>🍽️</div>
                  )}
                  <div style={{ padding: "8px 10px 10px", display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
                    <strong style={{ fontSize: "0.82rem", color: "var(--dark)", lineHeight: 1.3,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {meal.title}
                    </strong>
                    <p className="muted" style={{ margin: 0, fontSize: "0.72rem" }}>
                      {meal.meal_slot} · {meal.min_age_months}–{meal.max_age_months}m
                    </p>
                    <span style={{
                      marginTop: "auto", alignSelf: "flex-start",
                      fontSize: "0.68rem", fontWeight: 700,
                      background: "var(--green-light)", color: "var(--green-dark)",
                      border: "1px solid #a8e6c4", borderRadius: 20, padding: "2px 8px",
                    }}>
                      {meal.matchCount}/{meal.totalCount} ingredients
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Almost there ── */}
      {almostThere.length > 0 && (
        <section className="panel">
          <h2 style={{ marginBottom: "0.25rem" }}>
            🛒 Almost there
            <span style={{
              marginLeft: 10, fontSize: "0.75rem", fontWeight: 700,
              background: "var(--yellow)", color: "var(--yellow-dark)",
              border: "1px solid var(--yellow-mid)", borderRadius: 20, padding: "2px 10px",
              verticalAlign: "middle",
            }}>{almostThere.length}</span>
          </h2>
          <p className="muted" style={{ fontSize: "0.88rem", marginBottom: "1rem", lineHeight: 1.6 }}>
            Grab one more ingredient and you can make these.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
            {almostThere.map((meal) => (
              <Link key={meal.id} to={`/meal/${mealSlug(meal)}`} style={{ textDecoration: "none" }}>
                <div style={{
                  background: "var(--card-bg, #fff)", borderRadius: 14,
                  border: "1.5px solid var(--border)", borderTop: "3px solid var(--yellow-dark)",
                  overflow: "hidden", cursor: "pointer", height: "100%",
                  display: "flex", flexDirection: "column",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(45,36,22,0.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
                >
                  {meal.image_url ? (
                    <img src={meal.image_url} alt={meal.title} style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ width: "100%", height: 90, background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>🍽️</div>
                  )}
                  <div style={{ padding: "8px 10px 10px", display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
                    <strong style={{ fontSize: "0.82rem", color: "var(--dark)", lineHeight: 1.3,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {meal.title}
                    </strong>
                    <p className="muted" style={{ margin: 0, fontSize: "0.72rem" }}>
                      {meal.meal_slot} · {meal.min_age_months}–{meal.max_age_months}m
                    </p>
                    {meal.missingIngredients?.length > 0 && (
                      <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--orange-dark)", fontWeight: 700 }}>
                        Missing: {meal.missingIngredients.join(", ")}
                      </p>
                    )}
                    <span style={{
                      marginTop: "auto", alignSelf: "flex-start",
                      fontSize: "0.68rem", fontWeight: 700,
                      background: "var(--yellow)", color: "var(--yellow-dark)",
                      border: "1px solid var(--yellow-mid)", borderRadius: 20, padding: "2px 8px",
                    }}>
                      {meal.matchCount}/{meal.totalCount} ingredients
                    </span>
                  </div>
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
