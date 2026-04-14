import { useNavigate, Link } from 'react-router-dom';
import '../styles/landing.css';

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

  return (
    <div className="landing-page">

      {/* ── Nav ── */}
      <nav className="lp-nav">
        <Link to="/" className="lp-logo">
          <span className="logo-dot" />
          Baby Bites
        </Link>
        <ul className="nav-links">
          <li><Link to="/explore">Explore</Link></li>
          <li><Link to="/foods">All Foods</Link></li>
          <li><Link to="/meals">Meals</Link></li>
          <li><Link to="/my-meals">Pantry</Link></li>
        </ul>
        <button className="nav-btn" onClick={() => navigate('/login')}>
          Get started free
        </button>
      </nav>

      {/* ── Hero ── */}
      <div className="hero-bg">
        <div className="lp-hero">
          <div>
            <div className="hero-pill">🌿 Safe, age-based nutrition</div>
            <h1>Feed your baby with <em>confidence</em></h1>
            <p className="hero-sub">
              Age-appropriate meals, safe food guides, and nutrition tips —
              tailored to every stage of your baby's development.
            </p>
            <div className="hero-btns">
              <button className="btn-a" onClick={() => navigate('/login')}>
                Start for free
              </button>
              <button className="btn-b" onClick={() => navigate('/meals')}>
                Explore meals
              </button>
            </div>
            <div className="lp-stats">
              <div><div className="sn">80+</div><div className="sl">Safe foods</div></div>
              <div><div className="sn">60+</div><div className="sl">Recipes</div></div>
              <div><div className="sn">4–18m</div><div className="sl">Ages covered</div></div>
            </div>
          </div>

          <div className="visual">
            <div style={{ position: 'relative' }}>
              <div className="lp-float lp-f1">✓ Iron-rich</div>
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
              <div className="lp-float lp-f2">👶 Age-safe</div>
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
        <div className="eyebrow eo">Why Baby Bites</div>
        <h2>Everything you need for<br />happy, healthy mealtimes</h2>
        <p className="lp-sub">
          No more guessing what's safe. Baby Bites guides you through every
          stage of your baby's food journey.
        </p>
        <div className="feat-grid">
          <div className="fc bo">
            <div className="ficon fo">🥕</div>
            <div className="ft">Age-safe food guide</div>
            <p className="fd">Browse 80+ foods with safe-from ages, texture tips, and allergen warnings all in one place.</p>
          </div>
          <div className="fc bg">
            <div className="ficon fg">🍽️</div>
            <div className="ft">60+ curated recipes</div>
            <p className="fd">Quick and fancy meals for every slot — breakfast, lunch, dinner, and snacks — filtered by age.</p>
          </div>
          <div className="fc bb">
            <div className="ficon fb">⚡</div>
            <div className="ft">AI meal helper</div>
            <p className="fd">Ask "iron-rich meal for 8 months" or "quick breakfast" and get instant, safe suggestions.</p>
          </div>
          <div className="fc by">
            <div className="ficon fy">❤️</div>
            <div className="ft">Save your favorites</div>
            <p className="fd">Bookmark meals you love and build your personal collection of go-to recipes for every stage.</p>
          </div>
          <div className="fc bo">
            <div className="ficon fo">⚠️</div>
            <div className="ft">Allergen alerts</div>
            <p className="fd">Clear warnings for all top-8 allergens so you can introduce new foods safely and confidently.</p>
          </div>
          <div className="fc bg">
            <div className="ficon fg">📋</div>
            <div className="ft">Custom meals</div>
            <p className="fd">Create and save your own recipes alongside our curated library to build your baby's personal menu.</p>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <div className="how-bg">
        <div className="how-in">
          <div className="eyebrow" style={{ color: 'var(--yellow-mid)' }}>
            How it works
          </div>
          <h2 style={{ color: '#fff' }}>Three steps to stress-free feeding</h2>
          <p className="lp-sub" style={{ color: '#C8B8A8' }}>
            Simple, fast, designed for tired parents.
          </p>
          <div className="lp-steps">
            <div className="lp-step">
              <div className="snum sy">01</div>
              <div className="stitle">Enter your baby's age</div>
              <p className="sdesc">Set your baby's age in months and instantly see only the foods and meals that are safe right now.</p>
            </div>
            <div className="lp-step">
              <div className="snum so">02</div>
              <div className="stitle">Browse or search</div>
              <p className="sdesc">Filter by meal type, time of day, or ingredients you already have. Or just ask the AI helper.</p>
            </div>
            <div className="lp-step">
              <div className="snum sb">03</div>
              <div className="stitle">Cook with confidence</div>
              <p className="sdesc">Follow simple step-by-step instructions with texture tips and allergen warnings built right in.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sample meals ── */}
      <section className="lp-sec">
        <div className="eyebrow eg">Sample meals</div>
        <h2>Meals babies actually eat</h2>
        <p className="lp-sub">
          From 4-month purees to 18-month finger foods — every meal is
          age-checked and nutrition-conscious.
        </p>
        <div className="meals-grid">
          <div className="mc my">
            <div className="mico">🍌</div>
            <div>
              <div className="mbadges">
                <span className="mbg">Breakfast</span>
                <span className="mbg">Quick</span>
                <span className="mbg">4–8m</span>
              </div>
              <div className="mname">Banana Oatmeal Mash</div>
              <p className="mdesc">Creamy oatmeal mashed with ripe banana. Iron-rich and loved by little ones.</p>
            </div>
          </div>
          <div className="mc mo">
            <div className="mico">🫘</div>
            <div>
              <div className="mbadges">
                <span className="mbg">Lunch</span>
                <span className="mbg">Quick</span>
                <span className="mbg">6–10m</span>
              </div>
              <div className="mname">Lentil &amp; Carrot Puree</div>
              <p className="mdesc">Classic iron-rich lentil puree with sweet carrot. A baby staple.</p>
            </div>
          </div>
          <div className="mc lp-mb">
            <div className="mico">🐟</div>
            <div>
              <div className="mbadges">
                <span className="mbg">Dinner</span>
                <span className="mbg">Quick</span>
                <span className="mbg">6–12m</span>
              </div>
              <div className="mname">Salmon with Pea Mash</div>
              <p className="mdesc">Omega-rich salmon with smooth pea mash. Packed with brain-building nutrients.</p>
            </div>
          </div>
          <div className="mc mg">
            <div className="mico">🥞</div>
            <div>
              <div className="mbadges">
                <span className="mbg">Breakfast</span>
                <span className="mbg">Fancy</span>
                <span className="mbg">8–18m</span>
              </div>
              <div className="mname">Mini Banana Pancakes</div>
              <p className="mdesc">Two-ingredient soft pancakes — banana and egg. Naturally sweet, no sugar needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Age guide ── */}
      <div className="age-bg">
        <div className="age-in">
          <div className="eyebrow eb">Age guide</div>
          <h2>Right food, right time</h2>
          <p className="lp-sub">
            Every food and meal is tagged with safe-from ages so you never
            have to second-guess.
          </p>
          <div className="age-grid">
            <div className="agc">
              <div className="agr">4–6m</div>
              <div className="agl">First tastes</div>
              <div className="agf">
                <span className="aft aft-y">Sweet potato</span>
                <span className="aft aft-y">Pear</span>
                <span className="aft aft-y">Carrot</span>
                <span className="aft aft-y">Oatmeal</span>
              </div>
            </div>
            <div className="agc">
              <div className="agr">6–8m</div>
              <div className="agl">Expanding</div>
              <div className="agf">
                <span className="aft aft-o">Lentils</span>
                <span className="aft aft-o">Avocado</span>
                <span className="aft aft-o">Egg</span>
                <span className="aft aft-o">Salmon</span>
              </div>
            </div>
            <div className="agc">
              <div className="agr">8–10m</div>
              <div className="agl">Soft textures</div>
              <div className="agf">
                <span className="aft aft-g">Pasta</span>
                <span className="aft aft-g">Yogurt</span>
                <span className="aft aft-g">Chicken</span>
                <span className="aft aft-g">Tofu</span>
              </div>
            </div>
            <div className="agc">
              <div className="agr">10–18m</div>
              <div className="agl">Finger foods</div>
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
          <h2 className="cta-t">Start feeding with confidence today</h2>
          <p className="cta-s">
            Join parents using Baby Bites to take the guesswork out of every mealtime.
          </p>
          <button className="cta-btn" onClick={() => navigate('/login')}>
            Get started for free
          </button>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="flogo">Baby Bites</div>
        <div className="flinks">
          <a href="#features">Features</a>
          <Link to="/meals">Meals</Link>
          <Link to="/foods">Foods</Link>
          <a href="#">Privacy</a>
        </div>
        <div className="fcopy">© 2026 Baby Bites</div>
      </footer>

    </div>
  );
}

export default Home;
