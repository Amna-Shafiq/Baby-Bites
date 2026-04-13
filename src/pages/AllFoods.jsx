import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import TopNav from "../components/TopNav";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 9;

function AllFoods() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [age, setAge] = useState("");
  const [tagFilter, setTagFilter] = useState(searchParams.get("tag") || "all");
  const [foods, setFoods] = useState([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();


  useEffect(() => {
    const loadFoods = async () => {
      if (!supabase) return;

      const { data, error } = await supabase
        .from("foods")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        setError("Couldn't load foods yet. Make sure `foods` table exists in Supabase.");
        return;
      }

      setError("");
      setFoods(data || []);
    };

    loadFoods();
  }, []);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [query, age, tagFilter]);

  const filteredFoods = useMemo(() => {
    const searchText = query.trim().toLowerCase();
    const selectedAge = Number(age);

    return foods.filter((food) => {
      const byText = !searchText || food.name.toLowerCase().includes(searchText);

      const byAge =
        !age ||
        (Number.isFinite(selectedAge) &&
          selectedAge >= Number(food.safe_from_months || 0));

      const byTag =
        tagFilter === "all" ||
        (tagFilter === "iron-rich" && !!food.is_iron_rich) ||
        food.food_group === tagFilter;

      return byText && byAge && byTag;
    });
  }, [age, query, tagFilter, foods]);

  const totalPages = Math.max(1, Math.ceil(filteredFoods.length / PAGE_SIZE));

  const pageFoods = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredFoods.slice(start, start + PAGE_SIZE);
  }, [filteredFoods, page]);

  return (
    <div className="page">
      <TopNav />
      <h1>All Foods</h1>

      <div className="filters">
        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search foods or ingredients..."
        />
        <input
          className="input"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          type="number"
          min="4"
          placeholder="Baby age in months"
        />
        <select
          className="input"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
        >
          <option value="all">All categories</option>
          <option value="iron-rich">Iron-rich</option>
          <option value="grain">Grain</option>
          <option value="fruit">Fruit</option>
          <option value="veggie">Veggie</option>
          <option value="protein">Protein</option>
        </select>
      </div>

      {error ? <p className="muted">{error}</p> : null}

      {/* Results count */}
      {!error && (
        <p className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          Showing {filteredFoods.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
          {Math.min(page * PAGE_SIZE, filteredFoods.length)} of {filteredFoods.length} foods
        </p>
      )}

      {/* 3-column grid */}
      <div className="foods-grid">
      {pageFoods.map((food) => (
  <div key={food.id} className="food-card" onClick={() => navigate(`/foods/${food.id}`)}>

    <div className="food-card-front">
      <img
        src={food.image_url}
        alt={food.name}
        onError={(e) => { e.target.src = "https://placehold.co/80x80?text=🍽"; }}
        style={{ width: 110, height: 110, objectFit: "cover", borderRadius: 10 }}
      />
      <p className="food-card-name">{food.name}</p>
    </div>

    <div className="food-card-details">
      <p className="food-detail-row"><strong>{food.name}</strong></p>
      <p className="food-detail-row">Safe from: <strong>{food.safe_from_months}m+</strong></p>
      <p className="food-detail-row">Group: <strong>{food.food_group || "other"}</strong></p>
      <p className="food-detail-row">Iron rich: <strong>{food.is_iron_rich ? "✓ Yes" : "No"}</strong></p>
      <p style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>Click for full details →</p>
    </div>

  </div>
))}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 32,
          }}
        >
          <button
            className="input"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "6px 14px",
              cursor: page === 1 ? "not-allowed" : "pointer",
              opacity: page === 1 ? 0.4 : 1,
            }}
          >
            ← Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className="input"
              onClick={() => setPage(p)}
              style={{
                padding: "6px 12px",
                cursor: "pointer",
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
            style={{
              padding: "6px 14px",
              cursor: page === totalPages ? "not-allowed" : "pointer",
              opacity: page === totalPages ? 0.4 : 1,
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default AllFoods;