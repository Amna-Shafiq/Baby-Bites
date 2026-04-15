import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import TopNav from "../components/TopNav";
import { supabase } from "../lib/supabaseClient";
import LoginPromptModal from "../components/LoginPromptModal";

const PAGE_SIZE = 9;

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

  const [query, setQuery]           = useState("");
  const [age, setAge]               = useState("");
  const [tagFilter, setTagFilter]   = useState(searchParams.get("tag") || "all");
  const [session, setSession]       = useState(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data?.subscription?.unsubscribe?.();
  }, []);

  const [foods, setFoods]         = useState([]);
  const [error, setError]         = useState("");
  const [page, setPage]           = useState(1);

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
    const start = (page - 1) * PAGE_SIZE;
    return filteredFoods.slice(start, start + PAGE_SIZE);
  }, [filteredFoods, page]);

  return (
    <div className="page">
      <TopNav />

      {showAuthPrompt && (
        <LoginPromptModal
          onClose={() => setShowAuthPrompt(false)}
          title="Sign in to filter foods by your baby's age"
          message="Create a free account to personalise food and meal suggestions for your baby."
          icon="🥕"
        />
      )}
      <span className="eyebrow eo" style={{ marginTop: "1.5rem", display: "block" }}>Library</span>
      <h1>All Foods</h1>

      {/* ── Filters ── */}
      <div className="filters" style={{ marginTop: "1rem" }}>
        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search foods..."
        />
        <div className="filters-row">
          <input
            className="input"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            type="number"
            min="4"
            placeholder="Baby age (months)"
            readOnly={!session}
            onClick={() => { if (!session) setShowAuthPrompt(true); }}
            style={{ cursor: !session ? "pointer" : undefined }}
          />
          <select className="input" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
            <option value="all">All categories</option>
            <option value="iron-rich">Iron-rich</option>
            <option value="grain">Grain</option>
            <option value="fruit">Fruit</option>
            <option value="veggie">Veggie</option>
            <option value="protein">Protein</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {error && <p className="muted">{error}</p>}

      {!error && (
        <p className="results-count">
          Showing {filteredFoods.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
          {Math.min(page * PAGE_SIZE, filteredFoods.length)} of {filteredFoods.length} foods
        </p>
      )}

      {/* ── Food grid ── */}
      <div className="foods-grid">
        {pageFoods.map((food) => (
          <div key={food.id} className="food-card" onClick={() => navigate(`/foods/${food.id}`)}>

            <div className="food-card-front">
              {/* ── Warning banner ── */}
              {food.is_warning && (
                <div className="warning-banner" style={{
                  background: '#fdf0ef', border: '1.5px solid #c0392b',
                  borderRadius: 8, padding: '4px 8px', fontSize: 11,
                  color: '#c0392b', fontWeight: 700, marginBottom: 6,
                  width: '100%', textAlign: 'center'
                }}>
                  ⚠️ Not safe before {formatAge(food.safe_from_months)}
                </div>
              )}
              <img
                src={food.image_url}
                alt={food.name}
                onError={(e) => { e.target.src = "https://placehold.co/80x80?text=🍽"; }}
                style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 12 }}
              />
              <p className="food-card-name">{food.name}</p>
              {/* ── Allergen badge ── */}
              {food.allergen_notes && (
                <span style={{
                  display: "inline-block", marginTop: 4,
                  background: "#fdf0ef", border: "1px solid #c0392b",
                  borderRadius: 6, padding: "2px 7px",
                  fontSize: 10, color: "#c0392b", fontWeight: 700,
                }}>
                  ⚠️ Allergen
                </span>
              )}
            </div>

            <div className="food-card-details">
              <p className="food-detail-row"><strong>{food.name}</strong></p>
              <p className="food-detail-row">Safe from: <strong>{food.safe_from_months}m+</strong></p>
              <p className="food-detail-row">Group: <strong>{food.food_group || "other"}</strong></p>
              <p className="food-detail-row">Iron rich: <strong>{food.is_iron_rich ? "✓ Yes" : "No"}</strong></p>
              {food.allergen_notes && (
                <p className="food-allergen">⚠️ {food.allergen_notes}</p>
              )}
              <p style={{ fontSize: "0.75rem", color: "var(--orange-dark)", marginTop: 6, fontWeight: 700 }}>
                Click for details →
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
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

export default AllFoods;
