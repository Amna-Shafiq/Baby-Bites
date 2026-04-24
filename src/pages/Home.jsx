import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/landing.css';
import { supabase } from '../lib/supabaseClient';
import useActiveBaby from '../hooks/useActiveBaby';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import CTAFooter from '../components/CTAFooter';

const STRIP_ITEMS = [
  { emoji: '🍌', name: 'Banana',       color: 'si-y' },
  { emoji: '🥕', name: 'Carrot',       color: 'si-o' },
  { emoji: '🫛', name: 'Peas',         color: 'si-b' },
  { emoji: '🥦', name: 'Broccoli',     color: 'si-g' },
  { emoji: '🍠', name: 'Sweet Potato', color: 'si-y' },
  { emoji: '🥑', name: 'Avocado',      color: 'si-o' },
  { emoji: '🐟', name: 'Salmon',       color: 'si-b' },
  { emoji: '🌾', name: 'Oatmeal',      color: 'si-g' },
  { emoji: '🥭', name: 'Mango',        color: 'si-y' },
  { emoji: '🫘', name: 'Lentils',      color: 'si-o' },
  { emoji: '🍐', name: 'Pear',         color: 'si-b' },
  { emoji: '🫐', name: 'Blueberry',    color: 'si-g' },
  { emoji: '🍑', name: 'Peach',        color: 'si-y' },
  { emoji: '🎃', name: 'Pumpkin',      color: 'si-o' },
  { emoji: '🥬', name: 'Spinach',      color: 'si-b' },
  { emoji: '🥚', name: 'Egg',          color: 'si-g' },
];

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
    <div style={{
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

const EAT_VIDS = [
  "https://res.cloudinary.com/dr0ixt3za/video/upload/v1776673986/eat1_ehgf5d.mp4",
  "https://res.cloudinary.com/dr0ixt3za/video/upload/v1776673972/eat2_pcpgrn.mp4",
  "https://res.cloudinary.com/dr0ixt3za/video/upload/v1776673952/eat3_ro6i2c.mp4",
];

// Stacked cards that cycle front→back every 3 s
function EatStack() {
  const [order, setOrder] = useState([0, 1, 2]); // indices into EAT_VIDS; order[0]=front

  useEffect(() => {
    const id = setInterval(() => {
      setOrder(([f, m, b]) => [m, b, f]); // rotate: front goes to back
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // position styles for front / middle / back
  const pos = [
    { bottom: 90, left: 0,  rotate:  0, scale: 1,    zIndex: 3, opacity: 1 },
    { bottom: 45, left: 22, rotate: -3, scale: 0.93,  zIndex: 2, opacity: 0.9 },
    { bottom:  0, left: 42, rotate:  5, scale: 0.86,  zIndex: 1, opacity: 0.75 },
  ];

  return (
    <div style={{ position: "relative", width: 360, height: 630 }}>
      {order.map((vidIdx, posIdx) => (
        <video
          key={vidIdx}
          src={EAT_VIDS[vidIdx]}
          autoPlay muted loop playsInline
          style={{
            position: "absolute",
            width: 300, height: 520,
            objectFit: "cover",
            borderRadius: 22,
            boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
            bottom:   pos[posIdx].bottom,
            left:     pos[posIdx].left,
            zIndex:   pos[posIdx].zIndex,
            opacity:  pos[posIdx].opacity,
            transform: `rotate(${pos[posIdx].rotate}deg) scale(${pos[posIdx].scale})`,
            transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      ))}
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
      style={{ position: "relative", borderRadius: 24, overflow: "hidden", height: 440, cursor: "pointer", userSelect: "none" }}
      onClick={() => navigate(dish.link)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Image — zoom pans to each dish via transform-origin transition */}
      <img
        src="/food-spread.png"
        alt={dish.name}
        style={{
          width: "100%", height: "100%",
          objectFit: "cover",
          display: "block",
          transform: "scale(2.4)",
          transformOrigin: dish.origin,
          transition: "transform-origin 2s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

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
          <div className="eyebrow" style={{ color: "var(--yellow-mid)" }}>{t("howEyebrow")}</div>
          <h2 style={{ color: "#fff" }}>{t("howHeading")}</h2>
          <p className="lp-sub" style={{ color: "#C8B8A8" }}>{t("howSub")}</p>
        </div>

        {/* Body: video left, steps right */}
        <div className="how-body">
          <div className="how-video-wrap">
            <video
              src="https://res.cloudinary.com/dr0ixt3za/video/upload/v1776674027/cooking_imctv7.mp4"
              autoPlay muted loop playsInline
              className="how-video"
            />
            {/* soft gradient at bottom so it melts into the dark bg */}
            <div className="how-video-fade" />
          </div>

          <div className="lp-steps">
            <div className="lp-step liquid-glass-strong">
              <div className="snum sy">01</div>
              <div className="stitle">{t("step1Title")}</div>
              <p className="sdesc">{t("step1Desc")}</p>
            </div>
            <div className="lp-step liquid-glass-strong">
              <div className="snum so">02</div>
              <div className="stitle">{t("step2Title")}</div>
              <p className="sdesc">{t("step2Desc")}</p>
            </div>
            <div className="lp-step liquid-glass-strong">
              <div className="snum sb">03</div>
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
      <ScrollThread />

      {/* ── Nav ── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <Link to="/" className="lp-logo">
            <img src="https://res.cloudinary.com/dr0ixt3za/image/upload/v1777020365/baby-bites-wordmark_nhiijh.svg" alt="Baby Bites" style={{ height: 30, display: "block" }} />
          </Link>
          <ul className="nav-links">
            <li><Link to="/explore">{t("explore")}</Link></li>
            <li><Link to="/foods">{t("allFoods")}</Link></li>
            <li><Link to="/meals">{t("meals")}</Link></li>
            <li><Link to="/pantry">{t("pantry")}</Link></li>
            <li><Link to="/my-meals">{t("myMeals")}</Link></li>
          </ul>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
        </div>

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
        <div className="lp-hero">
          <div>
            <div className="hero-pill liquid-glass">{t("heroTag")}</div>
            <h1>{t("heroHeading")} <em>{t("heroEm")}</em></h1>
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
              <div><div className="sn">100+</div><div className="sl">{t("statFoods")}</div></div>
              <div><div className="sn">60+</div><div className="sl">{t("statRecipes")}</div></div>
              <div><div className="sn">4–18m</div><div className="sl">{t("statAges")}</div></div>
            </div>
          </div>

          <div className="visual">
            <EatStack />
          </div>
        </div>
      </div>

      {/* ── Animated food strip ── */}
      <div className="lp-strip">
        <div className="strip-track">
          {[...STRIP_ITEMS, ...STRIP_ITEMS].map((item, i) => (
            <Link
              key={i}
              to={`/foods/${item.name.toLowerCase().replace(/\s+/g, "-")}`}
              className={`si ${item.color}`}
              style={{ textDecoration: "none" }}
            >
              {item.emoji} {item.name}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section className="lp-sec" id="features">
        <div className="eyebrow eo">{t("featEyebrow")}</div>
        <h2>{t("featHeading")}</h2>
        <p className="lp-sub">{t("featSub")}</p>
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
      <section className="lp-sec">
        <div className="eyebrow eg">{t("samplesEyebrow")}</div>
        <h2>{t("samplesHeading")}</h2>
        <p className="lp-sub">{t("samplesSub")}</p>
        <MealsShowcase />
      </section>

      {/* ── Age guide ── */}
      <div className="age-bg">
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

      {/* ── CTA ── */}
      <CTAFooter />

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="flogo">
          <img src="https://res.cloudinary.com/dr0ixt3za/image/upload/v1777020365/baby-bites-wordmark_nhiijh.svg" alt="Baby Bites" style={{ height: 26, display: "block" }} />
        </div>
        <div className="flinks">
          <a href="#features">{t("footerFeatures")}</a>
          <Link to="/meals">{t("meals")}</Link>
          <Link to="/foods">{t("allFoods")}</Link>
          <Link to="/about">{t("footerAbout")}</Link>
          <a href="#">{t("footerPrivacy")}</a>
        </div>
        <div className="fcopy">{t("footerCopy")}</div>
      </footer>

    </div>
  );
}

export default Home;
