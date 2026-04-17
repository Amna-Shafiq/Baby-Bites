import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import TopNav from "../components/TopNav";
import useAIHelper from "../hooks/useAIHelper";
import useActiveBaby from "../hooks/useActiveBaby";
import { useLanguage } from "../contexts/LanguageContext";
import articles from "../data/articles";

// ── Paste your video URL here (YouTube embed or direct .mp4) ──
const VIDEO_URL = "";
// YouTube example: "https://www.youtube.com/embed/VIDEO_ID"
// MP4 example:     "/videos/my-video.mp4"

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

  const handleChip = (chip) => { setInput(chip); submit(chip); };
  const handleSubmit = (e) => { e.preventDefault(); submit(input); };
  const hasResponse = answer || error;

  return (
    <div className="page">
      <TopNav />

      {/* ── AI Helper header ── */}
      <div style={{
        background: "var(--blue)", border: "1.5px solid var(--blue-mid)",
        borderRadius: 18, padding: "1.25rem 1.5rem",
        margin: "1.5rem 0 1rem",
      }}>
        <span style={{
          fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.09em", color: "var(--blue-dark)",
        }}>
          {t("aiEyebrow")}
        </span>
        <h1 style={{ margin: "0.3rem 0 0.4rem", fontSize: "1.5rem", color: "var(--dark)" }}>
          {t("aiTitle")}
        </h1>
        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--blue-dark)", lineHeight: 1.6 }}>
          {t("aiSub")}
        </p>
      </div>

      {!activeBaby && (
        <p style={{
          fontSize: "0.82rem", color: "var(--blue-dark)", fontWeight: 600,
          marginBottom: "0.75rem",
          background: "var(--blue)", border: "1.5px solid var(--blue-mid)",
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
          style={{ flex: 1, borderColor: "var(--blue-mid)" }}
          disabled={loading}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!input.trim() || loading || cooldown}
          style={{ flexShrink: 0, background: "var(--blue-dark)", borderColor: "var(--blue-dark)" }}
        >
          {loading ? "…" : t("askBtn")}
        </button>
      </form>

      {/* Suggestion chips */}
      {!input && !hasResponse && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: "1.25rem" }}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleChip(s)}
              disabled={loading}
              style={{
                background: "var(--blue)", border: "1.5px solid var(--blue-mid)",
                borderRadius: 20, padding: "5px 14px",
                fontSize: "0.8rem", fontWeight: 600, color: "var(--blue-dark)",
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

          {recommendedMeals.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <p style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: 0, color: "var(--dark)" }}>
                {t("suggestedMeals")}
              </p>
              <HorizontalScroll>
                {recommendedMeals.map((meal) => (
                  <Link key={meal.id} to={`/meal/${meal.id}`} style={{ textDecoration: "none", flexShrink: 0, scrollSnapAlign: "start" }}>
                    <div style={{
                      width: 190, background: "var(--cream)",
                      border: "1.5px solid var(--border)", borderRadius: 16,
                      padding: "0.9rem", cursor: "pointer",
                    }}>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 }}>
                        <span className="badge badge-slot">{meal.meal_slot}</span>
                        <span className={`badge badge-${meal.meal_type}`}>{meal.meal_type}</span>
                      </div>
                      <p style={{ fontWeight: 700, fontSize: "0.88rem", margin: "0 0 4px", color: "var(--dark)", fontFamily: "Fraunces, serif", lineHeight: 1.3 }}>
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

          {recommendedFoods.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <p style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: 0, color: "var(--dark)" }}>
                {t("suggestedFoods")}
              </p>
              <HorizontalScroll>
                {recommendedFoods.map((food) => (
                  <Link key={food.id} to={`/foods/${food.id}`} style={{ textDecoration: "none", flexShrink: 0, scrollSnapAlign: "start" }}>
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
                      <p style={{ fontWeight: 700, fontSize: "0.82rem", margin: "0 0 2px", color: "var(--dark)", fontFamily: "Fraunces, serif" }}>
                        {food.name}
                      </p>
                      <p className="muted" style={{ fontSize: "0.72rem", margin: 0 }}>{food.food_group}</p>
                    </div>
                  </Link>
                ))}
              </HorizontalScroll>
            </div>
          )}
        </div>
      )}

      {/* ── Divider ── */}
      <div style={{ borderTop: "1.5px solid var(--blue-mid)", margin: "1.5rem 0" }} />

      {/* ── Articles + Video ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "start" }}>

        {/* Articles horizontal scroll */}
        <div>
          <span style={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--blue-dark)" }}>
            Guides & Safety
          </span>
          <h2 style={{ margin: "0.25rem 0 0.85rem", color: "var(--dark)" }}>Parent reads</h2>
          <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 10, scrollSnapType: "x mandatory" }}>
            {articles.map((article) => (
              <Link
                key={article.slug}
                to={`/articles/${article.slug}`}
                style={{ textDecoration: "none", flexShrink: 0, scrollSnapAlign: "start" }}
              >
                <div style={{
                  width: 210,
                  background: "var(--white)",
                  border: `1.5px solid ${article.borderColor}`,
                  borderRadius: 16,
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "box-shadow 0.2s",
                }}>
                  {/* Image placeholder */}
                  <div style={{
                    height: 120,
                    background: article.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderBottom: `1px solid ${article.borderColor}`,
                    position: "relative",
                  }}>
                    <span style={{ fontSize: "3rem" }}>{article.emoji}</span>
                    <span style={{
                      position: "absolute", bottom: 6, right: 8,
                      fontSize: "0.6rem", fontWeight: 700,
                      color: article.borderColor, background: "rgba(255,255,255,0.8)",
                      padding: "2px 6px", borderRadius: 4,
                    }}>
                      {article.readTime}
                    </span>
                  </div>
                  {/* Content */}
                  <div style={{ padding: "0.75rem 0.85rem 0.9rem" }}>
                    <span style={{
                      fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase",
                      letterSpacing: "0.08em", color: article.borderColor,
                    }}>
                      {article.category}
                    </span>
                    <p style={{
                      margin: "3px 0 5px", fontWeight: 700, fontSize: "0.88rem",
                      color: "var(--dark)", fontFamily: "Fraunces, serif", lineHeight: 1.3,
                    }}>
                      {article.title}
                    </p>
                    <p className="muted" style={{
                      margin: 0, fontSize: "0.75rem", lineHeight: 1.5,
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {article.summary}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Video */}
        <div>
          <span style={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--blue-dark)" }}>
            Watch
          </span>
          <h2 style={{ margin: "0.25rem 0 0.85rem", color: "var(--dark)" }}>Featured video</h2>
          <div style={{
            width: "100%", aspectRatio: "16/9",
            borderRadius: 16, overflow: "hidden",
            border: "1.5px solid var(--blue-mid)",
            background: "var(--blue)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {VIDEO_URL ? (
              VIDEO_URL.includes("youtube.com") || VIDEO_URL.includes("youtu.be") ? (
                <iframe
                  src={VIDEO_URL}
                  width="100%" height="100%"
                  style={{ border: "none", display: "block" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Featured video"
                />
              ) : (
                <video src={VIDEO_URL} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )
            ) : (
              <div style={{ textAlign: "center", color: "var(--blue-dark)", padding: "1rem" }}>
                <p style={{ fontSize: "2rem", margin: "0 0 6px" }}>▶️</p>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem" }}>Video coming soon</p>
                <p style={{ margin: "4px 0 0", fontSize: "0.75rem", opacity: 0.75 }}>Paste your URL in VIDEO_URL</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ borderTop: "1.5px solid var(--blue-mid)", margin: "1.75rem 0 1.5rem" }} />

      {/* ── Discover ── */}
      <span style={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--blue-dark)", display: "block", marginBottom: "0.5rem" }}>
        {t("discoverEyebrow")}
      </span>
      <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        <Link className="explore-card" to="/foods?tag=iron-rich" style={{ borderColor: "var(--blue-mid)" }}>
          <div style={{ fontSize: 28, marginBottom: "0.75rem" }}>🩸</div>
          <h3>Iron-rich foods</h3>
          <p>See foods that support iron intake and healthy growth.</p>
        </Link>
        <Link className="explore-card" to="/foods" style={{ borderColor: "var(--blue-mid)" }}>
          <div style={{ fontSize: 28, marginBottom: "0.75rem" }}>🥕</div>
          <h3>Foods by age</h3>
          <p>Filter the full food library by your baby's age in months.</p>
        </Link>
        <Link className="explore-card" to="/meals" style={{ borderColor: "var(--blue-mid)" }}>
          <div style={{ fontSize: 28, marginBottom: "0.75rem" }}>🍽️</div>
          <h3>Meal ideas by age</h3>
          <p>Switch between quick and fancy options for every meal slot.</p>
        </Link>
      </div>
    </div>
  );
}

export default Explore;
