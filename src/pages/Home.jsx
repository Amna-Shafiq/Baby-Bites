import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { mealSlug } from '../lib/mealSlug';
import { cloudinaryUrl } from '../lib/cloudinaryUrl';
import { Helmet } from 'react-helmet-async';
import '../styles/landing.css';
import { supabase } from '../lib/supabaseClient';
import useActiveBaby from '../hooks/useActiveBaby';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import CTAFooter from '../components/CTAFooter';
import BrandLogo from '../components/BrandLogo';

// ── Breakable image effect ────────────────────────────────
function BreakableImage({ src, wrapClass, imgClass, brokenClass }) {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    if (!broken) return;
    const t = setTimeout(() => setBroken(false), 900);
    return () => clearTimeout(t);
  }, [broken]);

  const bc = brokenClass || 'is-broken';

  return (
    <div
      className={`${wrapClass}${broken ? ` ${bc}` : ''}`}
      onMouseEnter={() => { if (!broken) setBroken(true); }}
    >
      <img src={src} className={imgClass} alt="" aria-hidden="true" />
      {broken && (
        <>
          <div className="img-shard img-shard-1" style={{ '--img': `url('${src}')` }} />
          <div className="img-shard img-shard-2" style={{ '--img': `url('${src}')` }} />
          <div className="img-shard img-shard-3" style={{ '--img': `url('${src}')` }} />
          <div className="img-shard img-shard-4" style={{ '--img': `url('${src}')` }} />
        </>
      )}
    </div>
  );
}

// ── Meal Slider ──────────────────────────────────────────
const SLIDER_MEALS = [
  { id: "09ff32bc-97a6-4157-ad74-0863b00e9227", title: "Avocado and Banana Rice",         image_url: "https://res.cloudinary.com/dr0ixt3za/image/upload/v1776695966/Avocado_and_Banana_Rice_wz28qj.png",                               min_age_months: 6,  max_age_months: 10, meal_slot: "lunch"      },
  { id: "4c064174-a26a-4c70-86f9-d7a8a3519b9b", title: "Millet Banana Porridge",           image_url: "https://res.cloudinary.com/dr0ixt3za/image/upload/v1777029746/Gemini_Generated_Image_dooo7ldooo7ldooo_rnnphh.png",               min_age_months: 6,  max_age_months: 12, meal_slot: "breakfast"  },
  { id: "68660184-8b87-4c7c-8c27-99bfbcd40268", title: "Banana Oatmeal Mash",              image_url: "https://res.cloudinary.com/dr0ixt3za/image/upload/v1776759324/Gemini_Generated_Image_huyxe5huyxe5huyx_uztj5o.png",               min_age_months: 4,  max_age_months: 8,  meal_slot: "breakfast"  },
  { id: "b8420d44-70a8-415e-9900-2a287df87bdf", title: "Mango Yogurt Bowl",                image_url: "https://res.cloudinary.com/dr0ixt3za/image/upload/v1777037738/Gemini_Generated_Image_ditjlditjlditjld_rvkp1y.png",               min_age_months: 8,  max_age_months: 18, meal_slot: "breakfast"  },
  { id: "6a27b4e1-23ad-4c68-870c-4e00ec9cf43e", title: "Egg and Vegetable Frittata",       image_url: "https://res.cloudinary.com/dr0ixt3za/image/upload/v1777042165/Gemini_Generated_Image_dxr87xdxr87xdxr8_gkaqn0.png",               min_age_months: 10, max_age_months: 18, meal_slot: "lunch"      },
  { id: "75a3b396-8987-4ab0-b802-ed8eda84f39e", title: "Blueberry Oat Bake",               image_url: "https://res.cloudinary.com/dr0ixt3za/image/upload/v1777042448/Gemini_Generated_Image_t9juc6t9juc6t9ju_d9b3st.png",               min_age_months: 8,  max_age_months: 18, meal_slot: "breakfast"  },
  { id: "64b73338-c619-4d71-a3b1-18bead97b637", title: "Butternut Squash Soup",            image_url: "https://res.cloudinary.com/dr0ixt3za/image/upload/v1777043652/Butternut_Squash_Soup_mfar7u.jpg",                                  min_age_months: 4,  max_age_months: 10, meal_slot: "lunch"      },
  { id: "8de019fd-f0e8-4278-8c16-c31013347ed2", title: "Chicken and Sweet Potato Puree",   image_url: "https://res.cloudinary.com/dr0ixt3za/image/upload/v1777043584/bmbm_jtzlv0.jpg",                                                   min_age_months: 6,  max_age_months: 10, meal_slot: "lunch"      },
  { id: "a4a0e667-040d-4fc7-8c79-ba1ab30a184f", title: "Beef and Vegetable Puree",         image_url: "https://res.cloudinary.com/dr0ixt3za/image/upload/v1776696598/veg-beef-puree_henr5w.png",                                          min_age_months: 6,  max_age_months: 12, meal_slot: "lunch"      },
  { id: "caf0ed8e-61fa-4dfe-99cf-8f10fbb3d98d", title: "Banana Slices",                    image_url: "https://res.cloudinary.com/dr0ixt3za/image/upload/v1776756025/Gemini_Generated_Image_ar3fa8ar3fa8ar3f_wmonzb.png",                 min_age_months: 6,  max_age_months: 18, meal_slot: "snack"      },
];

