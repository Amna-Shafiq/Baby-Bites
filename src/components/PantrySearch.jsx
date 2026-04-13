import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const stem = (s) => s.toLowerCase().replace(/es$/, "").replace(/s$/, "");

function PantrySearch({ onAdd, existingFoods = [] }) {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen]       = useState(false);
  const debounceRef           = useRef(null);
  const wrapperRef            = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = (q) => {
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("foods")
        .select("id, name")
        .ilike("name", `%${q}%`)
        .order("name")
        .limit(8);
      setResults(data || []);
      setOpen(true);
    }, 220);
  };

  const existingStems = existingFoods.map((f) => stem(f.name));
  const isInPantry = (name) => existingStems.includes(stem(name));

  const handleSelect = (food) => {
    if (isInPantry(food.name)) return;
    onAdd(food);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", flex: 1 }}>
      <input
        className="input"
        value={query}
        onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
        placeholder="Search a food to add… (e.g. banana)"
        autoComplete="off"
      />

      {open && results.length > 0 && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          right: 0,
          background: "var(--white)",
          border: "1.5px solid var(--border)",
          borderRadius: 12,
          boxShadow: "0 8px 24px rgba(45,36,22,0.12)",
          zIndex: 300,
          overflow: "hidden",
        }}>
          {results.map((food, i) => {
            const already = isInPantry(food.name);
            return (
              <button
                key={food.id}
                type="button"
                onClick={() => handleSelect(food)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "0.6rem 1rem",
                  background: "none",
                  border: "none",
                  borderBottom: i < results.length - 1 ? "1px solid var(--border)" : "none",
                  cursor: already ? "default" : "pointer",
                  fontSize: "0.9rem",
                  color: already ? "var(--muted)" : "var(--dark)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { if (!already) e.currentTarget.style.background = "var(--cream)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
              >
                {food.name}
                {already && (
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600 }}>
                    Already in pantry
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {open && results.length === 0 && query.trim() && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          right: 0,
          background: "var(--white)",
          border: "1.5px solid var(--border)",
          borderRadius: 12,
          padding: "0.7rem 1rem",
          fontSize: "0.88rem",
          color: "var(--muted)",
          zIndex: 300,
        }}>
          No foods found for "{query}"
        </div>
      )}
    </div>
  );
}

export default PantrySearch;
