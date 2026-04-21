import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

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
  const [startingMonth, setStartingMonth]     = useState("6");
  const [mealSlot, setMealSlot]               = useState("lunch");
  const [ingredientsText, setIngredientsText] = useState("");
  const [steps, setSteps]                     = useState("");
  const [nutritionHighlight, setNutritionHighlight] = useState("");
  const [status, setStatus]                   = useState("");
  const [imageFile, setImageFile]             = useState(null);
  const [imagePreview, setImagePreview]       = useState(null);
  const [uploading, setUploading]             = useState(false);
  const fileRef                               = useRef(null);

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const submitMeal = async (e) => {
    e.preventDefault();
    setStatus("");
    setUploading(true);

    let imageUrl = null;
    if (imageFile && session) {
      const ext = imageFile.name.split(".").pop();
      const path = `${session.user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("meal-images").upload(path, imageFile, { upsert: true });
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from("meal-images").getPublicUrl(path);
        imageUrl = publicUrl;
      }
    }

    const result = await addCustomMeal({
      title, startingMonth, mealSlot,
      ingredients: ingredientsText.split(",").map((s) => s.trim()).filter(Boolean),
      steps, nutritionHighlight, imageUrl,
    });
    setUploading(false);
    if (result.error) { setStatus(result.error); return; }
    setTitle(""); setIngredientsText(""); setSteps(""); setNutritionHighlight("");
    setImageFile(null); setImagePreview(null);
    setStatus(t("mealAdded"));
  };

  return (
    <div className="page">


      <span className="eyebrow eo" style={{ marginTop: "1.5rem", display: "block" }}>{t("recipesEyebrow")}</span>
      <h1>{t("myMealsTitle")}</h1>

      {error  && <p className="muted">{error}</p>}
      {status && <p style={{ fontSize: "0.88rem", color: "var(--muted)", fontWeight: 600 }}>{status}</p>}

      {/* ── Add custom meal ── */}
      <section className="panel">
        <h2 style={{ marginBottom: "1rem" }}>{t("addCustomMealTitle")}</h2>
        <form onSubmit={submitMeal} style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Image picker */}
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: "100%", height: 120, borderRadius: 12, cursor: "pointer",
              border: imagePreview ? "none" : "2px dashed var(--border)",
              background: imagePreview ? "none" : "var(--cream)",
              overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative",
            }}
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <span style={{ position: "absolute", bottom: 6, right: 8, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: "0.72rem", fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>
                  📷 Change
                </span>
              </>
            ) : (
              <div style={{ textAlign: "center", color: "var(--muted)" }}>
                <p style={{ margin: 0, fontSize: "1.5rem" }}>📷</p>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", fontWeight: 700 }}>Add photo (optional)</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImagePick} />

          {/* Title */}
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("mealTitlePlaceholder")} required />

          {/* Starting month + meal slot */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>
                Starting month
              </label>
              <input
                className="input" type="number" min="0" max="36"
                value={startingMonth} onChange={(e) => setStartingMonth(e.target.value)}
                placeholder="e.g. 6" required
              />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>
                Meal slot
              </label>
              <select className="input" value={mealSlot} onChange={(e) => setMealSlot(e.target.value)}>
                <option value="breakfast">{t("slotBreakfast")}</option>
                <option value="lunch">{t("slotLunch")}</option>
                <option value="dinner">{t("slotDinner")}</option>
              </select>
            </div>
          </div>

          {/* Ingredients */}
          <input
            className="input" value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
            placeholder={t("ingredientsPlaceholder")}
          />

          {/* Steps */}
          <textarea
            className="input" value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder={t("stepsPlaceholder")} rows={3} style={{ resize: "vertical" }}
          />

          {/* Nutrition */}
          <input
            className="input" value={nutritionHighlight}
            onChange={(e) => setNutritionHighlight(e.target.value)}
            placeholder={t("nutritionPlaceholder")}
          />

          <button type="submit" className="btn btn-primary" disabled={!session || loading || uploading}>
            {uploading ? "Saving…" : t("saveMeal")}
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
                setStartingMonth("6");
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
        <p className="muted" style={{ fontSize: "0.8rem", marginBottom: "1rem" }}>
          Open any meal or food and tap "Log as fed".
        </p>

        {logs.length === 0 ? (
          <p className="muted" style={{ fontSize: "0.82rem" }}>No entries yet.</p>
        ) : (() => {
          const mealLogs = logs.filter((l) => !l.food_id);
          const foodLogs = logs.filter((l) =>  l.food_id);
          const visibleMeals = showAllLogs ? mealLogs : mealLogs.slice(0, 8);
          const visibleFoods = showAllLogs ? foodLogs : foodLogs.slice(0, 8);
          const hasMore = mealLogs.length > 8 || foodLogs.length > 8;

          const LogEntry = ({ log }) => (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 6,
              padding: "6px 0", borderBottom: "1px solid var(--border)",
            }}>
              <span style={{ fontSize: "1rem", flexShrink: 0, lineHeight: 1.4 }}>{REACTION_EMOJI[log.reaction]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, color: "var(--dark)", lineHeight: 1.3 }}>
                  {log.item_name}
                </p>
                {log.notes && (
                  <p className="muted" style={{ margin: 0, fontSize: "0.72rem", lineHeight: 1.3 }}>
                    {log.notes.length > 35 ? log.notes.slice(0, 35) + "…" : log.notes}
                  </p>
                )}
                <p className="muted" style={{ margin: 0, fontSize: "0.68rem" }}>{relativeDate(log.fed_at)}</p>
              </div>
              <button
                type="button"
                onClick={() => deleteLog(log.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "0.7rem", padding: "2px", flexShrink: 0, lineHeight: 1 }}
                onMouseOver={(e) => e.currentTarget.style.color = "#c0392b"}
                onMouseOut={(e) => e.currentTarget.style.color = "var(--muted)"}
              >✕</button>
            </div>
          );

          return (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Meals column */}
                <div>
                  <p style={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "0.4rem" }}>
                    Meals fed
                  </p>
                  {mealLogs.length === 0
                    ? <p className="muted" style={{ fontSize: "0.78rem" }}>None yet</p>
                    : visibleMeals.map((log) => <LogEntry key={log.id} log={log} />)
                  }
                </div>
                {/* Foods column */}
                <div>
                  <p style={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "0.4rem" }}>
                    Foods tried
                  </p>
                  {foodLogs.length === 0
                    ? <p className="muted" style={{ fontSize: "0.78rem" }}>None yet</p>
                    : visibleFoods.map((log) => <LogEntry key={log.id} log={log} />)
                  }
                </div>
              </div>
              {hasMore && (
                <button
                  type="button"
                  onClick={() => setShowAllLogs((s) => !s)}
                  style={{ fontSize: "0.8rem", color: "var(--orange-dark)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: "8px 0 0", display: "block" }}
                >
                  {showAllLogs ? "Show less" : `Show all (${logs.length})`}
                </button>
              )}
            </>
          );
        })()}
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
