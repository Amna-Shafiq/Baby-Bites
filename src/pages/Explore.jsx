import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import TopNav from "../components/TopNav";
import useAIHelper from "../hooks/useAIHelper";
import useActiveBaby from "../hooks/useActiveBaby";
import { useLanguage } from "../contexts/LanguageContext";
import articles from "../data/articles";

// ── Paste your video URL here (YouTube embed or direct .mp4) ──
const VIDEO_URL = "/explore-video.mp4";
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

      {/* ── HERO: AI search + video side by side ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "2.5rem",
        alignItems: "center",
        padding: "2.5rem 0 2rem",
      }}
        className="explore-hero"
      >
        {/* Left — AI Helper */}
        <div>
          <span style={{
            fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.12em", color: "var(--orange)", display: "block",
            marginBottom: "0.6rem",
          }}>
            {t("aiEyebrow")}
          </span>
          <h1 style={{
            margin: "0 0 0.5rem",
            fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
            fontFamily: "Fraunces, serif",
            fontWeight: 900,
            color: "var(--dark)",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}>
            {t("aiTitle")}
          </h1>
          <p style={{ margin: "0 0 1.5rem", fontSize: "0.95rem", color: "var(--muted)", lineHeight: 1.65, maxWidth: 440 }}>
            {t("aiSub")}
          </p>

          {!activeBaby && (
            <p style={{ fontSize: "0.82rem", color: "var(--orange)", fontWeight: 600, marginBottom: "1rem" }}>
              {t("addBabyNudge")}
            </p>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, marginBottom: "1rem" }}>
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

          {/* Suggestion chips */}
          {!input && !hasResponse && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleChip(s)}
                  disabled={loading}
                  style={{
                    background: "var(--cream)",
                    border: "1.5px solid var(--border)",
                    borderRadius: 20, padding: "5px 13px",
                    fontSize: "0.78rem", fontWeight: 600, color: "var(--dark)",
                    cursor: "pointer", fontFamily: "Nunito, sans-serif",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ marginTop: "1rem" }}>
              <SkeletonLine w="90%" />
              <SkeletonLine w="70%" />
              <SkeletonLine w="55%" />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <p style={{ color: "#c0392b", fontSize: "0.9rem", marginTop: "0.75rem" }}>{error}</p>
          )}

          {/* Answer */}
          {!loading && answer && (
            <div style={{ marginTop: "1rem" }}>
              <p style={{ lineHeight: 1.7, fontSize: "0.92rem", color: "var(--dark)", margin: "0 0 0.6rem" }}>
                {answer}
              </p>
              {safetyNote && (
                <p style={{ color: "#c0392b", fontSize: "0.85rem", fontWeight: 600, margin: "0 0 1rem" }}>
                  ⚠️ {safetyNote}
                </p>
              )}
              {recommendedMeals.length > 0 && (
                <div style={{ marginBottom: "0.85rem" }}>
                  <p style={{ fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "0.4rem" }}>
                    {t("suggestedMeals")}
                  </p>
                  <HorizontalScroll>
                    {recommendedMeals.map((meal) => (
                      <Link key={meal.id} to={`/meal/${meal.id}`} style={{ textDecoration: "none", flexShrink: 0, scrollSnapAlign: "start" }}>
                        <div style={{ width: 180, cursor: "pointer" }}>
                          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 4 }}>
                            <span className="badge badge-slot">{meal.meal_slot}</span>
                            <span className={`badge badge-${meal.meal_type}`}>{meal.meal_type}</span>
                          </div>
                          <p style={{ fontWeight: 700, fontSize: "0.88rem", margin: "0 0 3px", color: "var(--dark)", fontFamily: "Fraunces, serif", lineHeight: 1.3 }}>
                            {meal.title}
                          </p>
                          <p className="muted" style={{ fontSize: "0.73rem", margin: 0 }}>
                            {meal.min_age_months}–{meal.max_age_months}m
                          </p>
                        </div>
                      </Link>
                    ))}
                  </HorizontalScroll>
                </div>
              )}
              {recommendedFoods.length > 0 && (
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "0.4rem" }}>
                    {t("suggestedFoods")}
                  </p>
                  <HorizontalScroll>
                    {recommendedFoods.map((food) => (
                      <Link key={food.id} to={`/foods/${food.id}`} style={{ textDecoration: "none", flexShrink: 0, scrollSnapAlign: "start" }}>
                        <div style={{ width: 130, cursor: "pointer", textAlign: "center" }}>
                          <img
                            src={food.image_url}
                            alt={food.name}
                            onError={(e) => { e.target.src = "https://placehold.co/60x60?text=🍽"; }}
                            style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 10, marginBottom: 5 }}
                          />
                          <p style={{ fontWeight: 700, fontSize: "0.8rem", margin: "0 0 2px", color: "var(--dark)", fontFamily: "Fraunces, serif" }}>
                            {food.name}
                          </p>
                          <p className="muted" style={{ fontSize: "0.7rem", margin: 0 }}>{food.food_group}</p>
                        </div>
                      </Link>
                    ))}
                  </HorizontalScroll>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right — Video, seamless */}
        <div style={{ position: "relative" }}>
          <div style={{
            aspectRatio: "9/14",
            overflow: "hidden",
            borderRadius: "2rem",
            background: "var(--cream)",
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
                <video
                  src={VIDEO_URL}
                  autoPlay
                  muted
                  loop
                  playsInline
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              )
            ) : (
              <div style={{
                width: "100%", height: "100%",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                color: "var(--muted)",
              }}>
                <span style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>▶</span>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem" }}>Video coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ARTICLES ── */}
      <div style={{ marginBottom: "2.5rem" }}>
        <span style={{
          fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.12em", color: "var(--orange)", display: "block",
          marginBottom: "0.5rem",
        }}>
          Guides & Safety
        </span>
        <h2 style={{
          margin: "0 0 1.25rem",
          fontSize: "clamp(1.4rem, 3vw, 2rem)",
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

      {/* ── DISCOVER ── */}
      <div style={{ marginBottom: "2rem" }}>
        <span style={{
          fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.12em", color: "var(--orange)", display: "block",
          marginBottom: "0.5rem",
        }}>
          {t("discoverEyebrow")}
        </span>
        <h2 style={{
          margin: "0 0 1.5rem",
          fontSize: "clamp(1.4rem, 3vw, 2rem)",
          fontFamily: "Fraunces, serif",
          fontWeight: 800,
          color: "var(--dark)",
          lineHeight: 1.15,
          letterSpacing: "-0.01em",
        }}>
          Start exploring
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 28 }}>
          {[
            { to: "/foods?tag=iron-rich", emoji: "🩸", title: "Iron-rich foods",    desc: "See foods that support iron intake and healthy growth." },
            { to: "/foods",               emoji: "🥕", title: "Foods by age",       desc: "Filter the full food library by your baby's age in months." },
            { to: "/meals",               emoji: "🍽️", title: "Meal ideas by age", desc: "Switch between quick and fancy options for every meal slot." },
          ].map((item) => (
            <Link key={item.to} to={item.to} style={{ textDecoration: "none", display: "block" }}>
              <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.55rem" }}>{item.emoji}</span>
              <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: "0.98rem", color: "var(--dark)", fontFamily: "Fraunces, serif" }}>
                {item.title}
              </p>
              <p className="muted" style={{ margin: 0, fontSize: "0.82rem", lineHeight: 1.55 }}>
                {item.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Explore;
