import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabaseClient";
import LoginPromptModal from "../components/LoginPromptModal";
import { useLanguage } from "../contexts/LanguageContext";

const PAGE_SIZE = 12;

function formatAge(months) {
  if (months <= 11) return `first ${months} months`;
  if (months === 12) return 'first birthday';
  if (months === 24) return '2 years old';
  if (months === 36) return '3 years old';
  if (months === 48) return '4 years old';
  if (months === 60) return '5 years old';
  const years = Math.floor(months / 12);
  return `${years} years old`;
}

function AllFoods() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [query, setQuery]           = useState("");
  const [age, setAge]               = useState("");
  const [tagFilter, setTagFilter]   = useState(searchParams.get("tag") || "all");
  const [session, setSession]       = useState(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showAll, setShowAll]       = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data?.subscription?.unsubscribe?.();
  }, []);

  const [foods, setFoods]         = useState([]);
  const [error, setError]         = useState("");
  const [page, setPage]           = useState(1);
  const [relatedMeals, setRelatedMeals] = useState([]);

  useEffect(() => {
    const loadFoods = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("foods").select("*").order("name", { ascending: true });
      if (error) { setError("Couldn't load foods yet."); return; }
      setError("");
      setFoods(data || []);
    };
    loadFoods();
  }, []);

  useEffect(() => { setPage(1); }, [query, age, tagFilter]);

  useEffect(() => {
    const searchText = query.trim().toLowerCase();
    if (!searchText || foods.length === 0) { setRelatedMeals([]); return; }
    const matchingIds = foods
      .filter(f =>
        f.name.toLowerCase().includes(searchText) ||
        (f.search_aliases && f.search_aliases.toLowerCase().includes(searchText))
      )
      .map(f => f.id);
    if (matchingIds.length === 0) { setRelatedMeals([]); return; }
    supabase
      .from("meal_foods")
      .select("meals(*)")
      .in("food_id", matchingIds)
      .then(({ data }) => {
        const seen = new Set();
        const unique = (data || [])
          .map(r => r.meals)
          .filter(m => m && m.is_public && !seen.has(m.id) && seen.add(m.id));
        setRelatedMeals(unique);
      });
  }, [query, foods]);

  const filteredFoods = useMemo(() => {
    const searchText  = query.trim().toLowerCase();
    const selectedAge = Number(age);
    return foods.filter((food) => {
      const byText =
  !searchText ||
  food.name.toLowerCase().includes(searchText) ||
  (food.search_aliases && food.search_aliases.toLowerCase().includes(searchText));
      const byAge  = !age || (Number.isFinite(selectedAge) && selectedAge >= Number(food.safe_from_months || 0));
      const byTag  = tagFilter === "all" ||
        (tagFilter === "iron-rich" && !!food.is_iron_rich) ||
        food.food_group === tagFilter;
      return byText && byAge && byTag;
    });
  }, [age, query, tagFilter, foods]);

  const totalPages = Math.max(1, Math.ceil(filteredFoods.length / PAGE_SIZE));
  const pageFoods  = useMemo(() => {
    if (showAll) return filteredFoods;
    const start = (page - 1) * PAGE_SIZE;
    return filteredFoods.slice(start, start + PAGE_SIZE);
  }, [filteredFoods, page, showAll]);

  return (
    <div className="page">


      {showAuthPrompt && (
        <LoginPromptModal
          onClose={() => setShowAuthPrompt(false)}
          title="Sign in to filter foods by your baby's age"
          message="Create a free account to personalise food and meal suggestions for your baby."
          icon="🥕"
        />
      )}
      <span className="eyebrow eo" style={{ marginTop: "1.5rem", display: "block" }}>{t("foodsEyebrow")}</span>
      <h1>{t("foodsTitle")}</h1>

      {/* ── Filters ── */}
      <div className="filters" style={{ marginTop: "1rem" }}>
        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchFoods")}
        />
        <div className="filters-row">
          <input
            className="input"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            type="number"
            min="4"
            placeholder={t("babyAge")}
            readOnly={!session}
            onClick={() => { if (!session) setShowAuthPrompt(true); }}
            style={{ cursor: !session ? "pointer" : undefined }}
          />
          <select className="input" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
            <option value="all">{t("allCategories")}</option>
            <option value="iron-rich">{t("ironRich")}</option>
            <option value="grain">{t("grain")}</option>
            <option value="fruit">{t("fruit")}</option>
            <option value="veggie">{t("veggie")}</option>
            <option value="protein">{t("protein")}</option>
            <option value="spice">Herb / Spice</option>
            <option value="other">{t("other")}</option>
          </select>
        </div>
      </div>

      {error && <p className="muted">{error}</p>}

      {!error && (
        <p className="results-count">
          {showAll
            ? t("showingAllFoods", filteredFoods.length)
            : t("showingFoods", filteredFoods.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1, Math.min(page * PAGE_SIZE, filteredFoods.length), filteredFoods.length)}
        </p>
      )}

      {/* ── Food grid ── */}
      <div className="foods-grid">
        {pageFoods.map((food) => (
          <div key={food.id} className="food-card" onClick={() => navigate(`/foods/${food.id}`)}>

            <div className="food-card-front">
              <img
                src={food.image_url}
                alt={food.name}
                onError={(e) => { e.target.src = "https://placehold.co/80x80?text=🍽"; }}
                style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 12 }}
              />
              <p className="food-card-name">{food.name}</p>
              {/* ── Badges row ── */}
              {(food.is_warning || food.allergen_notes) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6, width: "100%" }}>
                  {food.is_warning && (
                    <span style={{
                      background: '#fdf0ef', border: '1.5px solid #c0392b',
                      borderRadius: 6, padding: '3px 7px', fontSize: 10,
                      color: '#c0392b', fontWeight: 700, textAlign: 'center',
                    }}>
                      ⚠️ Not safe before {formatAge(food.safe_from_months)}
                    </span>
                  )}
                  {food.allergen_notes && (
                    <span style={{
                      background: '#eef4ff', border: '1.5px solid #2471a3',
                      borderRadius: 6, padding: '3px 7px', fontSize: 10,
                      color: '#2471a3', fontWeight: 700, textAlign: 'center',
                    }}>
                      🔵 Common allergen
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="food-card-details">
              <p style={{ fontWeight: 700, fontSize: "0.9rem", margin: "0 0 6px", color: "var(--dark)", fontFamily: "Aileron, sans-serif" }}>{food.name}</p>
              <p className="food-detail-row">Safe from: <strong>{food.safe_from_months}m+</strong></p>
              <p className="food-detail-row">Iron rich: <strong>{food.is_iron_rich ? "✓ Yes" : "No"}</strong></p>
              <p style={{ fontSize: "0.75rem", color: "var(--orange-dark)", marginTop: 8, fontWeight: 700 }}>
                Click for details →
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pagination ── */}
      {!showAll && totalPages > 1 && (
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
      {/* ── Related meals ── */}
      {query.trim() && relatedMeals.length > 0 && (
        <div style={{ marginTop: "2.5rem" }}>
          <span className="eyebrow eo" style={{ display: "block", marginBottom: 6 }}>Also in meals</span>
          <h3 style={{ fontSize: "1rem", margin: "0 0 1rem", color: "var(--dark)" }}>
            Meals using "{query.trim()}"
          </h3>
          <div className="foods-grid">
            {relatedMeals.map(meal => (
              <div key={meal.id} className="food-card" onClick={() => navigate(`/meal/${meal.id}`)}>
                <div className="food-card-front">
                  <img
                    src={meal.image_url}
                    alt={meal.title}
                    onError={e => { e.target.src = "https://placehold.co/80x80?text=🍽"; }}
                    style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 12 }}
                  />
                  <p className="food-card-name">{meal.title}</p>
                </div>
                <div className="food-card-details">
                  <p style={{ fontWeight: 700, fontSize: "0.9rem", margin: "0 0 6px", color: "var(--dark)", fontFamily: "Aileron, sans-serif" }}>{meal.title}</p>
                  <p className="food-detail-row">Age: <strong>{meal.min_age_months}m+</strong></p>
                  {meal.meal_slot && <p className="food-detail-row">Slot: <strong>{meal.meal_slot}</strong></p>}
                  {meal.prep_time_minutes && <p className="food-detail-row">Prep: <strong>{meal.prep_time_minutes} min</strong></p>}
                  <p style={{ fontSize: "0.75rem", color: "var(--orange-dark)", marginTop: 8, fontWeight: 700 }}>View meal →</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AllFoods;