function MealSlider() {
  const navigate = useNavigate();
  const cards = [...SLIDER_MEALS, ...SLIDER_MEALS];

  return (
    <div className="lp-strip meal-strip">
      <div className="strip-track meal-track">
        {cards.map((meal, i) => (
          <div
            key={i}
            className="meal-slide-card"
            onClick={() => navigate(`/meal/${mealSlug(meal)}`)}
          >
            <img
              src={cloudinaryUrl(meal.image_url || "https://placehold.co/160x90?text=🍽", 400)}
              alt={meal.title}
              loading="lazy"
              onError={e => { e.target.src = "https://placehold.co/160x90?text=🍽"; }}
            />
            <div className="meal-slide-info">
              <p className="meal-slide-title">{meal.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Splash screen ─────────────────────────────────────
// ── Scroll thread ──────────────────────────────────────
const THREAD_NODES = [
  { label: "Welcome",  pct: 0   },
  { label: "Features", pct: 0.3 },
  { label: "How",      pct: 0.55 },
  { label: "Meals",    pct: 0.72 },
  { label: "Done",     pct: 1   },
];

function ScrollThread() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop || document.body.scrollTop;
      const total    = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? Math.min(scrolled / total, 1) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="scroll-thread" style={{
      position: "fixed", left: 12, top: 0, bottom: 0,
      width: 30, zIndex: 50, pointerEvents: "none",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      {/* Track */}
      <div style={{
        position: "absolute", top: 0, bottom: 0, left: "50%",
        width: 2, transform: "translateX(-50%)",
        background: "rgba(196,98,42,0.12)",
        borderRadius: 1,
      }} />

      {/* Fill */}
      <div style={{
        position: "absolute", top: 0, left: "50%",
        width: 2, transform: "translateX(-50%)",
        height: `${progress * 100}%`,
        background: "linear-gradient(to bottom, var(--orange-dark), var(--orange-mid))",
        borderRadius: 1,
        transition: "height 0.15s ease-out",
      }} />

      {/* Section nodes — small tick marks */}
      {THREAD_NODES.map((node) => {
        const reached = progress >= node.pct - 0.02;
        return (
          <div key={node.label} style={{
            position: "absolute",
            top: `${node.pct * 100}%`,
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 4, height: 4,
            borderRadius: "50%",
            background: reached ? "var(--orange-dark)" : "rgba(196,98,42,0.2)",
            transition: "background 0.4s ease",
          }} />
        );
      })}

      {/* Spoon travelling down the thread */}
      <div style={{
        position: "absolute",
        top: `${progress * 100}%`,
        left: "50%",
        transform: "translate(-50%, -50%) rotate(180deg)",
        fontSize: 18,
        filter: "drop-shadow(0 2px 4px rgba(196,98,42,0.4))",
        transition: "top 0.15s ease-out",
        lineHeight: 1,
      }}>
        🥄
      </div>
    </div>
  );
}


// ── HeroPanel: horizontal 3-card row ─────────────────────────────────────
function HeroPanel({ activeBaby, session, navigate }) {
  const [featuredMeal, setFeaturedMeal] = useState(null);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.from("meals").select("*").eq("is_public", true).then(({ data }) => {
      if (!data?.length) return;
      const dayIdx = Math.floor(Date.now() / 86400000) % data.length;
      setFeaturedMeal(data[dayIdx]);
    });
  }, []);

  return (
    <div className="hero-cards-row">
      {/* Today's Pick */}
      <div className="hac" onClick={() => featuredMeal && navigate(`/meal/${mealSlug(featuredMeal)}`)}>
        <div className="hac-img-wrap">
          {featuredMeal && featuredMeal.image_url && !imgFailed ? (
            <img
              src={featuredMeal.image_url?.includes('res.cloudinary.com')
                ? featuredMeal.image_url.replace('/upload/', '/upload/w_600,h_280,c_fill,q_auto,f_auto/')
                : featuredMeal.image_url}
              alt={featuredMeal.title}
              loading="eager"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="hac-placeholder">🍽️</div>
          )}
          <span className="hac-eyebrow-badge">Today's pick</span>
        </div>
        <div className="hac-body">
          <p className="hac-title">{featuredMeal?.title || "Loading…"}</p>
          <div className="hac-meta">
            {featuredMeal && <>
              <span>{featuredMeal.min_age_months}–{featuredMeal.max_age_months}m</span>
              {featuredMeal.meal_slot && <span>{featuredMeal.meal_slot}</span>}
            </>}
          </div>
        </div>
        <span className="hac-arrow">→</span>
      </div>

      {/* From My Pantry */}
      <div className="hac" onClick={() => navigate('/pantry')}>
        <div className="hac-img-wrap">
          <img src="/pantry.png" alt="From My Pantry" />
        </div>
        <div className="hac-body">
          <p className="hac-eyebrow-label">From My Pantry</p>
          <p className="hac-title">{activeBaby ? `Pick for ${activeBaby.name}` : "See what you can make"}</p>
        </div>
        <span className="hac-arrow">→</span>
      </div>

      {/* Log a bite */}
      <div className="hac" onClick={() => navigate(session ? '/my-meals' : '/login')}>
        <div className="hac-img-wrap">
          <img src="/logabite.png" alt="Log a bite" />
        </div>
        <div className="hac-body">
          <p className="hac-eyebrow-label">Log a bite</p>
          <p className="hac-title">Track what baby ate</p>
        </div>
        <span className="hac-arrow">→</span>
      </div>
    </div>
  );
}

// ── LandingParticleTitle: "Feed your baby with confidence" as interactive particles ──
const LP_REPEL_RADIUS = 90;
const LP_REPEL_FORCE  = 7;
const LP_SPRING       = 0.055;
const LP_FRICTION     = 0.82;

// Pre-parse hex → {r,g,b} so we're not doing it every animation frame
function hexRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}
const COLOR_DARK   = hexRgb("#2D2416"); // var(--dark)
const COLOR_ORANGE = hexRgb("#C4622A"); // var(--orange-dark)

function LandingParticleTitle() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx    = canvas.getContext("2d");
    let animId;
    const cursor = { x: -9999, y: -9999 };
    let particles = [];

    async function init() {
      try { await document.fonts.load("700 80px 'Aileron'"); } catch (_) {}

      const W = canvas.offsetWidth || 490;
      const H = 200;
      canvas.width  = W;
      canvas.height = H;

      // Pick a font size that fits the longer line, then auto-shrink if needed
      let fontSize = Math.min(W * 0.09, 52);
      const leading = fontSize * 1.18;

      function sampleLine(text, yPos, rgb, isItalic) {
        const off    = document.createElement("canvas");
        off.width    = W;
        off.height   = H;
        const offCtx = off.getContext("2d");

        // Auto-shrink if text overflows
        let fs = fontSize;
        offCtx.font = `${isItalic ? "italic " : ""}700 ${fs}px 'Aileron', sans-serif`;
        const measured = offCtx.measureText(text).width;
        if (measured > W * 0.94) fs = fs * (W * 0.94) / measured;

        offCtx.font         = `${isItalic ? "italic " : ""}700 ${fs}px 'Aileron', sans-serif`;
        offCtx.fillStyle    = "white";
        offCtx.textAlign    = "left";
        offCtx.textBaseline = "middle";
        offCtx.fillText(text, 0, yPos);

        const { data } = offCtx.getImageData(0, 0, W, H);
        const pts = [];
        for (let y = 0; y < H; y += 3) {
          for (let x = 0; x < W; x += 3) {
            if (data[(y * W + x) * 4 + 3] > 100) pts.push({ x, y });
          }
        }
        return pts.map((pt) => ({ ...pt, rgb }));
      }

      const line1 = sampleLine("Feed your baby with", H / 2 - leading * 0.5, COLOR_DARK,   false);
      const line2 = sampleLine("confidence",          H / 2 + leading * 0.5, COLOR_ORANGE, true);

      particles = [...line1, ...line2].map(({ x, y, rgb }) => ({
        tx: x, ty: y,
        x:  Math.random() * W,
        y:  Math.random() < 0.5 ? -Math.random() * 100 : H + Math.random() * 100,
        vx: 0, vy: 0,
        r:       Math.random() * 0.85 + 0.45,
        opacity: 0,
        phase:   Math.random() * Math.PI * 2,
        settled: false,
        rgb,
      }));

      animId = requestAnimationFrame(animate);
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        const dx   = p.x - cursor.x;
        const dy   = p.y - cursor.y;
        const dist = Math.hypot(dx, dy);

        if (dist < LP_REPEL_RADIUS && dist > 0) {
          const f  = (LP_REPEL_RADIUS - dist) / LP_REPEL_RADIUS;
          p.vx    += (dx / dist) * f * LP_REPEL_FORCE;
          p.vy    += (dy / dist) * f * LP_REPEL_FORCE;
          p.settled = false;
        }

        p.vx += (p.tx - p.x) * LP_SPRING;
        p.vy += (p.ty - p.y) * LP_SPRING;
        p.vx *= LP_FRICTION;
        p.vy *= LP_FRICTION;

        if (!p.settled &&
            Math.hypot(p.x - p.tx, p.y - p.ty) < 2 &&
            Math.abs(p.vx) < 0.1 && Math.abs(p.vy) < 0.1) {
          p.settled = true;
        }

        if (p.settled && dist >= LP_REPEL_RADIUS) {
          p.phase += 0.02;
          p.x = p.tx + Math.cos(p.phase)       * 0.4;
          p.y = p.ty + Math.sin(p.phase * 1.3) * 0.4;
        } else if (!p.settled) {
          p.x += p.vx;
          p.y += p.vy;
        }

        // Full opacity when cursor is away; fade when cursor is near
        const targetOpacity = dist < LP_REPEL_RADIUS ? 0.15 : 1;
        p.opacity += (targetOpacity - p.opacity) * 0.06;

        const { r, g, b } = p.rgb;

        // Glow near cursor (uses particle's own color)
        if (dist < LP_REPEL_RADIUS) {
          const nf   = 1 - dist / LP_REPEL_RADIUS;
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          glow.addColorStop(0, `rgba(${r},${g},${b},${nf * 0.5})`);
          glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${p.opacity})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(animate);
    }

    init();

    const onMove  = (e) => {
      const rect = canvas.getBoundingClientRect();
      cursor.x   = e.clientX - rect.left;
      cursor.y   = e.clientY - rect.top;
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
      width: "100%", height: 200, display: "block",
      cursor: "none", background: "transparent",
      marginBottom: "1rem",
    }} />
  );
}

