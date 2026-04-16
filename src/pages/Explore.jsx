import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import TopNav from "../components/TopNav";
import useAIHelper from "../hooks/useAIHelper";
import useActiveBaby from "../hooks/useActiveBaby";
import { useLanguage } from "../contexts/LanguageContext";

const SUGGESTIONS = [
  "Iron rich meals for my baby",
  "Quick breakfast ideas",
  "Is honey safe?",
  "What can I make with lentils and carrot?",
  "Foods to avoid under 1 year",
  "Protein ideas for 8 months",
];

function SkeletonCard() {
  return (
    <div style={{
      width: 180, flexShrink: 0,
      background: "var(--cream)", border: "1.5px solid var(--border)",
      borderRadius: 16, padding: "1rem",
      animation: "skeleton-pulse 1.5s ease-in-out infinite",
    }}>
      <div style={{ height: 12, background: "var(--border)", borderRadius: 6, marginBottom: 8, width: "60%" }} />
      <div style={{ height: 10, background: "var(--border)", borderRadius: 6, marginBottom: 6, width: "90%" }} />
      <div style={{ height: 10, background: "var(--border)", borderRadius: 6, width: "70%" }} />
    </div>
  );
}

function HorizontalScroll({ children }) {
  return (
    <div style={{
      display: "flex", gap: 12, overflowX: "auto",
      paddingBottom: 8, scrollSnapType: "x mandatory",
      marginTop: "0.75rem",
    }}>
      {children}
    </div>
  );
}

