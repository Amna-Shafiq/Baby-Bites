import { useState, useRef, useEffect } from "react";
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
      background: "rgba(255,255,255,0.25)",
      width: w, marginBottom: 8,
      animation: "skeleton-pulse 1.5s ease-in-out infinite",
    }} />
  );
}

function ArticleCard({ article }) {
  return (
    <Link to={`/articles/${article.slug}`} style={{ textDecoration: "none", display: "block" }}>
      <div style={{ width: 220, cursor: "pointer" }}>
        <div style={{
          height: 130, borderRadius: 14,
          background: article.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "0.7rem",
          position: "relative", overflow: "hidden",
        }}>
          {article.image
            ? <img src={article.image} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <span style={{ fontSize: "3.2rem" }}>{article.emoji}</span>
          }
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
          color: "var(--dark)", fontFamily: "Aileron, sans-serif", lineHeight: 1.3,
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

// ── Particle canvas constants ──────────────────────────────
const REPEL_RADIUS = 90;
const REPEL_FORCE  = 7;
const SPRING       = 0.055;
const FRICTION     = 0.82;

// ── ParticleCanvas: 90 floating dust motes over the hero ──
function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, animId;
    const particles = [];

    function resize() {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width  = W;
      canvas.height = H;
    }

    function spawn() {
      particles.length = 0;
      for (let i = 0; i < 90; i++) {
        particles.push({
          x:           Math.random() * (W || window.innerWidth),
          y:           Math.random() * (H || window.innerHeight),
          r:           Math.random() * 1.6 + 0.2,
          baseOpacity: Math.random() * 0.55 + 0.08,
          speed:       Math.random() * 0.35 + 0.08,
          drift:       (Math.random() - 0.5) * 0.25,
          phase:       Math.random() * Math.PI * 2,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        p.y     -= p.speed;
        p.x     += p.drift;
        p.phase += 0.012;
        if (p.y < -p.r * 3)   p.y = H + p.r;
        if (p.x < -p.r * 3)   p.x = W + p.r;
        if (p.x >  W + p.r * 3) p.x = -p.r;
        const opacity = p.baseOpacity * (0.65 + 0.35 * Math.sin(p.phase));
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.5);
        g.addColorStop(0, `rgba(255,255,255,${opacity})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    }

    resize();
    spawn();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: "absolute", inset: 0,
      width: "100%", height: "100%",
      pointerEvents: "none", zIndex: 2,
    }} />
  );
}

// ── ParticleTitle: text rendered as interactive particles ──
function ParticleTitle() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx     = canvas.getContext("2d");
    let animId;
    const cursor  = { x: -9999, y: -9999 };
    let particles = [];

    async function init() {
      try { await document.fonts.load("italic 80px 'Instrument Serif'"); } catch (_) {}

      const W      = canvas.offsetWidth || 560;
      const H      = 230;
      canvas.width  = W;
      canvas.height = H;

      const fontSize = Math.min(W * 0.086, 90);
      const leading  = fontSize * 1.08;

      // Render text to offscreen canvas for pixel sampling
      const off    = document.createElement("canvas");
      off.width    = W;
      off.height   = H;
      const offCtx = off.getContext("2d");
      offCtx.fillStyle     = "white";
      offCtx.font          = `italic ${fontSize}px 'Instrument Serif', serif`;
      offCtx.textAlign     = "center";
      offCtx.textBaseline  = "middle";
      offCtx.fillText("Ask Anything", W / 2, H / 2 - leading * 0.5);
      offCtx.fillText("Baby Bites",   W / 2, H / 2 + leading * 0.5);

      const { data } = offCtx.getImageData(0, 0, W, H);
      const points = [];
      for (let y = 0; y < H; y += 3) {
        for (let x = 0; x < W; x += 3) {
          if (data[(y * W + x) * 4 + 3] > 100) points.push({ x, y });
        }
      }

      particles = points.map(({ x, y }) => ({
        tx: x, ty: y,
        x:  Math.random() * W,
        y:  Math.random() < 0.5 ? -Math.random() * 100 : H + Math.random() * 100,
        vx: 0, vy: 0,
        r:       Math.random() * 0.85 + 0.45,
        opacity: 0,
        phase:   Math.random() * Math.PI * 2,
        settled: false,
      }));

      animId = requestAnimationFrame(animate);
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        const dx   = p.x - cursor.x;
        const dy   = p.y - cursor.y;
        const dist = Math.hypot(dx, dy);

        // Cursor repulsion
        if (dist < REPEL_RADIUS && dist > 0) {
          const f  = (REPEL_RADIUS - dist) / REPEL_RADIUS;
          p.vx    += (dx / dist) * f * REPEL_FORCE;
          p.vy    += (dy / dist) * f * REPEL_FORCE;
          p.settled = false;
        }

        // Spring toward target
        p.vx += (p.tx - p.x) * SPRING;
        p.vy += (p.ty - p.y) * SPRING;
        p.vx *= FRICTION;
        p.vy *= FRICTION;

        if (!p.settled && Math.hypot(p.x - p.tx, p.y - p.ty) < 2 &&
            Math.abs(p.vx) < 0.1 && Math.abs(p.vy) < 0.1) {
          p.settled = true;
        }

        if (p.settled && dist >= REPEL_RADIUS) {
          // Gentle breathing drift once settled
          p.phase += 0.02;
          p.x = p.tx + Math.cos(p.phase)       * 0.4;
          p.y = p.ty + Math.sin(p.phase * 1.3) * 0.4;
        } else if (!p.settled) {
          p.x += p.vx;
          p.y += p.vy;
        }

        if (p.opacity < 1) p.opacity = Math.min(1, p.opacity + 0.022);

        // Glow near cursor
        if (dist < REPEL_RADIUS) {
          const nf  = 1 - dist / REPEL_RADIUS;
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          glow.addColorStop(0, `rgba(255,255,255,${nf * 0.6})`);
          glow.addColorStop(1, "rgba(255,255,255,0)");
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        // Solid particle dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(animate);
    }

    init();

    const onMove  = (e) => {
      const r  = canvas.getBoundingClientRect();
      cursor.x = e.clientX - r.left;
      cursor.y = e.clientY - r.top;
    };
    const onLeave = () => { cursor.x = -9999; cursor.y = -9999; };
    canvas.addEventListener("mousemove",  onMove);
    canvas.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("mousemove",  onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      width: "100%", height: 230, display: "block",
      cursor: "none", background: "transparent",
    }} />
  );
}

function Explore() {
  const [input, setInput]       = useState("");
  const [cooldown, setCooldown] = useState(false);
  const [articleScroll, setArticleScroll] = useState(0);
  const articleRowRef = useRef(null);
  const inputRef = useRef(null);

  const onArticleScroll = () => {
    const el = articleRowRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setArticleScroll(max > 0 ? Math.min(el.scrollLeft / max, 1) : 0);
  };

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
    <div className="page" style={{ paddingTop: 0, paddingLeft: 0, paddingRight: 0 }}>
      <TopNav />

      {/* ── HERO: full-bleed video background, content on top ── */}
      <div style={{
        position: "relative", overflow: "hidden", minHeight: "92vh",
        marginLeft: "calc(-50vw + 50%)",
        width: "100vw",
        /* Fade top and bottom edges into the page background */
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 6%, black 90%, transparent 100%)",
        maskImage: "linear-gradient(to bottom, transparent 0%, black 6%, black 90%, transparent 100%)",
      }}>

        {/* Background video */}
        {VIDEO_URL ? (
          VIDEO_URL.includes("youtube.com") || VIDEO_URL.includes("youtu.be") ? (
            <iframe
              src={VIDEO_URL}
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                border: "none", objectFit: "cover",
                pointerEvents: "none",
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title="Background video"
            />
          ) : (
            <video
              src={VIDEO_URL}
              autoPlay muted loop playsInline
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                objectFit: "cover",
              }}
            />
          )
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(135deg, #2c3e50 0%, #3d5a47 100%)",
          }} />
        )}

        {/* Gradient overlay — dark on left, fades right */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.15) 100%)",
        }} />

        {/* Floating dust particles */}
        <ParticleCanvas />

        {/* Content on top */}
        <div style={{
          position: "relative", zIndex: 3,
          padding: "3.5rem calc(50vw - 50%) 4rem calc(50vw - 50%)",
          paddingLeft: "max(2rem, calc(50vw - 530px))",
          paddingRight: "max(2rem, calc(50vw - 530px))",
          maxWidth: "none",
        }}><div style={{ maxWidth: 560 }}>
          <span style={{
            fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.14em", color: "rgba(255,255,255,0.85)", display: "block",
            marginBottom: "0.75rem",
          }}>
            {t("aiEyebrow")}
          </span>

          <ParticleTitle />

          <p style={{
            margin: "0 0 2rem",
            fontSize: "1rem",
            color: "rgba(255,255,255,0.82)",
            lineHeight: 1.65,
            maxWidth: 420,
          }}>
            {t("aiSub")}
          </p>

          {!activeBaby && (
            <p style={{
              fontSize: "0.82rem", fontWeight: 600,
              color: "rgba(255,255,255,0.75)",
              marginBottom: "1rem",
            }}>
              {t("addBabyNudge")}
            </p>
          )}

          {/* Search input */}
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, marginBottom: "1rem", maxWidth: 500 }}>
            <input
              ref={inputRef}
              className="input input-glass"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("aiPlaceholder")}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(8px)",
                border: "1.5px solid rgba(255,255,255,0.35)",
              }}
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
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: "1.5rem" }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleChip(s)}
                  disabled={loading}
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    backdropFilter: "blur(6px)",
                    border: "1px solid rgba(255,255,255,0.28)",
                    borderRadius: 20, padding: "5px 13px",
                    fontSize: "0.78rem", fontWeight: 600,
                    color: "rgba(255,255,255,0.9)",
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
            <div style={{ marginTop: "0.75rem" }}>
              <SkeletonLine w="90%" />
              <SkeletonLine w="70%" />
              <SkeletonLine w="55%" />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <p style={{ color: "#ff8a80", fontSize: "0.9rem", marginTop: "0.75rem" }}>{error}</p>
          )}

          {/* Answer */}
          {!loading && answer && (
            <div style={{
              marginTop: "1rem",
              background: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(10px)",
              borderRadius: 14,
              padding: "1rem 1.25rem",
              maxWidth: 500,
            }}>
              <p style={{ lineHeight: 1.7, fontSize: "0.92rem", color: "#fff", margin: "0 0 0.6rem" }}>
                {answer}
              </p>
              {safetyNote && (
                <p style={{ color: "#ff8a80", fontSize: "0.85rem", fontWeight: 600, margin: "0 0 0.75rem" }}>
                  ⚠️ {safetyNote}
                </p>
              )}
              {recommendedMeals.length > 0 && (
                <div style={{ marginBottom: "0.85rem" }}>
                  <p style={{ fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.6)", marginBottom: "0.4rem" }}>
                    {t("suggestedMeals")}
                  </p>
                  <HorizontalScroll>
                    {recommendedMeals.map((meal) => (
                      <Link key={meal.id} to={`/meal/${meal.id}`} style={{ textDecoration: "none", flexShrink: 0, scrollSnapAlign: "start" }}>
                        <div style={{
                          width: 180, cursor: "pointer",
                          background: "rgba(255,255,255,0.1)",
                          borderRadius: 10, padding: "0.65rem 0.8rem",
                        }}>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 4 }}>
                            <span className="badge badge-slot">{meal.meal_slot}</span>
                          </div>
                          <p style={{ fontWeight: 700, fontSize: "0.88rem", margin: "0 0 3px", color: "#fff", fontFamily: "Aileron, sans-serif", lineHeight: 1.3 }}>
                            {meal.title}
                          </p>
                          <p style={{ fontSize: "0.72rem", margin: 0, color: "rgba(255,255,255,0.6)" }}>
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
                  <p style={{ fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.6)", marginBottom: "0.4rem" }}>
                    {t("suggestedFoods")}
                  </p>
                  <HorizontalScroll>
                    {recommendedFoods.map((food) => (
                      <Link key={food.id} to={`/foods/${food.id}`} style={{ textDecoration: "none", flexShrink: 0, scrollSnapAlign: "start" }}>
                        <div style={{ width: 120, cursor: "pointer", textAlign: "center" }}>
                          <img
                            src={food.image_url}
                            alt={food.name}
                            onError={(e) => { e.target.src = "https://placehold.co/60x60?text=🍽"; }}
                            style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 10, marginBottom: 5 }}
                          />
                          <p style={{ fontWeight: 700, fontSize: "0.78rem", margin: "0 0 1px", color: "#fff", fontFamily: "Aileron, sans-serif" }}>
                            {food.name}
                          </p>
                          <p style={{ fontSize: "0.68rem", margin: 0, color: "rgba(255,255,255,0.6)" }}>{food.food_group}</p>
                        </div>
                      </Link>
                    ))}
                  </HorizontalScroll>
                </div>
              )}
            </div>
          )}
        </div></div>{/* end maxWidth:560 */}
      </div>

      {/* ── Below-the-fold sections (back to normal padding) ── */}
      <div style={{ padding: "3rem 2rem 3rem" }}>

        {/* ── ARTICLES ── */}
        <div style={{ marginBottom: "3.5rem" }}>
          <span style={{
            fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.12em", color: "var(--orange-dark)", display: "block",
            marginBottom: "0.4rem",
          }}>
            Guides & Safety
          </span>
          <h2 style={{
            margin: "0 0 1.5rem",
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontFamily: "Aileron, sans-serif",
            fontWeight: 700, color: "var(--dark)",
            lineHeight: 1.1, letterSpacing: "-0.01em",
          }}>
            Parent reads
          </h2>

          {/* All articles in one scrollable row, ~5 visible */}
          <div
            ref={articleRowRef}
            onScroll={onArticleScroll}
            className="articles-row"
            style={{
              display: "flex", gap: 16,
              overflowX: "auto", paddingBottom: 8,
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {articles.map((article) => (
              <div key={article.slug} style={{ flex: "0 0 200px", scrollSnapAlign: "start" }}>
                <ArticleCard article={article} />
              </div>
            ))}
          </div>

          {/* Plate-fill scroll progress indicator */}
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
            {/* Circular plate */}
            <div style={{ position: "relative", width: 38, height: 38, flexShrink: 0 }}>
              <div style={{
                width: "100%", height: "100%", borderRadius: "50%",
                border: "2px solid var(--border)", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  height: `${articleScroll * 100}%`,
                  background: "linear-gradient(to top, var(--green-dark), var(--green-mid))",
                  transition: "height 0.12s ease",
                }} />
              </div>
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, lineHeight: 1,
              }}>
                {articleScroll < 0.05 ? "🍽️" : articleScroll > 0.9 ? "🍲" : "🥄"}
              </div>
            </div>
            {/* Thin green track */}
            <div style={{ flex: 1, height: 3, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
              <div style={{
                width: `${articleScroll * 100}%`, height: "100%",
                background: "var(--green-dark)", borderRadius: 2,
                transition: "width 0.12s ease",
              }} />
            </div>
          </div>
        </div>

        {/* ── DISCOVER ── */}
        <div style={{ marginBottom: "2rem" }}>
          <span style={{
            fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.12em", color: "var(--orange-dark)", display: "block",
            marginBottom: "0.4rem",
          }}>
            {t("discoverEyebrow")}
          </span>
          <h2 style={{
            margin: "0 0 1.75rem",
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontFamily: "Aileron, sans-serif", fontWeight: 700,
            color: "var(--dark)", lineHeight: 1.1, letterSpacing: "-0.01em",
          }}>
            Start exploring
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 24 }}>
            {[
              { to: "/foods?tag=iron-rich", emoji: "🩸", title: "Iron-rich foods",     desc: "Foods that support iron intake and healthy growth." },
              { to: "/foods",               emoji: "🥕", title: "Foods by age",         desc: "Filter the full food library by your baby's age in months." },
              { to: "/meals",               emoji: "🍽️", title: "Meal ideas by age",   desc: "Quick and fancy options for every meal slot." },
              { to: "/pantry",              emoji: "🧺", title: "Your pantry",          desc: "Track what you have at home and get matching meal ideas." },
              { to: "/my-meals",            emoji: "📋", title: "Saved meals",          desc: "Your personal collection of logged and saved baby meals." },
            ].map((item) => (
              <Link key={item.to} to={item.to} style={{ textDecoration: "none", display: "block" }}>
                <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.55rem" }}>{item.emoji}</span>
                <p style={{ margin: "0 0 5px", fontWeight: 800, fontSize: "1rem", color: "var(--dark)", fontFamily: "Aileron, sans-serif" }}>
                  {item.title}
                </p>
                <p className="muted" style={{ margin: 0, fontSize: "0.83rem", lineHeight: 1.55 }}>
                  {item.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Explore;