// ── Meals showcase ────────────────────────────────────────
const SHOWCASE_DISHES = [
  { name: "Sweet Pea Mash",         sub: "4–6m · Starter",    origin: "15% 22%",  link: "/meals" },
  { name: "Pea & Rice Medley",      sub: "6–10m · Lunch",     origin: "50% 22%",  link: "/meals" },
  { name: "Herb Roast Chicken",     sub: "10–18m · Dinner",   origin: "84% 22%",  link: "/meals" },
  { name: "Banana Oat Porridge",    sub: "4–8m · Breakfast",  origin: "15% 80%",  link: "/meals" },
  { name: "Lentil & Carrot Puree",  sub: "6–10m · Lunch",     origin: "50% 80%",  link: "/meals" },
  { name: "Mini Oat Pancakes",      sub: "8–18m · Breakfast", origin: "84% 80%",  link: "/meals" },
];

function MealsShowcase() {
  const [active, setActive]   = useState(0);
  const [paused, setPaused]   = useState(false);
  const navigate              = useNavigate();

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive(i => (i + 1) % SHOWCASE_DISHES.length), 1000);
    return () => clearInterval(id);
  }, [paused]);

  const dish = SHOWCASE_DISHES[active];

  return (
    <div
      className="meals-showcase-wrap"
      onClick={() => navigate(dish.link)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Image — zoom pans to each dish via transform-origin transition */}
      <picture>
        <source srcSet="/food-spread.webp" type="image/webp" />
        <img
          src="/food-spread.png"
          alt={dish.name}
          fetchPriority="high"
          style={{
            width: "100%", height: "100%",
            objectFit: "cover",
            display: "block",
            transform: "scale(2.4)",
            transformOrigin: dish.origin,
            transition: "transform-origin 2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </picture>

      {/* Dark gradient at bottom for text legibility */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, transparent 35%, rgba(0,0,0,0.78) 100%)",
        pointerEvents: "none",
      }} />

      {/* Dish info */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "1.5rem 1.75rem" }}>
        <p style={{
          margin: "0 0 5px",
          fontSize: "0.68rem", fontWeight: 800,
          textTransform: "uppercase", letterSpacing: "0.12em",
          color: "rgba(255,255,255,0.65)",
        }}>
          {dish.sub}
        </p>
        <h3 style={{
          margin: "0 0 1.1rem",
          fontFamily: "Aileron, sans-serif",
          fontSize: "clamp(1.4rem, 3vw, 2rem)",
          fontWeight: 700, color: "#fff", lineHeight: 1.15,
        }}>
          {dish.name}
        </h3>

      </div>

      {/* View meals arrow badge */}
      <div style={{
        position: "absolute", top: "1rem", right: "1rem",
        background: "rgba(255,255,255,0.18)",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(255,255,255,0.3)",
        borderRadius: 100, padding: "6px 14px",
        fontSize: "0.75rem", fontWeight: 700, color: "#fff",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        View meals →
      </div>
    </div>
  );
}

