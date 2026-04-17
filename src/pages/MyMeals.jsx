import { useState } from "react";
import { Link } from "react-router-dom";
import TopNav from "../components/TopNav";
import useCustomMeals from "../hooks/useCustomMeals";
import useFavorites from "../hooks/useFavorites";
import { useLanguage } from "../contexts/LanguageContext";
import useFeedingLog, { REACTION_EMOJI, relativeDate } from "../hooks/useFeedingLog";

function MyMeals() {
  const { t } = useLanguage();
  const { session, userId, customMeals, addCustomMeal, deleteCustomMeal, error, loading } = useCustomMeals();
  const { favoriteMeals, toggleFavorite } = useFavorites();
  const { logs, deleteLog } = useFeedingLog(userId);
  const [showAllLogs, setShowAllLogs] = useState(false);

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
    setStatus(t("mealAdded"));
  };

  return (
    <div className="page">
      <TopNav />

      <span className="eyebrow eo" style={{ marginTop: "1.5rem", display: "block" }}>{t("recipesEyebrow")}</span>
      <h1>{t("myMealsTitle")}</h1>

      {error  && <p className="muted">{error}</p>}
      {status && <p style={{ fontSize: "0.88rem", color: "var(--muted)", fontWeight: 600 }}>{status}</p>}

      {/* ── Add custom meal ── */}
      <section className="panel">
        <h2 style={{ marginBottom: "0.3rem" }}>{t("addCustomMealTitle")}</h2>
        <p className="muted" style={{ fontSize: "0.9rem", marginBottom: "1.2rem", lineHeight: 1.6 }}>
          {t("addCustomMealDesc")}
        </p>
        <form onSubmit={submitMeal} className="filters">
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("mealTitlePlaceholder")} required />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input
              className="input" type="number" min="0"
              value={minAgeMonths} onChange={(e) => setMinAgeMonths(e.target.value)}
              placeholder={t("minAgePlaceholder")} required
            />
            <input
              className="input" type="number" min="0"
              value={maxAgeMonths} onChange={(e) => setMaxAgeMonths(e.target.value)}
              placeholder={t("maxAgePlaceholder")} required
            />
          </div>
          <select className="input" value={mealSlot} onChange={(e) => setMealSlot(e.target.value)}>
            <option value="breakfast">{t("slotBreakfast")}</option>
            <option value="lunch">{t("slotLunch")}</option>
            <option value="dinner">{t("slotDinner")}</option>
          </select>
          <input
            className="input" value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
            placeholder={t("ingredientsPlaceholder")}
          />
          <textarea
            className="input" value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder={t("stepsPlaceholder")} rows={3} style={{ resize: "vertical" }}
          />
          <input
            className="input" value={nutritionHighlight}
            onChange={(e) => setNutritionHighlight(e.target.value)}
            placeholder={t("nutritionPlaceholder")}
          />
          <button type="submit" className="btn btn-primary" disabled={!session || loading}>
            {t("saveMeal")}
          </button>
        </form>
      </section>

      {/* ── Favourites ── */}
      <section className="panel">
        <h2 style={{ marginBottom: "0.3rem" }}>{t("savedFavsTitle")}</h2>
        <p className="muted" style={{ fontSize: "0.9rem", marginBottom: "1.2rem", lineHeight: 1.6 }}>
          {t("savedFavsDesc")}
        </p>
        {favoriteMeals.length === 0 ? (
          <p className="muted">{t("noFavsMyMeals")}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {favoriteMeals.map((meal) => (
              <div key={meal.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div>
                  <Link to={`/meal/${meal.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <strong style={{ fontSize: "0.97rem" }}>{meal.title}</strong>
                  </Link>
                  <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.82rem" }}>
                    {meal.meal_slot} · {meal.min_age_months}–{meal.max_age_months} {t("monthsLabel")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFavorite(meal.id)}
                  title={t("savedFavsTitle")}
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
        <h2 style={{ marginBottom: "1rem" }}>{t("yourMealsTitle")}</h2>
        {customMeals.length === 0 ? (
          <div>
            <p className="muted" style={{ marginBottom: "0.75rem" }}>{t("noCustomMeals")}</p>
            <button
              type="button"
              onClick={() => {
                setTitle("Banana Oatmeal Mash");
                setMinAgeMonths("6");
                setMaxAgeMonths("12");
                setMealSlot("breakfast");
                setIngredientsText("Banana, Oatmeal, Breast milk or formula");
                setSteps("1. Cook oatmeal according to package instructions.\n2. Mash a ripe banana with a fork until smooth.\n3. Mix mashed banana into warm oatmeal.\n4. Add a splash of breast milk or formula to reach desired consistency.");
                setNutritionHighlight("Iron-rich oats + natural banana sweetness");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              style={{
                background: "var(--cream)", border: "1.5px solid var(--border)",
                borderRadius: 12, padding: "8px 16px",
                fontSize: "0.85rem", fontWeight: 700, color: "var(--orange-dark)",
                cursor: "pointer",
              }}
            >
              Try a sample recipe →
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {customMeals.map((meal) => (
              <Link key={meal.id} to={`/my-meals/${meal.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  {meal.image_url && (
                    <img
                      src={meal.image_url}
                      alt={meal.title}
                      style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: "1.5px solid var(--border)" }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: "0.97rem" }}>{meal.title}</strong>
                    <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.82rem" }}>
                      {meal.meal_slot} · {meal.min_age_months}–{meal.max_age_months} {t("monthsLabel")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); deleteCustomMeal(meal.id); }}
                    title="Delete meal"
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--muted)", fontSize: "1rem", padding: 4, flexShrink: 0,
                      lineHeight: 1,
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = "#c0392b"}
                    onMouseOut={(e) => e.currentTarget.style.color = "var(--muted)"}
                  >
                    ✕
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Feeding Log ── */}
      <section className="panel">
        <h2 style={{ marginBottom: "0.2rem", fontSize: "1rem" }}>Feeding Log</h2>
        <p className="muted" style={{ fontSize: "0.8rem", marginBottom: "0.9rem" }}>
          Open any meal and tap "Log as fed" to record a feeding.
        </p>
        {logs.length === 0 ? (
          <p className="muted" style={{ fontSize: "0.82rem" }}>No entries yet.</p>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {(showAllLogs ? logs : logs.slice(0, 10)).map((log, i, arr) => (
                <div key={log.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 0",
                  borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{REACTION_EMOJI[log.reaction]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--dark)" }}>
                      {log.item_name}
                    </span>
                    {log.notes && (
                      <span className="muted" style={{ fontSize: "0.76rem", marginLeft: 5 }}>
                        · {log.notes.length > 45 ? log.notes.slice(0, 45) + "…" : log.notes}
                      </span>
                    )}
                  </div>
                  <span className="muted" style={{ fontSize: "0.72rem", flexShrink: 0 }}>
                    {relativeDate(log.fed_at)}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteLog(log.id)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--muted)", fontSize: "0.72rem", padding: "2px 4px", flexShrink: 0,
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = "#c0392b"}
                    onMouseOut={(e) => e.currentTarget.style.color = "var(--muted)"}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            {logs.length > 10 && (
              <button
                type="button"
                onClick={() => setShowAllLogs((s) => !s)}
                style={{
                  fontSize: "0.8rem", color: "var(--orange-dark)", fontWeight: 700,
                  background: "none", border: "none", cursor: "pointer",
                  padding: "8px 0 0", display: "block",
                }}
              >
                {showAllLogs ? "Show less" : `Show all ${logs.length} entries`}
              </button>
            )}
          </>
        )}
      </section>

      <div style={{ marginBottom: "2rem" }}>
        <Link to="/pantry" style={{ fontSize: "0.88rem", color: "var(--muted)", textDecoration: "underline" }}>
          {t("backToPantry")}
        </Link>
      </div>
    </div>
  );
}

export default MyMeals;
