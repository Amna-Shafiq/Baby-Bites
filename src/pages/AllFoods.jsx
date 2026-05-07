import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { supabase } from "../lib/supabaseClient";
import LoginPromptModal from "../components/LoginPromptModal";
import { useLanguage } from "../contexts/LanguageContext";
import useActiveBaby from "../hooks/useActiveBaby";

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
  { flag: "is_soy_free",    label: "Soy-free",    icon: "🫘" },
  { flag: "is_fish_free",   label: "Fish-free",   icon: "🐟" },
  { flag: "is_gluten_free", label: "Gluten-free", icon: "🌾" },
];

const TAG_CHIPS = [
  { value: "all",       label: "All" },
  { value: "grain",     label: "Grain" },
  { value: "fruit",     label: "Fruit" },
  { value: "veggie",    label: "Veggie" },
  { value: "protein",   label: "Protein" },
  { value: "dairy",     label: "Dairy" },
  { value: "nut",       label: "Nuts" },
  { value: "spice",     label: "Spice" },
  { value: "iron-rich", label: "Iron-rich" },
  { value: "other",     label: "Other" },
];

const GROUP_COLORS = {
  grain:   { bg: "#FFF3C4", border: "#F5C340" },
  veggie:  { bg: "#D5F5E3", border: "#52C490" },
  fruit:   { bg: "#FFE4CC", border: "#FFB87A" },
  protein: { bg: "#EAD5F5", border: "#C49AE8" },
  dairy:   { bg: "#D6EAF8", border: "#6ABCDC" },
  nut:     { bg: "#FFF3C4", border: "#F5C340" },
  spice:   { bg: "#D5F5E3", border: "#52C490" },
};

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

function getPageRange(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current]);
  if (current > 1) set.add(current - 1);
  if (current < total) set.add(current + 1);
  const sorted = [...set].sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push(null);
    result.push(sorted[i]);
  }
  return result;
}

