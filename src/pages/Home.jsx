import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/landing.css';
import { supabase } from '../lib/supabaseClient';
import useActiveBaby from '../hooks/useActiveBaby';
import { useLanguage } from '../contexts/LanguageContext';

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

function Home() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { activeBaby, babies, switchBaby } = useActiveBaby();
  const menuRef = useRef(null);
  const { lang, setLang, t } = useLanguage();

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

      {/* ── Nav ── */}
      <nav className="lp-nav">
        <Link to="/" className="lp-logo">
          <span className="logo-dot" />
          Baby Bites
        </Link>
        <ul className="nav-links">
          <li><Link to="/explore">{t("explore")}</Link></li>
          <li><Link to="/foods">{t("allFoods")}</Link></li>
          <li><Link to="/meals">{t("meals")}</Link></li>
          <li><Link to="/pantry">{t("pantry")}</Link></li>
          <li><Link to="/my-meals">{t("myMeals")}</Link></li>
        </ul>
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
            {t("getStartedFree")}
          </button>
        )}
      </nav>

      {/* ── Hero ── */}
      <div className="hero-bg">
        <div className="lp-hero">
          <div>
            <div className="hero-pill">{t("heroTag")}</div>
            <h1>{t("heroHeading")} <em>{t("heroEm")}</em></h1>
            <p className="hero-sub">{t("heroSub")}</p>
            <div className="hero-btns">
              <button className="btn-a" onClick={() => navigate('/login')}>
                {t("startFree")}
              </button>
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
            <div style={{ position: 'relative' }}>
              <div className="lp-float lp-f1">{t("floatIron")}</div>
              <div className="phone">
                <div className="notch" />
                <div className="screen">
                  <div className="scr-top">
                    <div className="scr-title">Today's Meals</div>
                    <div className="age-badge">8 months</div>
                  </div>
                  <div className="scr-card">
                    <div className="scr-row">
                      <div className="scr-name">Banana Oatmeal Mash</div>
                      <div className="scr-time">5 min</div>
                    </div>
                    <div className="scr-sub">Breakfast</div>
                    <span className="stag st-o">4–8m</span>
                  </div>
                  <div className="scr-card">
                    <div className="scr-row">
                      <div className="scr-name">Lentil &amp; Carrot Puree</div>
                      <div className="scr-time">15 min</div>
                    </div>
                    <div className="scr-sub">Lunch</div>
                    <span className="stag st-g">Iron-rich</span>
                  </div>
                  <div className="scr-card">
                    <div className="scr-row">
                      <div className="scr-name">Salmon &amp; Pea Mash</div>
                      <div className="scr-time">12 min</div>
                    </div>
                    <div className="scr-sub">Dinner</div>
                    <span className="stag st-b">Omega-3</span>
                  </div>
                </div>
              </div>
              <div className="lp-float lp-f2">{t("floatAge")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Animated food strip ── */}
      <div className="lp-strip">
        <div className="strip-track">
          {[...STRIP_ITEMS, ...STRIP_ITEMS].map((item, i) => (
            <div key={i} className={`si ${item.color}`}>
              {item.emoji} {item.name}
            </div>
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
      <div className="how-bg">
        <div className="how-in">
          <div className="eyebrow" style={{ color: 'var(--yellow-mid)' }}>{t("howEyebrow")}</div>
          <h2 style={{ color: '#fff' }}>{t("howHeading")}</h2>
          <p className="lp-sub" style={{ color: '#C8B8A8' }}>{t("howSub")}</p>
          <div className="lp-steps">
            <div className="lp-step">
              <div className="snum sy">01</div>
              <div className="stitle">{t("step1Title")}</div>
              <p className="sdesc">{t("step1Desc")}</p>
            </div>
            <div className="lp-step">
              <div className="snum so">02</div>
              <div className="stitle">{t("step2Title")}</div>
              <p className="sdesc">{t("step2Desc")}</p>
            </div>
            <div className="lp-step">
              <div className="snum sb">03</div>
              <div className="stitle">{t("step3Title")}</div>
              <p className="sdesc">{t("step3Desc")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sample meals ── */}
      <section className="lp-sec">
        <div className="eyebrow eg">{t("samplesEyebrow")}</div>
        <h2>{t("samplesHeading")}</h2>
        <p className="lp-sub">{t("samplesSub")}</p>
        <div className="meals-grid">
          <div className="mc my">
            <div className="mico">🍌</div>
            <div>
              <div className="mbadges">
                <span className="mbg">{t("slotBreakfast")}</span>
                <span className="mbg">{t("typeQuick")}</span>
                <span className="mbg">4–8m</span>
              </div>
              <div className="mname">{t("meal1Name")}</div>
              <p className="mdesc">{t("meal1Desc")}</p>
            </div>
          </div>
          <div className="mc mo">
            <div className="mico">🫘</div>
            <div>
              <div className="mbadges">
                <span className="mbg">{t("slotLunch")}</span>
                <span className="mbg">{t("typeQuick")}</span>
                <span className="mbg">6–10m</span>
              </div>
              <div className="mname">{t("meal2Name")}</div>
              <p className="mdesc">{t("meal2Desc")}</p>
            </div>
          </div>
          <div className="mc lp-mb">
            <div className="mico">🐟</div>
            <div>
              <div className="mbadges">
                <span className="mbg">{t("slotDinner")}</span>
                <span className="mbg">{t("typeQuick")}</span>
                <span className="mbg">6–12m</span>
              </div>
              <div className="mname">{t("meal3Name")}</div>
              <p className="mdesc">{t("meal3Desc")}</p>
            </div>
          </div>
          <div className="mc mg">
            <div className="mico">🥞</div>
            <div>
              <div className="mbadges">
                <span className="mbg">{t("slotBreakfast")}</span>
                <span className="mbg">{t("typeFancy")}</span>
                <span className="mbg">8–18m</span>
              </div>
              <div className="mname">{t("meal4Name")}</div>
              <p className="mdesc">{t("meal4Desc")}</p>
            </div>
          </div>
        </div>
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
      <div className="cta-bg">
        <div className="cta-in">
          <h2 className="cta-t">{t("ctaHeading")}</h2>
          <p className="cta-s">{t("ctaSub")}</p>
          <button className="cta-btn" onClick={() => navigate('/login')}>
            {t("ctaBtn")}
          </button>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="flogo">Baby Bites</div>
        <div className="flinks">
          <a href="#features">{t("footerFeatures")}</a>
          <Link to="/meals">{t("meals")}</Link>
          <Link to="/foods">{t("allFoods")}</Link>
          <a href="#">{t("footerPrivacy")}</a>
        </div>
        <div className="fcopy">{t("footerCopy")}</div>
      </footer>

    </div>
  );
}

export default Home;
