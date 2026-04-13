import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopNav from "../components/TopNav";
import { supabase } from "../lib/supabaseClient";
import useFavorites from "../hooks/useFavorites";

const PAGE_SIZE = 9;

const SLOTS = ["all", "breakfast", "lunch", "dinner", "snack"];
const TYPES = ["all", "quick", "fancy"];

function Meals() {
  const navigate = useNavigate();
  const { session, favoriteIds, toggleFavorite, favoritesError, toastMessage } = useFavorites();

  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [slot, setSlot] = useState("all");
  const [type, setType] = useState("all");
  const [age, setAge] = useState("");
  const [tab, setTab] = useState("all"); // all | favorites

  // Pagination
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadMeals = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("is_public", true)
        .order("title", { ascending: true });

      if (error) {
        setError("Could not load meals. Please try again.");
        setLoading(false);
        return;
      }

      setMeals(data || []);
      setError("");
      setLoading(false);
    };

    loadMeals();
  }, []);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, slot, type, age, tab]);

  const filteredMeals = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    const selectedAge = Number(age);

    return meals.filter((meal) => {
      if (tab === "favorites") {
        if (!favoriteIds.includes(meal.id)) return false;
      }

      const bySearch =
        !searchText ||
        meal.title.toLowerCase().includes(searchText) ||
        meal.description?.toLowerCase().includes(searchText) ||
        meal.nutrition_highlight?.toLowerCase().includes(searchText);

      const bySlot = slot === "all" || meal.meal_slot === slot;
      const byType = type === "all" || meal.meal_type === type;

      const byAge =
        !age ||
        (Number.isFinite(selectedAge) &&
          selectedAge >= meal.min_age_months &&
          selectedAge <= meal.max_age_months);

      return bySearch && bySlot && byType && byAge;
    });
  }, [meals, search, slot, type, age, tab, favoriteIds]);

  const totalPages = Math.max(1, Math.ceil(filteredMeals.length / PAGE_SIZE));

  const pageMeals = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredMeals.slice(start, start + PAGE_SIZE);
  }, [filteredMeals, page]);

  const slotLabel = (s) =>
    s === "all" ? "All slots" : s.charAt(0).toUpperCase() + s.slice(1);

  const typeLabel = (t) =>
    t === "all" ? "All types" : t.charAt(0).toUpperCase() + t.slice(1);

  return (
    <div className="page">
      <TopNav />
      {toastMessage ? <div className="toast">{toastMessage}</div> : null}
      <h1>Meals</h1>

      {/* ── Top tabs ── */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button
          className={tab === "all" ? "btn btn-primary" : "btn"}
          onClick={() => setTab("all")}
        >
          All Meals
        </button>
        <button
          className={tab === "favorites" ? "btn btn-primary" : "btn"}
          onClick={() => setTab("favorites")}
        >
          Favorites
        </button>
      </div>

      {/* ── Search bar ── */}
      <div className="filters" style={{ marginBottom: 12 }}>
        <input
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search meals..."
          style={{ width: "100%", boxSizing: "border-box" }}
        />

        {/* ── Second row: slot + type + age ── */}
        <div className="filters-row">
          <select
            className="input"
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
          >
            {SLOTS.map((s) => (
              <option key={s} value={s}>{slotLabel(s)}</option>
            ))}
          </select>

          <select
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>{typeLabel(t)}</option>
            ))}
          </select>

          <input
            className="input"
            type="number"
            min="4"
            max="24"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Age (months)"
            style={{ maxWidth: 130 }}
          />
        </div>
      </div>

      {/* ── Active filter pills ── */}
      {(slot !== "all" || type !== "all" || age) && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {slot !== "all" && (
            <span
              onClick={() => setSlot("all")}
              style={{
                fontSize: 12, padding: "4px 10px", borderRadius: 20,
                background: "#f0f0f0", cursor: "pointer", border: "1px solid #ddd"
              }}
            >
              {slotLabel(slot)} ✕
            </span>
          )}
          {type !== "all" && (
            <span
              onClick={() => setType("all")}
              style={{
                fontSize: 12, padding: "4px 10px", borderRadius: 20,
                background: "#f0f0f0", cursor: "pointer", border: "1px solid #ddd"
              }}
            >
              {typeLabel(type)} ✕
            </span>
          )}
          {age && (
            <span
              onClick={() => setAge("")}
              style={{
                fontSize: 12, padding: "4px 10px", borderRadius: 20,
                background: "#f0f0f0", cursor: "pointer", border: "1px solid #ddd"
              }}
            >
              {age} months ✕
            </span>
          )}
        </div>
      )}

      {/* ── Results count ── */}
      {!loading && !error && (
        <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
          {filteredMeals.length === 0
            ? "No meals found"
            : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filteredMeals.length)} of ${filteredMeals.length} meals`}
        </p>
      )}

      {/* ── States ── */}
      {loading && <p className="muted">Loading meals...</p>}
      {error && <p className="muted">{error}</p>}
      {favoritesError && <p className="muted">{favoritesError}</p>}
      {tab === "favorites" && !session && (
        <p className="muted">Log in to see your saved favorites.</p>
      )}
      {tab === "favorites" && session && filteredMeals.length === 0 && !loading && (
        <p className="muted">No favorites yet. Tap the heart icon to save meals.</p>
      )}

      {/* ── Meal grid ── */}
      {!loading && !error && (
        <div className="foods-grid">
          {pageMeals.map((meal) => (
            <div
              key={meal.id}
              className="food-card"
              onClick={() => navigate(`/meal/${meal.id}`)}
            >
              {/* Front — title + slot + type badge */}
              <div className="food-card-front">
                <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 20,
                    background: "#fff3e0", color: "#e65100", border: "1px solid #ffe0b2"
                  }}>
                    {meal.meal_slot}
                  </span>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 20,
                    background: meal.meal_type === "quick" ? "#e8f5e9" : "#f3e5f5",
                    color: meal.meal_type === "quick" ? "#2e7d32" : "#6a1b9a",
                    border: `1px solid ${meal.meal_type === "quick" ? "#c8e6c9" : "#e1bee7"}`
                  }}>
                    {meal.meal_type}
                  </span>
                </div>
                <p className="food-card-name">{meal.title}</p>
                <p style={{ fontSize: 12, color: "#aaa", margin: "4px 0 0" }}>
                  {meal.min_age_months}–{meal.max_age_months}m
                </p>
              </div>

              {/* Hover — details */}
              <div className="food-card-details">
                <p style={{ fontWeight: 500, fontSize: 14, margin: "0 0 6px" }}>{meal.title}</p>
                <p style={{ fontSize: 12, color: "#555", margin: "0 0 6px" }}>{meal.description}</p>
                <p style={{ fontSize: 12, color: "#777", margin: "0 0 4px" }}>
                  Age: <strong>{meal.min_age_months}–{meal.max_age_months}m</strong>
                </p>
                <p style={{ fontSize: 12, color: "#777", margin: "0 0 4px" }}>
                  Prep: <strong>{meal.prep_time_minutes} min</strong>
                </p>
                {meal.nutrition_highlight && (
                  <p style={{ fontSize: 11, color: "#888", margin: "6px 0 0" }}>
                    {meal.nutrition_highlight}
                  </p>
                )}
                <p style={{ fontSize: 11, color: "#aaa", marginTop: 8 }}>Click for full recipe →</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "24px 0" }}>
          <button
            className="input"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: "6px 14px", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}
          >
            ← Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className="input"
              onClick={() => setPage(p)}
              style={{
                padding: "6px 12px", cursor: "pointer",
                fontWeight: p === page ? "bold" : "normal",
                background: p === page ? "#f0f0f0" : "transparent",
                border: p === page ? "2px solid #aaa" : undefined,
              }}
            >
              {p}
            </button>
          ))}

          <button
            className="input"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding: "6px 14px", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default Meals;