function AllFoods() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { activeBaby } = useActiveBaby();

  const [query, setQuery]           = useState("");
  const [age, setAge]               = useState("");
  const [tagFilter, setTagFilter]   = useState(searchParams.get("tag") || "all");
  const [session, setSession]       = useState(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showAll, setShowAll]       = useState(false);
  const [activeAllergens, setActiveAllergens] = useState(new Set());

  const babyAllergenPills = ALLERGEN_PILLS.filter(p => activeBaby?.[p.flag]);

  const toggleAllergen = (flag) => {
    setActiveAllergens(prev => {
      const next = new Set(prev);
      if (next.has(flag)) next.delete(flag); else next.add(flag);
      return next;
    });
  };

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data?.subscription?.unsubscribe?.();
  }, []);

  useEffect(() => {
    document.body.classList.add("page-foods");
    return () => document.body.classList.remove("page-foods");
  }, []);

  const [foods, setFoods]         = useState([]);
  const [error, setError]         = useState("");
  const [relatedMeals, setRelatedMeals] = useState([]);
  const isFirstRender = useRef(true);

  const page = Number(searchParams.get("page")) || 1;
  const setPage = (newPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(newPage));
      return next;
    }, { replace: true });
  };

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

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setPage(1);
  }, [query, age, tagFilter]);

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
      const byAllergen = activeAllergens.size === 0 || (() => {
        const notes = (food.allergen_notes || "").toLowerCase();
        return [...activeAllergens].every(flag =>
          !(ALLERGEN_MAP[flag] || []).some(kw => notes.includes(kw))
        );
      })();
      return byText && byAge && byTag && byAllergen;
    });
  }, [age, query, tagFilter, foods, activeAllergens]);

  const totalPages = Math.max(1, Math.ceil(filteredFoods.length / PAGE_SIZE));
  const pageFoods  = useMemo(() => {
    if (showAll) return filteredFoods;
    const start = (page - 1) * PAGE_SIZE;
    return filteredFoods.slice(start, start + PAGE_SIZE);
  }, [filteredFoods, page, showAll]);

  return (
    <div className="page foods-page">
      <Helmet>
        <title>Baby-Safe Foods A–Z | Baby Bites</title>
        <meta name="description" content="Browse 100+ baby-safe foods organised by food group and age. Filter by allergens, search by name, and find out when and how to introduce each food safely." />
      </Helmet>

      {showAuthPrompt && (
        <LoginPromptModal
          onClose={() => setShowAuthPrompt(false)}
          title="Sign in to filter foods by your baby's age"
          message="Create a free account to personalise food and meal suggestions for your baby."
          icon="🥕"
        />
      )}

      {/* ── Header ── */}
      <div style={{ marginTop: "2rem", marginBottom: "2rem" }}>
        <p style={{ color: "#c4622a", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 0.5rem" }}>
          LIBRARY
        </p>
        <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 5vw, 3rem)" }}>
          {t("foodsTitle")}
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "1rem", margin: 0, fontWeight: 500 }}>
          Browse 100+ foods with safe-from ages, texture tips and allergen guidance
        </p>
      </div>

      {/* ── Search + age on one line ── */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1rem" }}>
        <div style={{ position: "relative", flex: "0 1 340px" }}>
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: "1rem", pointerEvents: "none" }}>
            🔍
          </span>
          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchFoods")}
            style={{ borderRadius: 100, padding: "12px 20px 12px 44px", border: "1.5px solid #FFB87A", background: "white", width: "100%", boxSizing: "border-box" }}
          />
        </div>
        <input
          className="input"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          type="number"
          min="4"
          placeholder={t("babyAge")}
          readOnly={!session}
          onClick={() => { if (!session) setShowAuthPrompt(true); }}
          style={{ borderRadius: 100, padding: "12px 16px", width: 160, flexShrink: 0, border: "1.5px solid #FFB87A", background: "white", cursor: !session ? "pointer" : undefined }}
        />
      </div>

      {/* ── Category: chips on desktop, dropdown on mobile ── */}
      <div style={{ marginBottom: "0.75rem" }}>
        <div className="foods-tag-chips">
          {TAG_CHIPS.map(({ value, label }) => {
            const active = tagFilter === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTagFilter(value)}
                style={{
                  padding: "6px 14px", borderRadius: 100, fontSize: "0.8rem", fontWeight: 700,
                  cursor: "pointer", transition: "all 0.15s",
                  background: active ? "#FFE4CC" : "white",
                  border: `1.5px solid ${active ? "#FFB87A" : "#eee"}`,
                  color: active ? "#c4622a" : "#888",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
        <select
          className="input foods-tag-select"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
        >
          <option value="" disabled>Food group</option>
          {TAG_CHIPS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* ── Baby allergen filter pills ── */}
      {babyAllergenPills.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "0.75rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--muted)", whiteSpace: "nowrap" }}>
            {activeBaby.avatar} Filters for {activeBaby.name}:
          </span>
          {babyAllergenPills.map(pill => {
            const active = activeAllergens.has(pill.flag);
            return (
              <button
                key={pill.flag}
                type="button"
                onClick={() => toggleAllergen(pill.flag)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "4px 11px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 700,
                  border: `1.5px solid ${active ? "#c4622a" : "#eee"}`,
                  background: active ? "#c4622a" : "white",
                  color: active ? "#fff" : "#888",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {pill.icon} {pill.label}
                {active && <span style={{ marginLeft: 2, opacity: 0.8 }}>✕</span>}
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="muted">{error}</p>}


      {/* ── Food grid ── */}
      <div className="foods-grid">
        {pageFoods.map((food) => {
          const colors = GROUP_COLORS[food.food_group] || { bg: "#F5F5F5", border: "#ccc" };
          return (
            <div
              key={food.id}
              className="food-card"
              onClick={() => navigate(`/foods/${food.id}`)}
              style={{ background: colors.bg, borderTop: `4px solid ${colors.border}`, borderRadius: 20 }}
            >
              <div className="food-card-front">
                <img
                  src={food.image_url}
                  alt={food.name}
                  onError={(e) => { e.target.src = "https://placehold.co/80x80?text=🍽"; }}
                  style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 12 }}
                />
                <p className="food-card-name">{food.name}</p>
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
          );
        })}
      </div>

      {/* ── Pagination ── */}
      {!showAll && totalPages > 1 && (
        <div className="pagination">
          <button className="pagination-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>←</button>
          {getPageRange(page, totalPages).map((p, i) =>
            p === null
              ? <span key={`gap-${i}`} className="pagination-gap">…</span>
              : <button key={p} className={`pagination-btn${p === page ? " active" : ""}`} onClick={() => setPage(p)}>{p}</button>
          )}
          <button className="pagination-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>→</button>
        </div>
      )}
      <div style={{ textAlign: "center", marginTop: "1rem", display: "flex", gap: "0.5rem", justifyContent: "center" }}>
        <button className="pagination-btn" onClick={() => { setShowAll((s) => !s); setPage(1); }}>
          {showAll ? t("showPages") : t("showAll")}
        </button>
        {showAll && (
          <button className="pagination-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>↑ Top</button>
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
