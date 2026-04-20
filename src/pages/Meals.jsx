import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabaseClient";
import useFavorites from "../hooks/useFavorites";
import useActiveBaby from "../hooks/useActiveBaby";
import LoginPromptModal from "../components/LoginPromptModal";
import { useLanguage } from "../contexts/LanguageContext";

const PAGE_SIZE = 12;
const SLOTS = ["all", "breakfast", "lunch", "dinner", "snack"];
const TYPES = ["all", "quick", "fancy"];

// Maps dietary flag → keywords to look for in allergen_notes
const ALLERGEN_MAP = {
  is_dairy_free:  ["dairy", "milk", "cheese", "butter", "cream", "lactose", "yogurt"],
  is_egg_free:    ["egg"],
  is_nut_free:    ["nut", "peanut", "almond", "cashew", "walnut", "pecan"],
  is_soy_free:    ["soy", "tofu", "edamame"],
  is_fish_free:   ["fish", "salmon", "tuna", "cod", "shellfish", "seafood"],
  is_gluten_free: ["gluten", "wheat", "barley", "rye"],
};

function Meals() {
  const navigate = useNavigate();
  const { session, favoriteIds, toggleFavorite, favoritesError, toastMessage } = useFavorites();
  const { activeBaby, activeBabyAgeMonths } = useActiveBaby();
  const { t } = useLanguage();

  const [meals, setMeals]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [search, setSearch] = useState("");
  const [slot, setSlot]     = useState("all");
  const [type, setType]     = useState("all");
  const [age, setAge]       = useState("");
  const [tab, setTab]           = useState("all");
  const [page, setPage]         = useState(1);
  const [showAll, setShowAll]   = useState(false);
  const [prepTime, setPrepTime] = useState("any");
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Pre-fill age filter from active baby's DOB
  useEffect(() => {
    if (activeBabyAgeMonths !== null && age === "") {
      setAge(String(activeBabyAgeMonths));
    }
  }, [activeBabyAgeMonths]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const loadMeals = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("meals")
        .select("*, meal_foods(foods(allergen_notes))")
        .eq("is_public", true)
        .order("title", { ascending: true });

      if (error) { setError("Could not load meals. Please try again."); setLoading(false); return; }
      setMeals(data || []);
      setError("");
      setLoading(false);
    };
    loadMeals();
  }, []);

  useEffect(() => { setPage(1); setShowAll(false); }, [search, slot, type, age, tab, prepTime]);

  const filteredMeals = useMemo(() => {
    const searchText  = search.trim().toLowerCase();
    const selectedAge = Number(age);
    // prepTime captured via closure — dependency tracked via useMemo deps below

    // Build active dietary restrictions from baby profile
    const activeAllergens = activeBaby
      ? Object.entries(ALLERGEN_MAP).filter(([flag]) => activeBaby[flag])
      : [];

    return meals.filter((meal) => {
      if (tab === "favorites" && !favoriteIds.includes(meal.id)) return false;

      const bySearch = !searchText ||
        meal.title.toLowerCase().includes(searchText) ||
        meal.description?.toLowerCase().includes(searchText) ||
        meal.nutrition_highlight?.toLowerCase().includes(searchText);

      const bySlot = slot === "all" || meal.meal_slot === slot;
      const byType = type === "all" || meal.meal_type === type;
      const byAge  = !age || (Number.isFinite(selectedAge) &&
        selectedAge >= meal.min_age_months && selectedAge <= meal.max_age_months);

      // Exclude meals whose ingredients contain allergens flagged on baby's profile
      const byDiet = activeAllergens.length === 0 || (() => {
        const allNotes = (meal.meal_foods || [])
          .map((mf) => mf.foods?.allergen_notes || "")
          .join(" ")
          .toLowerCase();
        return activeAllergens.every(([, keywords]) =>
          !keywords.some((kw) => allNotes.includes(kw))
        );
      })();

      const byPrep = prepTime === "any" || (meal.prep_time_minutes != null && meal.prep_time_minutes <= 15);

      return bySearch && bySlot && byType && byAge && byDiet && byPrep;
    });
  }, [meals, search, slot, type, age, tab, favoriteIds, activeBaby, prepTime]);

  const totalPages = Math.max(1, Math.ceil(filteredMeals.length / PAGE_SIZE));
  const pageMeals  = useMemo(() => {
    if (showAll) return filteredMeals;
    const start = (page - 1) * PAGE_SIZE;
    return filteredMeals.slice(start, start + PAGE_SIZE);
  }, [filteredMeals, page, showAll]);

  const handleFavoriteClick = (e, mealId) => {
    e.stopPropagation();
    if (!session) { setShowAuthPrompt(true); return; }
    toggleFavorite(mealId);
  };

  const label = (s) => s === "all" ? (s === slot ? "All slots" : "All types") : s.charAt(0).toUpperCase() + s.slice(1);
  const slotLabel = (s) => s === "all" ? t("allSlots") : s.charAt(0).toUpperCase() + s.slice(1);
  const typeLabel = (tp) => tp === "all" ? t("allTypes") : tp.charAt(0).toUpperCase() + tp.slice(1);

  return (
    <div className="page">

      {toastMessage && <div className="toast">{toastMessage}</div>}
      {showAuthPrompt && (
        <LoginPromptModal
          onClose={() => setShowAuthPrompt(false)}
          title="Sign in to get personalised meal suggestions for your baby"
          message="Filter meals by your baby's age, save favourites, and track what's in your pantry."
          icon="🍽️"
        />
      )}

      <span className="eyebrow eo" style={{ marginTop: "1.5rem", display: "block" }}>{t("mealsEyebrow")}</span>
      <h1>{t("mealsTitle")}</h1>
      {activeBaby && (
        <p className="page-sub" style={{ marginTop: "0.2rem" }}>
          {activeBaby.avatar} Showing meals for <strong>{activeBaby.name}</strong> · {activeBabyAgeMonths}m
        </p>
      )}

      {/* ── Tabs ── */}
      <div className="tabs">
        <button className={tab === "all"       ? "btn btn-primary" : "btn"} onClick={() => setTab("all")}>{t("allMealsTab")}</button>
        <button className={tab === "favorites" ? "btn btn-primary" : "btn"} onClick={() => setTab("favorites")}>{t("favoritesTab")}</button>
      </div>

      {/* ── Filters ── */}
      <div className="filters">
        <input
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchMeals")}
        />
        <div className="filters-row-3">
          <select className="input" value={slot} onChange={(e) => setSlot(e.target.value)}>
            {SLOTS.map((s) => <option key={s} value={s}>{slotLabel(s)}</option>)}
          </select>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => <option key={t} value={t}>{typeLabel(t)}</option>)}
          </select>
          <input
            className="input"
            type="number"
            min="4"
            max="24"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder={t("ageMonths")}
            readOnly={!session}
            onClick={() => { if (!session) setShowAuthPrompt(true); }}
            style={{ cursor: !session ? "pointer" : undefined }}
          />
        </div>
      </div>

      {/* ── Quick filter toggle ── */}
      <div style={{ display: "flex", gap: 8, marginTop: "0.5rem" }}>
        <button
          type="button"
          onClick={() => setPrepTime("any")}
          className={prepTime === "any" ? "btn btn-primary" : "btn"}
          style={{ fontSize: "0.8rem", padding: "5px 14px" }}
        >
          Any time
        </button>
        <button
          type="button"
          onClick={() => setPrepTime("quick")}
          className={prepTime === "quick" ? "btn btn-primary" : "btn"}
          style={{ fontSize: "0.8rem", padding: "5px 14px" }}
        >
          ⚡ Quick &lt;15 min
        </button>
      </div>

      {/* ── Active filter pills ── */}
      {(slot !== "all" || type !== "all" || age) && (
        <div className="filter-pills">
          {slot !== "all" && <span className="filter-pill" onClick={() => setSlot("all")}>{slotLabel(slot)} ✕</span>}
          {type !== "all" && <span className="filter-pill" onClick={() => setType("all")}>{typeLabel(type)} ✕</span>}
          {age           && <span className="filter-pill" onClick={() => setAge("")}>{age} months ✕</span>}
        </div>
      )}

      {/* ── Results count ── */}
      {!loading && !error && (
        <p className="results-count">
          {filteredMeals.length === 0
            ? t("noMeals")
            : showAll
              ? t("showingAllMeals", filteredMeals.length)
              : t("showingMeals", (page - 1) * PAGE_SIZE + 1, Math.min(page * PAGE_SIZE, filteredMeals.length), filteredMeals.length)}
        </p>
      )}

      {/* ── States ── */}
      {loading && <p className="muted">Loading meals...</p>}
      {error && <p className="muted">{error}</p>}
      {favoritesError && <p className="muted">{favoritesError}</p>}
      {tab === "favorites" && !session && <p className="muted">{t("logInFavs")}</p>}
      {tab === "favorites" && session && filteredMeals.length === 0 && !loading && (
        <p className="muted">{t("noFavsYet")}</p>
      )}

      {/* ── Meal grid ── */}
      {!loading && !error && (
        <div className="foods-grid">
          {pageMeals.map((meal) => (
            <div key={meal.id} className="food-card" style={{ position: "relative" }} onClick={() => navigate(`/meal/${meal.id}`)}>

              {/* Favourite heart */}
              <button
                type="button"
                onClick={(e) => handleFavoriteClick(e, meal.id)}
                title={favoriteIds.includes(meal.id) ? "Remove from favourites" : "Save to favourites"}
                style={{
                  position: "absolute", top: 8, right: 8, zIndex: 10,
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: "1.15rem", lineHeight: 1, padding: 4,
                  color: favoriteIds.includes(meal.id) ? "#e74c3c" : "var(--muted)",
                  filter: favoriteIds.includes(meal.id) ? "none" : "opacity(0.55)",
                }}
              >
                {favoriteIds.includes(meal.id) ? "♥" : "♡"}
              </button>

              {/* Front */}
              <div className="food-card-front">
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                  <span className="badge badge-slot">{meal.meal_slot}</span>
                  <span className={`badge ${meal.meal_type === "quick" ? "badge-quick" : "badge-fancy"}`}>
                    {meal.meal_type}
                  </span>
                </div>
                <p className="food-card-name">{meal.title}</p>
                <span className="badge badge-age">{meal.min_age_months}–{meal.max_age_months}m</span>
              </div>

              {/* Hover */}
              <div className="food-card-details">
                <p style={{ fontWeight: 700, fontSize: "0.9rem", margin: "0 0 5px", color: "var(--dark)", fontFamily: "Aileron, sans-serif" }}>
                  {meal.title}
                </p>
                <p className="food-detail-row">{meal.description}</p>
                <p className="food-detail-row">Age: <strong>{meal.min_age_months}–{meal.max_age_months}m</strong></p>
                <p className="food-detail-row">Prep: <strong>{meal.prep_time_minutes} min</strong></p>
                {meal.nutrition_highlight && (
                  <p className="food-detail-row" style={{ marginTop: 4 }}>{meal.nutrition_highlight}</p>
                )}
                <p style={{ fontSize: "0.75rem", color: "var(--orange-dark)", marginTop: 6, fontWeight: 700 }}>
                  {t("clickRecipe")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && !showAll && totalPages > 1 && (
        <div className="pagination">
          <button className="pagination-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`pagination-btn${p === page ? " active" : ""}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button className="pagination-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next →
          </button>
        </div>
      )}
      {!loading && filteredMeals.length > PAGE_SIZE && (
        <div style={{ textAlign: "center", marginTop: "1rem", display: "flex", gap: "0.5rem", justifyContent: "center" }}>
          <button
            className="pagination-btn"
            onClick={() => { setShowAll((s) => !s); setPage(1); }}
          >
            {showAll ? t("showPages") : t("showAll")}
          </button>
          {showAll && (
            <button
              className="pagination-btn"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              ↑ Top
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Meals;