function Explore() {
  const navigate = useNavigate();
  const [input, setInput]       = useState("");
  const [cooldown, setCooldown] = useState(false);
  const inputRef = useRef(null);

  const { activeBaby, activeBabyAgeMonths } = useActiveBaby();
  const { ask, answer, recommendedMeals, recommendedFoods, safetyNote, loading, error } = useAIHelper();
  const { t } = useLanguage();

  const submit = async (question) => {
    if (!question.trim() || loading || cooldown) return;
    await ask(question);
    setCooldown(true);
    setTimeout(() => setCooldown(false), 3000);
  };

  const handleChip = (chip) => {
    setInput(chip);
    submit(chip);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submit(input);
  };

  const hasResponse = answer || error;

  return (
    <div className="page">
      <TopNav />

      {/* ── AI Helper ── */}
      <span className="eyebrow eo" style={{ marginTop: "1.5rem", display: "block" }}>{t("aiEyebrow")}</span>
      <h1 style={{ marginBottom: "0.4rem" }}>{t("aiTitle")}</h1>
      <p className="page-sub" style={{ marginBottom: "1rem" }}>{t("aiSub")}</p>

      {!activeBaby && (
        <p style={{
          fontSize: "0.82rem", color: "var(--orange-dark)", fontWeight: 600,
          marginBottom: "0.75rem",
          background: "var(--cream)", border: "1.5px solid var(--border)",
          borderRadius: 10, padding: "8px 12px", display: "inline-block",
        }}>
          {t("addBabyNudge")}
        </p>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: "0.75rem" }}>
        <input
          ref={inputRef}
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("aiPlaceholder")}
          style={{ flex: 1 }}
          disabled={loading}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!input.trim() || loading || cooldown}
          style={{ flexShrink: 0 }}
        >
          {loading ? "…" : t("askBtn")}
        </button>
      </form>

      {/* Suggestion chips — only when input is empty */}
      {!input && !hasResponse && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: "1.25rem" }}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleChip(s)}
              disabled={loading}
              style={{
                background: "var(--cream)", border: "1.5px solid var(--border)",
                borderRadius: 20, padding: "5px 14px",
                fontSize: "0.8rem", fontWeight: 600, color: "var(--dark)",
                cursor: "pointer", fontFamily: "Nunito, sans-serif",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{
            background: "#fffde7", border: "1.5px solid #f9a825",
            borderRadius: 14, padding: "1rem", marginBottom: "0.75rem",
            animation: "skeleton-pulse 1.5s ease-in-out infinite",
          }}>
            <div style={{ height: 12, background: "#f9e08a", borderRadius: 6, width: "80%", marginBottom: 8 }} />
            <div style={{ height: 12, background: "#f9e08a", borderRadius: 6, width: "60%" }} />
          </div>
          <HorizontalScroll>
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </HorizontalScroll>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{
          background: "#fdf0ef", border: "1.5px solid #c0392b",
          borderRadius: 10, padding: "0.75rem 1rem", marginBottom: "1.25rem",
          color: "#c0392b", fontSize: "0.85rem",
        }}>
          {error}
        </div>
      )}

      {/* Answer */}
      {!loading && answer && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{
            background: "#fffde7", border: "1.5px solid #f9a825",
            borderRadius: 14, padding: "1rem 1.2rem", marginBottom: safetyNote ? "0.5rem" : "1rem",
            lineHeight: 1.65, fontSize: "0.92rem",
          }}>
            {answer}
          </div>

          {safetyNote && (
            <div style={{
              background: "#fdf0ef", border: "1.5px solid #c0392b",
              borderRadius: 10, padding: "0.6rem 1rem",
              color: "#c0392b", fontSize: "0.85rem", fontWeight: 600,
              marginBottom: "1rem",
            }}>
              ⚠️ {safetyNote}
            </div>
          )}

          {/* Recommended meals */}
          {recommendedMeals.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <p style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: 0, color: "var(--dark)" }}>
                {t("suggestedMeals")}
              </p>
              <HorizontalScroll>
                {recommendedMeals.map((meal) => (
                  <Link
                    key={meal.id}
                    to={`/meal/${meal.id}`}
                    style={{ textDecoration: "none", flexShrink: 0, scrollSnapAlign: "start" }}
                  >
                    <div style={{
                      width: 190, background: "var(--cream)",
                      border: "1.5px solid var(--border)", borderRadius: 16,
                      padding: "0.9rem", cursor: "pointer",
                    }}>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 }}>
                        <span className="badge badge-slot">{meal.meal_slot}</span>
                        <span className={`badge badge-${meal.meal_type}`}>{meal.meal_type}</span>
                      </div>
                      <p style={{
                        fontWeight: 700, fontSize: "0.88rem", margin: "0 0 4px",
                        color: "var(--dark)", fontFamily: "Fraunces, serif", lineHeight: 1.3,
                      }}>
                        {meal.title}
                      </p>
                      <p className="muted" style={{ fontSize: "0.75rem", margin: 0 }}>
                        {meal.min_age_months}–{meal.max_age_months}m
                        {meal.prep_time_minutes ? ` · ${meal.prep_time_minutes} min` : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </HorizontalScroll>
            </div>
          )}

          {/* Recommended foods */}
          {recommendedFoods.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <p style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: 0, color: "var(--dark)" }}>
                {t("suggestedFoods")}
              </p>
              <HorizontalScroll>
                {recommendedFoods.map((food) => (
                  <Link
                    key={food.id}
                    to={`/foods/${food.id}`}
                    style={{ textDecoration: "none", flexShrink: 0, scrollSnapAlign: "start" }}
                  >
                    <div style={{
                      width: 150, background: "var(--cream)",
                      border: "1.5px solid var(--border)", borderRadius: 16,
                      padding: "0.9rem", cursor: "pointer", textAlign: "center",
                    }}>
                      <img
                        src={food.image_url}
                        alt={food.name}
                        onError={(e) => { e.target.src = "https://placehold.co/60x60?text=🍽"; }}
                        style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 10, marginBottom: 6 }}
                      />
                      <p style={{
                        fontWeight: 700, fontSize: "0.82rem", margin: "0 0 2px",
                        color: "var(--dark)", fontFamily: "Fraunces, serif",
                      }}>
                        {food.name}
                      </p>
                      <p className="muted" style={{ fontSize: "0.72rem", margin: 0 }}>
                        {food.food_group}
                      </p>
                      {food.allergen_notes && (
                        <span style={{
                          display: "inline-block", marginTop: 4,
                          background: "#eef4ff", border: "1px solid #2471a3",
                          borderRadius: 5, padding: "1px 6px",
                          fontSize: 9, color: "#2471a3", fontWeight: 700,
                        }}>
                          🔵 Allergen
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </HorizontalScroll>
            </div>
          )}
        </div>
      )}

      {/* ── Divider ── */}
      <div style={{ borderTop: "1.5px solid var(--border)", margin: "1.5rem 0" }} />

      {/* ── Existing explore cards ── */}
      <span className="eyebrow eo" style={{ display: "block", marginBottom: "0.5rem" }}>{t("discoverEyebrow")}</span>
      <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        <Link className="explore-card" to="/foods?tag=iron-rich">
          <div style={{ fontSize: 28, marginBottom: "0.75rem" }}>🩸</div>
          <h3>Iron-rich foods</h3>
          <p>See foods that support iron intake and healthy growth.</p>
        </Link>
        <Link className="explore-card" to="/foods">
          <div style={{ fontSize: 28, marginBottom: "0.75rem" }}>🥕</div>
          <h3>Foods by age</h3>
          <p>Filter the full food library by your baby's age in months.</p>
        </Link>
        <Link className="explore-card" to="/meals">
          <div style={{ fontSize: 28, marginBottom: "0.75rem" }}>🍽️</div>
          <h3>Meal ideas by age</h3>
          <p>Switch between quick and fancy options for every meal slot.</p>
        </Link>
      </div>
    </div>
  );
}

export default Explore;
