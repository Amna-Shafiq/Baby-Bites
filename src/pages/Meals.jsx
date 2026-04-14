import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopNav from "../components/TopNav";
import { supabase } from "../lib/supabaseClient";
import useFavorites from "../hooks/useFavorites";
import useActiveBaby from "../hooks/useActiveBaby";

const PAGE_SIZE = 9;
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

  const [meals, setMeals]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [search, setSearch] = useState("");
  const [slot, setSlot]     = useState("all");
  const [type, setType]     = useState("all");
  const [age, setAge]       = useState("");
  const [tab, setTab]       = useState("all");
  const [page, setPage]     = useState(1);

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

  useEffect(() => { setPage(1); }, [search, slot, type, age, tab]);

  const filteredMeals = useMemo(() => {
    const searchText  = search.trim().toLowerCase();
    const selectedAge = Number(age);

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

      return bySearch && bySlot && byType && byAge && byDiet;
    });
  }, [meals, search, slot, type, age, tab, favoriteIds, activeBaby]);

  const totalPages = Math.max(1, Math.ceil(filteredMeals.length / PAGE_SIZE));
  const pageMeals  = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredMeals.slice(start, start + PAGE_SIZE);
  }, [filteredMeals, page]);

  const label = (s) => s === "all" ? (s === slot ? "All slots" : "All types") : s.charAt(0).toUpperCase() + s.slice(1);
  const slotLabel = (s) => s === "all" ? "All slots" : s.charAt(0).toUpperCase() + s.slice(1);
  const typeLabel = (t) => t === "all" ? "All types" : t.charAt(0).toUpperCase() + t.slice(1);

  return (
    <div className="page">
      <TopNav />
      {toastMessage && <div className="toast">{toastMessage}</div>}

      <span className="eyebrow eo" style={{ marginTop: "1.5rem", display: "block" }}>Browse</span>
      <h1>Meals</h1>
      {activeBaby && (
        <p className="page-sub" style={{ marginTop: "0.2rem" }}>
          {activeBaby.avatar} Showing meals for <strong>{activeBaby.name}</strong> · {activeBabyAgeMonths}m
        </p>
      )}

      {/* ── Tabs ── */}
      <div className="tabs">
        <button className={tab === "all"       ? "btn btn-primary" : "btn"} onClick={() => setTab("all")}>All Meals</button>
        <button className={tab === "favorites" ? "btn btn-primary" : "btn"} onClick={() => setTab("favorites")}>Favorites</button>
      </div>

      {/* ── Filters ── */}
      <div className="filters">
        <input
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search meals..."
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
            placeholder="Age (months)"
          />
        </div>
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
            ? "No meals found"
            : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filteredMeals.length)} of ${filteredMeals.length} meals`}
        </p>
      )}

      {/* ── States ── */}
      {loading && <p className="muted">Loading meals...</p>}
      {error && <p className="muted">{error}</p>}
      {favoritesError && <p className="muted">{favoritesError}</p>}
      {tab === "favorites" && !session && <p className="muted">Log in to see your saved favorites.</p>}
      {tab === "favorites" && session && filteredMeals.length === 0 && !loading && (
        <p className="muted">No favorites yet. Tap the heart icon to save meals.</p>
      )}

      {/* ── Meal grid ── */}
      {!loading && !error && (
        <div className="foods-grid">
          {pageMeals.map((meal) => (
            <div key={meal.id} className="food-card" onClick={() => navigate(`/meal/${meal.id}`)}>

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
                <p style={{ fontWeight: 700, fontSize: "0.9rem", margin: "0 0 5px", color: "var(--dark)", fontFamily: "Fraunces, serif" }}>
                  {meal.title}
                </p>
                <p className="food-detail-row">{meal.description}</p>
                <p className="food-detail-row">Age: <strong>{meal.min_age_months}–{meal.max_age_months}m</strong></p>
                <p className="food-detail-row">Prep: <strong>{meal.prep_time_minutes} min</strong></p>
                {meal.nutrition_highlight && (
                  <p className="food-detail-row" style={{ marginTop: 4 }}>{meal.nutrition_highlight}</p>
                )}
                <p style={{ fontSize: "0.75rem", color: "var(--orange-dark)", marginTop: 6, fontWeight: 700 }}>
                  Click for full recipe →
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
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
    </div>
  );
}

export default Meals;