function HowItWorks({ t }) {
  const sectionRef = useRef(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("how-visible");
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="how-bg">
      <div className="how-in" ref={sectionRef}>
        {/* Header */}
        <div className="how-header">
          <div className="eyebrow" style={{ color: "#4C200E" }}>{t("howEyebrow")}</div>
          <h2 style={{ color: "#4C200E" }}>{t("howHeading")}</h2>
          <p className="lp-sub" style={{ color: "#4C200E" }}>{t("howSub")}</p>
        </div>

        {/* Body: video left, steps right */}
        <div className="how-body">
          <div className="how-video-wrap">
            <video
              src="/cooking.mp4"
              autoPlay muted loop playsInline
              className="how-video"
            />
            {/* soft gradient at bottom so it melts into the dark bg */}
            <div className="how-video-fade" />
          </div>

          <div className="lp-steps">
            <div className="lp-step">
              <div className="snum sy">01</div>
              <div className="stitle">{t("step1Title")}</div>
              <p className="sdesc">{t("step1Desc")}</p>
            </div>
            <div className="lp-step">
              <div className="snum sb">02</div>
              <div className="stitle">{t("step2Title")}</div>
              <p className="sdesc">{t("step2Desc")}</p>
            </div>
            <div className="lp-step">
              <div className="snum so">03</div>
              <div className="stitle">{t("step3Title")}</div>
              <p className="sdesc">{t("step3Desc")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { activeBaby, babies, switchBaby } = useActiveBaby();
  const menuRef = useRef(null);
  const { lang, setLang, t } = useLanguage();
  const { dark, toggleTheme } = useTheme();

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data?.subscription?.unsubscribe?.();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const mobileNavRef = useRef(null);
  useEffect(() => {
    if (!mobileNavOpen) return;
    const handler = (e) => {
      if (mobileNavRef.current && !mobileNavRef.current.contains(e.target)) setMobileNavOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileNavOpen]);

  const profileInitial = useMemo(() => {
    const src = (session?.user?.user_metadata?.full_name || session?.user?.email || "?").trim();
    return src.charAt(0).toUpperCase();
  }, [session]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
  };

  return (
    <div className="landing-page">
      <Helmet>
        <title>Baby Bites — Age-Appropriate Meals & Food Guides for Babies</title>
        <meta name="description" content="Discover 100+ baby-safe recipes and food guides organised by age. From 6-month purees to 12-month family meals — Baby Bites makes weaning easy." />
        <meta property="og:type"        content="website" />
        <meta property="og:site_name"   content="Baby Bites" />
        <meta property="og:url"         content="https://babybites.net/" />
        <meta property="og:title"       content="Baby Bites — Age-Appropriate Meals & Food Guides for Babies" />
        <meta property="og:description" content="Discover 100+ baby-safe recipes and food guides organised by age. From 6-month purees to 12-month family meals — Baby Bites makes weaning easy." />
        <meta property="og:image"       content="https://babybites.net/food-spread.webp" />
        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:title"       content="Baby Bites — Age-Appropriate Meals & Food Guides for Babies" />
        <meta name="twitter:description" content="Discover 100+ baby-safe recipes and food guides organised by age. From 6-month purees to 12-month family meals — Baby Bites makes weaning easy." />
        <meta name="twitter:image"       content="https://babybites.net/food-spread.webp" />
      </Helmet>
      <ScrollThread />

      {/* ── Nav ── */}
      <nav className="lp-nav" ref={mobileNavRef}>
        <div className="lp-nav-inner">
          <Link to="/" className="lp-logo">
            <BrandLogo size="1.3rem" />
          </Link>
          <ul className="nav-links">
            <li><Link to="/explore">{t("explore")}</Link></li>
            <li><Link to="/foods">{t("allFoods")}</Link></li>
            <li><Link to="/meals">{t("meals")}</Link></li>
            <li><Link to="/pantry">{t("pantry")}</Link></li>
            <li><Link to="/my-meals">{t("myMeals")}</Link></li>
          </ul>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={toggleTheme}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", padding: "4px 6px", lineHeight: 1, color: "var(--muted)", borderRadius: 8 }}
          >
            {dark ? "☀️" : "🌙"}
          </button>
          <button
            className="lang-toggle"
            onClick={() => setLang(lang === "en" ? "ur" : "en")}
            title={lang === "en" ? "Switch to Urdu" : "Switch to English"}
          >
            <img
              src={lang === "en" ? "https://flagcdn.com/20x15/pk.png" : "https://flagcdn.com/20x15/us.png"}
              alt={lang === "en" ? "Pakistan" : "USA"}
              style={{ width: 20, height: 15, borderRadius: 2, objectFit: "cover" }}
            />
            {lang === "en" ? "اردو" : "EN"}
          </button>

        {session ? (
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              type="button"
              className="baby-nav-chip"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className="baby-nav-avatar">{activeBaby?.avatar || profileInitial}</span>
              {activeBaby && <span className="baby-nav-name">{activeBaby.name}</span>}
            </button>
            {menuOpen && (
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 6px)",
                background: "var(--white)", border: "1.5px solid var(--border)",
                borderRadius: 14, boxShadow: "0 8px 28px rgba(45,36,22,0.13)",
                minWidth: 200, overflow: "hidden", zIndex: 300,
              }}>
                {/* Baby switcher */}
                {babies.length > 0 && (
                  <>
                    <p style={{ padding: "0.5rem 1rem 0.25rem", fontSize: "0.7rem", fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {t("switchBaby")}
                    </p>
                    {babies.map((baby) => {
                      const isActive = baby.id === activeBaby?.id;
                      return (
                        <button
                          key={baby.id}
                          type="button"
                          onClick={() => { if (!isActive) switchBaby(baby.id); setMenuOpen(false); }}
                          style={{
                            width: "100%", textAlign: "left", padding: "0.55rem 1rem",
                            background: isActive ? "var(--cream)" : "none",
                            border: "none", cursor: isActive ? "default" : "pointer",
                            fontSize: "0.88rem", fontWeight: 600,
                            color: isActive ? "var(--orange-dark)" : "var(--dark)",
                            display: "flex", alignItems: "center", gap: 8,
                          }}
                        >
                          <span style={{ fontSize: "1rem" }}>{baby.avatar || "🐣"}</span>
                          <span style={{ flex: 1 }}>{baby.name}</span>
                          {isActive && <span style={{ fontSize: "0.7rem", color: "var(--orange-dark)" }}>✓</span>}
                        </button>
                      );
                    })}
                    <div style={{ borderTop: "1px solid var(--border)" }} />
                  </>
                )}

                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  style={{ display: "block", padding: "0.7rem 1rem", fontSize: "0.88rem", fontWeight: 600, color: "var(--dark)", textDecoration: "none", borderBottom: "1px solid var(--border)" }}
                >
                  My Profile
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  style={{ width: "100%", textAlign: "left", padding: "0.7rem 1rem", background: "none", border: "none", cursor: "pointer", fontSize: "0.88rem", fontWeight: 600, color: "#c0392b" }}
                >
                  {t("signOut")}
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="nav-btn" onClick={() => navigate('/login')}>
            <span className="nav-btn-full">{t("getStartedFree")}</span>
            <span className="nav-btn-short">{t("getStarted")}</span>
          </button>
        )}
          <button
            className="lp-hamburger"
            onClick={() => setMobileNavOpen(o => !o)}
            aria-label="Menu"
          >
            {mobileNavOpen ? "✕" : "☰"}
          </button>
        </div>
        </div>

        {mobileNavOpen && (
          <div className="lp-mobile-menu">
            <Link to="/explore" onClick={() => setMobileNavOpen(false)}>{t("explore")}</Link>
            <Link to="/foods" onClick={() => setMobileNavOpen(false)}>{t("allFoods")}</Link>
            <Link to="/meals" onClick={() => setMobileNavOpen(false)}>{t("meals")}</Link>
            <Link to="/pantry" onClick={() => setMobileNavOpen(false)}>{t("pantry")}</Link>
            <Link to="/my-meals" onClick={() => setMobileNavOpen(false)}>{t("myMeals")}</Link>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <div className="hero-bg">
        {/* Floating illustrations */}
        <BreakableImage src="/carrot.png" wrapClass="hero-carrot-wrap" imgClass="hero-carrot" />
        <img src="/strawberry.png" className="hero-float hero-strawberry" alt="" aria-hidden="true" />
        <img src="/leaf1.png"      className="hero-float hero-leaf1"      alt="" aria-hidden="true" />
        <img src="/leaf2.png"      className="hero-float hero-leaf2"      alt="" aria-hidden="true" />
        <img src="/leaf1.png"      className="hero-float hero-leaf3"      alt="" aria-hidden="true" />

        <div className="lp-hero">
          <h1>{t("heroHeading")}<br /><em>{t("heroEm")}</em></h1>
          <p className="hero-sub">{t("heroSub")}</p>
          <div className="hero-btns">
            {!session && (
              <button className="btn-a" onClick={() => navigate('/login')}>
                {t("startFree")}
              </button>
            )}
            <button className="btn-b" onClick={() => navigate('/meals')}>
              {t("exploreMeals")}
            </button>
          </div>
          <div className="lp-stats">
            <div><div className="sn">160+</div><div className="sl">{t("statFoods")}</div></div>
            <div><div className="sn">100+</div><div className="sl">{t("statRecipes")}</div></div>
            <div><div className="sn">4–18m</div><div className="sl">{t("statAges")}</div></div>
          </div>
          <HeroPanel activeBaby={activeBaby} session={session} navigate={navigate} />
        </div>
      </div>

      {/* ── Meal card slider ── */}
      <MealSlider />

      {/* ── Features ── */}
      <section className="lp-sec" id="features">
        <div className="feat-header">
          <div className="feat-header-text">
            <h2>{t("featHeading")} <em>{t("featHeadingEm")}</em></h2>
            <p className="lp-sub">{t("featSub")}</p>
          </div>
          <BreakableImage src="/raspberry.png" wrapClass="feat-raspberry-wrap" imgClass="feat-raspberry" />
        </div>
        <div className="feat-grid">
          <div className="fc bo">
            <div className="ficon fo">🥕</div>
            <div className="ft">{t("feat1Title")}</div>
            <p className="fd">{t("feat1Desc")}</p>
          </div>
          <div className="fc bg">
            <div className="ficon fg">🍽️</div>
            <div className="ft">{t("feat2Title")}</div>
            <p className="fd">{t("feat2Desc")}</p>
          </div>
          <div className="fc bb">
            <div className="ficon fb">⚡</div>
            <div className="ft">{t("feat3Title")}</div>
            <p className="fd">{t("feat3Desc")}</p>
          </div>
          <div className="fc by">
            <div className="ficon fy">❤️</div>
            <div className="ft">{t("feat4Title")}</div>
            <p className="fd">{t("feat4Desc")}</p>
          </div>
          <div className="fc bo">
            <div className="ficon fo">⚠️</div>
            <div className="ft">{t("feat5Title")}</div>
            <p className="fd">{t("feat5Desc")}</p>
          </div>
          <div className="fc bg">
            <div className="ficon fg">📋</div>
            <div className="ft">{t("feat6Title")}</div>
            <p className="fd">{t("feat6Desc")}</p>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <HowItWorks t={t} />

      {/* ── Sample meals ── */}
      <section className="lp-sec samples-sec">
        <div className="samples-header">
          <BreakableImage src="/pineapple.png" wrapClass="samples-pineapple-wrap" imgClass="samples-pineapple" />
          <h2 className="samples-heading">{t("samplesHeading")}</h2>
          <p className="lp-sub">{t("samplesSub")}</p>
        </div>
        <MealsShowcase />
        <img src="/leaf1.png" className="samples-leaf" alt="" aria-hidden="true" />
      </section>

      {/* ── Age guide ── */}
      <div className="age-bg">
        <img src="/meal.png" className="age-meal-img" alt="" aria-hidden="true" />
        <div className="age-in">
          <div className="eyebrow eb">{t("ageEyebrow")}</div>
          <h2>{t("ageHeading")}</h2>
          <p className="lp-sub">{t("ageSub")}</p>
          <div className="age-grid">
            <div className="agc">
              <div className="agr">4–6m</div>
              <div className="agl">{t("age1Label")}</div>
              <div className="agf">
                <span className="aft aft-y">Sweet potato</span>
                <span className="aft aft-y">Pear</span>
                <span className="aft aft-y">Carrot</span>
                <span className="aft aft-y">Oatmeal</span>
              </div>
            </div>
            <div className="agc">
              <div className="agr">6–8m</div>
              <div className="agl">{t("age2Label")}</div>
              <div className="agf">
                <span className="aft aft-o">Lentils</span>
                <span className="aft aft-o">Avocado</span>
                <span className="aft aft-o">Egg</span>
                <span className="aft aft-o">Salmon</span>
              </div>
            </div>
            <div className="agc">
              <div className="agr">8–10m</div>
              <div className="agl">{t("age3Label")}</div>
              <div className="agf">
                <span className="aft aft-g">Pasta</span>
                <span className="aft aft-g">Yogurt</span>
                <span className="aft aft-g">Chicken</span>
                <span className="aft aft-g">Tofu</span>
              </div>
            </div>
            <div className="agc">
              <div className="agr">10–18m</div>
              <div className="agl">{t("age4Label")}</div>
              <div className="agf">
                <span className="aft aft-b">Pancakes</span>
                <span className="aft aft-b">Muffins</span>
                <span className="aft aft-b">Stew</span>
                <span className="aft aft-b">Frittata</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Testimonials ── */}
      {(() => {
        const TESTIMONIALS = [
          {
            quote: "Finally an app that has almost all desi foods! I always wondered if I was giving the right foods at the right time.",
            name: "Sana R.",
            location: "Karachi",
            context: "Mum of an 8 month old",
          },
          // ADD MORE QUOTES HERE
        ];
        const [tIdx, setTIdx] = useState(0);
        const t = TESTIMONIALS[tIdx];
        return (
          <div style={{ padding: "3rem 0 1rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--orange-dark)", marginBottom: "0.5rem" }}>From parents</p>
            <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", marginBottom: "2rem", color: "var(--dark)" }}>What mamas are saying</h2>

            <div style={{ maxWidth: 520, margin: "0 auto 1.5rem", background: "var(--card-bg)", border: "1.5px solid var(--border)", borderRadius: 20, padding: "28px 28px 24px" }}>
              <p style={{ margin: "0 0 20px", fontSize: "1rem", lineHeight: 1.75, color: "var(--dark)", fontStyle: "italic" }}>
                "{t.quote}"
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--orange)", display: "grid", placeItems: "center", fontSize: "1rem", flexShrink: 0 }}>🧡</div>
                <div style={{ textAlign: "left" }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: "0.85rem", color: "var(--dark)" }}>{t.name}, {t.location}</p>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>{t.context}</p>
                </div>
              </div>
            </div>

            {TESTIMONIALS.length > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: "1.5rem" }}>
                <button onClick={() => setTIdx((tIdx - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)} style={{ background: "none", border: "1.5px solid var(--border)", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", color: "var(--muted)", fontSize: "0.9rem" }}>←</button>
                {TESTIMONIALS.map((_, i) => (
                  <span key={i} onClick={() => setTIdx(i)} style={{ width: 8, height: 8, borderRadius: "50%", background: i === tIdx ? "var(--orange-dark)" : "var(--border)", display: "inline-block", cursor: "pointer" }} />
                ))}
                <button onClick={() => setTIdx((tIdx + 1) % TESTIMONIALS.length)} style={{ background: "none", border: "1.5px solid var(--border)", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", color: "var(--muted)", fontSize: "0.9rem" }}>→</button>
              </div>
            )}

            <Link
              to="/about#contact"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                border: "1.5px solid var(--border)", borderRadius: 50,
                padding: "10px 22px", fontSize: "0.88rem", fontWeight: 700,
                color: "var(--orange-dark)", textDecoration: "none",
                background: "var(--card-bg)",
              }}
            >
              💬 Give feedback
            </Link>
          </div>
        );
      })()}

      {/* ── CTA ── */}
      <CTAFooter />

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="flogo"><BrandLogo size="1.1rem" /></div>
        <div className="flinks">
          <a href="#features">{t("footerFeatures")}</a>
          <Link to="/meals">{t("meals")}</Link>
          <Link to="/foods">{t("allFoods")}</Link>
          <Link to="/about">{t("footerAbout")}</Link>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <a
            href="https://www.instagram.com/trybabybites/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            style={{ color: "inherit", display: "flex", alignItems: "center" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/>
            </svg>
          </a>
          <button
            type="button"
            onClick={toggleTheme}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="footer-toggle-btn"
          >
            {dark ? "☀️" : "🌙"}
          </button>
          <button
            className="lang-toggle footer-lang-toggle"
            onClick={() => setLang(lang === "en" ? "ur" : "en")}
            title={lang === "en" ? "Switch to Urdu" : "Switch to English"}
          >
            <img
              src={lang === "en" ? "https://flagcdn.com/20x15/pk.png" : "https://flagcdn.com/20x15/us.png"}
              alt={lang === "en" ? "Pakistan" : "USA"}
              style={{ width: 20, height: 15, borderRadius: 2, objectFit: "cover" }}
            />
            {lang === "en" ? "اردو" : "EN"}
          </button>
        </div>
        <div className="fcopy">{t("footerCopy")}</div>
      </footer>

    </div>
  );
}

export default Home;
