import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import TopNav from "../components/TopNav";
import useAIHelper from "../hooks/useAIHelper";
import useActiveBaby from "../hooks/useActiveBaby";
import { useLanguage } from "../contexts/LanguageContext";
import articles from "../data/articles";

// ── Paste your video URL here (YouTube embed or direct .mp4) ──
const VIDEO_URL = "C:\Users\Mohsin\baby-meal-app\babyvidfor explore.mp4";
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

function SkeletonLine({ w = "80%" }) {
  return (
    <div style={{
      height: 11, borderRadius: 6,
      background: "var(--border)",
      width: w, marginBottom: 8,
      animation: "skeleton-pulse 1.5s ease-in-out infinite",
    }} />
  );
}

function HorizontalScroll({ children }) {
  return (
    <div style={{
      display: "flex", gap: 16, overflowX: "auto",
      paddingBottom: 10, scrollSnapType: "x mandatory",
      WebkitOverflowScrolling: "touch",
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

  const { activeBaby } = useActiveBaby();
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

      {/* ── AI HELPER ── */}
      <div style={{ padding: "2.5rem 0 0" }}>
        <span style={{
          fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.12em", color: "var(--blue-dark)", display: "block",
          marginBottom: "0.6rem",
        }}>
          {t("aiEyebrow")}
        </span>
        <h1 style={{
          margin: "0 0 0.5rem",
          fontSize: "clamp(2rem, 5vw, 3rem)",
          fontFamily: "Fraunces, serif",
          fontWeight: 900,
          color: "var(--dark)",
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
        }}>
          {t("aiTitle")}
        </h1>
        <p style={{ margin: "0 0 1.5rem", fontSize: "1rem", color: "var(--muted)", lineHeight: 1.6, maxWidth: 540 }}>
          {t("aiSub")}
        </p>

        {!activeBaby && (
          <p style={{ fontSize: "0.82rem", color: "var(--blue-dark)", fontWeight: 600, marginBottom: "1rem" }}>
            {t("addBabyNudge")}
          </p>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, marginBottom: "1rem", maxWidth: 580 }}>
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
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: "2rem" }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleChip(s)}
                disabled={loading}
                style={{
                  background: "var(--blue)",
                  border: "none",
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
      </div>

      {/* ── Loading skeleton ── */}
      {loading && (
        <div style={{ marginBottom: "2rem", maxWidth: 540 }}>
          <SkeletonLine w="90%" />
          <SkeletonLine w="70%" />
          <SkeletonLine w="55%" />
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <p style={{ color: "#c0392b", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          {error}
        </p>
      )}

      {/* ── Answer ── */}
      {!loading && answer && (
        <div style={{ marginBottom: "2.5rem", maxWidth: 600 }}>
          <p style={{ lineHeight: 1.7, fontSize: "0.95rem", color: "var(--dark)", margin: "0 0 0.75rem" }}>
            {answer}
          </p>

          {safetyNote && (
            <p style={{ color: "#c0392b", fontSize: "0.88rem", fontWeight: 600, margin: "0 0 1rem" }}>
              ⚠️ {safetyNote}
            </p>
          )}

          {recommendedMeals.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <p style={{ fontWeight: 700, fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--blue-dark)", marginBottom: "0.5rem" }}>
                {t("suggestedMeals")}
              </p>
              <HorizontalScroll>
                {recommendedMeals.map((meal) => (
                  <Link key={meal.id} to={`/meal/${meal.id}`} style={{ textDecoration: "none", flexShrink: 0, scrollSnapAlign: "start" }}>
                    <div style={{ width: 200, cursor: "pointer", paddingBottom: 4 }}>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 5 }}>
                        <span className="badge badge-slot">{meal.meal_slot}</span>
                        <span className={`badge badge-${meal.meal_type}`}>{meal.meal_type}</span>
                      </div>
                      <p style={{ fontWeight: 700, fontSize: "0.9rem", margin: "0 0 4px", color: "var(--dark)", fontFamily: "Fraunces, serif", lineHeight: 1.3 }}>
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
              <p style={{ fontWeight: 700, fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--blue-dark)", marginBottom: "0.5rem" }}>
                {t("suggestedFoods")}
              </p>
              <HorizontalScroll>
                {recommendedFoods.map((food) => (
                  <Link key={food.id} to={`/foods/${food.id}`} style={{ textDecoration: "none", flexShrink: 0, scrollSnapAlign: "start" }}>
                    <div style={{ width: 140, cursor: "pointer", textAlign: "center", paddingBottom: 4 }}>
                      <img
                        src={food.image_url}
                        alt={food.name}
                        onError={(e) => { e.target.src = "https://placehold.co/60x60?text=🍽"; }}
                        style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 10, marginBottom: 6 }}
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

      {/* ── ARTICLES ── */}
      <div style={{ marginBottom: "2.5rem" }}>
        <span style={{
          fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.12em", color: "var(--blue-dark)", display: "block",
          marginBottom: "0.5rem",
        }}>
          Guides & Safety
        </span>
        <h2 style={{
          margin: "0 0 1.25rem",
          fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
          fontFamily: "Fraunces, serif",
          fontWeight: 800,
          color: "var(--dark)",
          lineHeight: 1.15,
          letterSpacing: "-0.01em",
        }}>
          Parent reads
        </h2>

        <HorizontalScroll>
          {articles.map((article) => (
            <Link
              key={article.slug}
              to={`/articles/${article.slug}`}
              style={{ textDecoration: "none", flexShrink: 0, scrollSnapAlign: "start" }}
            >
              <div style={{ width: 220, cursor: "pointer" }}>
                {/* Image area — seamless, no border */}
                <div style={{
                  height: 130,
                  borderRadius: 14,
                  background: article.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "0.7rem",
                  position: "relative",
                  overflow: "hidden",
                }}>
                  <span style={{ fontSize: "3.2rem" }}>{article.emoji}</span>
                  <span style={{
                    position: "absolute", bottom: 7, right: 9,
                    fontSize: "0.6rem", fontWeight: 700,
                    color: "var(--dark)", background: "rgba(255,255,255,0.75)",
                    padding: "2px 7px", borderRadius: 4,
                    backdropFilter: "blur(2px)",
                  }}>
                    {article.readTime}
                  </span>
                </div>
                {/* Text — stands on its own */}
                <span style={{
                  fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: article.borderColor, display: "block",
                  marginBottom: 3,
                }}>
                  {article.category}
                </span>
                <p style={{
                  margin: "0 0 4px", fontWeight: 700, fontSize: "0.92rem",
                  color: "var(--dark)", fontFamily: "Fraunces, serif", lineHeight: 1.3,
                }}>
                  {article.title}
                </p>
                <p className="muted" style={{
                  margin: 0, fontSize: "0.78rem", lineHeight: 1.5,
                  display: "-webkit-box", WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {article.summary}
                </p>
              </div>
            </Link>
          ))}
        </HorizontalScroll>
      </div>

      {/* ── VIDEO — full bleed ── */}
      <div style={{ marginBottom: "3rem" }}>
        <span style={{
          fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.12em", color: "var(--blue-dark)", display: "block",
          marginBottom: "0.5rem",
        }}>
          Watch
        </span>
        <h2 style={{
          margin: "0 0 1.25rem",
          fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
          fontFamily: "Fraunces, serif",
          fontWeight: 800,
          color: "var(--dark)",
          lineHeight: 1.15,
          letterSpacing: "-0.01em",
        }}>
          Featured video
        </h2>

        {/* Edge-bleed container */}
        <div style={{
          marginLeft: "calc(-2rem - 1px)",
          marginRight: "calc(-2rem - 1px)",
          width: "calc(100% + 4rem + 2px)",
          aspectRatio: "16/9",
          overflow: "hidden",
          background: "var(--blue)",
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
              <video src={VIDEO_URL} controls style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            )
          ) : (
            <div style={{
              width: "100%", height: "100%",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              color: "var(--blue-dark)",
            }}>
              <span style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>▶</span>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem" }}>Video coming soon</p>
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem", opacity: 0.7 }}>Paste your URL in VIDEO_URL</p>
            </div>
          )}
        </div>
      </div>

      {/* ── DISCOVER ── */}
      <div style={{ marginBottom: "2rem" }}>
        <span style={{
          fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.12em", color: "var(--blue-dark)", display: "block",
          marginBottom: "0.5rem",
        }}>
          {t("discoverEyebrow")}
        </span>
        <h2 style={{
          margin: "0 0 1.5rem",
          fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
          fontFamily: "Fraunces, serif",
          fontWeight: 800,
          color: "var(--dark)",
          lineHeight: 1.15,
          letterSpacing: "-0.01em",
        }}>
          Start exploring
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 24 }}>
          {[
            { to: "/foods?tag=iron-rich", emoji: "🩸", title: "Iron-rich foods", desc: "See foods that support iron intake and healthy growth." },
            { to: "/foods",               emoji: "🥕", title: "Foods by age",    desc: "Filter the full food library by your baby's age in months." },
            { to: "/meals",               emoji: "🍽️", title: "Meal ideas by age", desc: "Switch between quick and fancy options for every meal slot." },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              style={{ textDecoration: "none", display: "block" }}
            >
              <div style={{ paddingBottom: "0.25rem" }}>
                <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.6rem" }}>{item.emoji}</span>
                <p style={{
                  margin: "0 0 5px", fontWeight: 800, fontSize: "1rem",
                  color: "var(--dark)", fontFamily: "Fraunces, serif",
                }}>
                  {item.title}
                </p>
                <p className="muted" style={{ margin: 0, fontSize: "0.83rem", lineHeight: 1.55 }}>
                  {item.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Explore;
