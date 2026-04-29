import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { supabase } from "../lib/supabaseClient";
import { useLanguage } from "../contexts/LanguageContext";
import LogMealModal from "../components/LogMealModal";

const SS  = (slug) => ({ label: "Solid Starts",  url: `https://solidstarts.com/foods/${slug}/` });
const SRN = { label: "SR Nutrition — Herbs & Spices for Baby", url: "https://www.srnutrition.co.uk/2021/08/herbs-and-spices-for-baby/" };

const FOOD_REFERENCES = {
  pistachio:      [SS("pistachios")],
  pistachios:     [SS("pistachios")],
  walnut:         [SS("walnuts")],
  walnuts:        [SS("walnuts")],
  cashew:         [SS("cashew")],
  cashews:        [SS("cashew")],
  almond:         [SS("almond")],
  almonds:        [SS("almond")],
  peanut:         [SS("peanut")],
  peanuts:        [SS("peanut")],
  // Herbs & spices
  cinnamon:       [SS("cinnamon"),    SRN],
  cumin:          [SS("cumin"),       SRN],
  turmeric:       [SS("turmeric"),    SRN],
  ginger:         [SS("ginger"),      SRN],
  garlic:         [SS("garlic"),      SRN],
  cardamom:       [SS("cardamom"),    SRN],
  "black pepper": [SS("black-pepper"), SRN],
  paprika:        [SS("paprika"),     SRN],
  oregano:        [SS("oregano"),     SRN],
  basil:          [SS("basil"),       SRN],
  nutmeg:         [SS("nutmeg"),      SRN],
  coriander:      [SRN],
  "garam masala": [SRN],
  fennel:         [SRN],
  thyme:          [SRN],
  rosemary:       [SRN],
  // Meats
  chicken:        [SS("chicken")],
  "ground beef":  [SS("ground-beef"), { label: "Beef It's What's For Dinner — Beef in the Early Years", url: "https://www.beefitswhatsfordinner.com/nutrition/beef-in-the-early-years" }],
  beef:           [SS("ground-beef"), { label: "Beef It's What's For Dinner — Beef in the Early Years", url: "https://www.beefitswhatsfordinner.com/nutrition/beef-in-the-early-years" }],
  lamb:           [SS("lamb")],
  turkey:         [SS("turkey")],
  // Fruits
  apple:          [SS("apple")],
  apricot:        [SS("apricot")],
  apricots:       [SS("apricot")],
  avocado:        [SS("avocado")],
  banana:         [SS("banana")],
  // Vegetables
  arbi:           [SS("taro")],
  taro:           [SS("taro")],
  "bell pepper":      [SS("bell-pepper")],
  capsicum:           [SS("bell-pepper")],
  "black beans":      [SS("black-beans")],
  "black bean":       [SS("black-beans")],
  broccoli:           [SS("broccoli")],
  buckwheat:          [SS("buckwheat")],
  "butternut squash": [SS("butternut-squash")],
  cabbage:            [SS("cabbage")],
  carrot:             [SS("carrots")],
  carrots:            [SS("carrots")],
  "chia seed":        [SS("chia-seed")],
  "chia seeds":       [SS("chia-seed")],
  chia:               [SS("chia-seed")],
  cauliflower:        [SS("cauliflower")],
  chai:               [SS("tea")],
  tea:                [SS("tea")],
  // Grains
  bajra:                  [SS("millet"), { label: "My Little Moppet — Bajra Recipes", url: "https://www.mylittlemoppet.com/category/recipes/bajra-kambu-pearl-millet/" }],
  "bajra (pearl millet)": [SS("millet"), { label: "My Little Moppet — Bajra Recipes", url: "https://www.mylittlemoppet.com/category/recipes/bajra-kambu-pearl-millet/" }],
  "pearl millet":         [SS("millet"), { label: "My Little Moppet — Bajra Recipes", url: "https://www.mylittlemoppet.com/category/recipes/bajra-kambu-pearl-millet/" }],
  millet:                 [SS("millet")],
  barley:                 [SS("barley")],
  besan:                         [{ label: "Dalo Family Apps — Chickpea Flour for Babies", url: "https://dalofamilyapps.com/learn/food/chickpea-flour" }],
  "besan (chickpea flour)":      [{ label: "Dalo Family Apps — Chickpea Flour for Babies", url: "https://dalofamilyapps.com/learn/food/chickpea-flour" }],
  "chickpea flour":              [{ label: "Dalo Family Apps — Chickpea Flour for Babies", url: "https://dalofamilyapps.com/learn/food/chickpea-flour" }],
  "gram flour":                  [{ label: "Dalo Family Apps — Chickpea Flour for Babies", url: "https://dalofamilyapps.com/learn/food/chickpea-flour" }],
  // Vegetables (additional)
  beetroot:               [SS("beet-beetroot")],
  beet:                   [SS("beet-beetroot")],
  // Citrus
  lemon:                  [SS("lemon")],
  // Oils
  "olive oil":            [SS("olive-oil")],
  // Vegetables (additional)
  mooli:                  [SS("radish")],
  radish:                 [SS("radish")],
  // Other
  "french toast": [SS("french-toast")],
  "ice cream":    [SS("ice-cream")],
  egg:            [SS("eggs"), { label: "Australian Eggs — Babies & Children", url: "https://www.australianeggs.org.au/nutrition/babies-and-children" }],
  eggs:           [SS("eggs"), { label: "Australian Eggs — Babies & Children", url: "https://www.australianeggs.org.au/nutrition/babies-and-children" }],
  roti:           [{ label: "EuroKids — Introducing Roti to Kids", url: "https://www.eurokidsindia.com/blog/introducing-roti-to-kids-timing-preparation-and-benefits.php" }],
};

function getReferences(food) {
  const key = food.name?.toLowerCase().trim();
  return food.references || FOOD_REFERENCES[key] || null;
}

const STAGES = [
  {
    key:      "tip_puree",
    phase:    "🍼 Just Starting Solids",
    age:      "6+ months",
    color:    "#fff8f0",
    border:   "#f5cba7",
    textures: [
      { icon: "🥣", name: "Smooth Purees",      desc: "Completely blended · No lumps" },
      { icon: "🥄", name: "Slightly Textured",  desc: "Very soft tiny lumps" },
    ],
    generic: "Blend with breast milk, formula, or water until completely smooth. Strain if needed. Progress to a fork-mashed consistency with tiny soft lumps as baby gains confidence.",
  },
  {
    key:      "tip_finger_food",
    phase:    "👅 Learning to Move Food",
    age:      "7–9 months",
    color:    "#f0fff4",
    border:   "#a9dfbf",
    textures: [
      { icon: "🍌", name: "Soft Finger Foods", desc: "Easy to squish · Large enough to hold" },
    ],
    generic: "Cut into finger-length strips baby can grip. Steam or cook until soft enough to squish between fingers. Soft enough to gum without teeth.",
  },
  {
    key:      "tip_self_feeding",
    phase:    "🤲 Self-Feeding Stage",
    age:      "8–10 months",
    color:    "#f0f4ff",
    border:   "#a9c4f5",
    textures: [
      { icon: "🧩", name: "Mixed Textures", desc: "Soft + small chunks" },
    ],
    generic: "Combine mashed base with small soft pieces. Encourages chewing practice. Pieces should still be soft enough to squish easily.",
  },
  {
    key:      "tip_family_meal",
    phase:    "🍽️ Eating with Family",
    age:      "12+ months",
    color:    "#fdf0ff",
    border:   "#d7a9f5",
    textures: [
      { icon: "🍛", name: "Modified Family Meals", desc: "Same food, adjusted" },
    ],
    generic: "Serve the same food the family eats. Reduce salt and strong spices. Cut into safe bite-sized pieces. Avoid honey, whole nuts, and hard raw vegetables.",
  },
];

function ServingStages({ food }) {
  const hasAnyTip = STAGES.some((s) => food[s.key]);
  if (!hasAnyTip) return null;
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h3 style={{ marginBottom: "1rem", fontSize: "1rem" }}>How to Serve by Stage</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {STAGES.map((stage) => {
          const tip = food[stage.key];
          if (!tip) return null;
          return (
            <div key={stage.key} style={{ borderRadius: 14, border: `1.5px solid ${stage.border}`, background: stage.color, overflow: "hidden" }}>
              {/* Stage header */}
              <div style={{ padding: "10px 14px 6px", borderBottom: `1px solid ${stage.border}` }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: "0.88rem", color: "var(--dark)" }}>{stage.phase}</p>
                <p style={{ margin: "1px 0 0", fontSize: "0.72rem", color: "var(--muted)", fontWeight: 600 }}>{stage.age}</p>
              </div>
              {/* Textures */}
              <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                {stage.textures.map((tex) => (
                  <div key={tex.name}>
                    <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "0.82rem", color: "var(--dark)" }}>
                      {tex.icon} {tex.name}
                    </p>
                    <p style={{ margin: "0 0 8px", fontSize: "0.72rem", color: "var(--muted)" }}>{tex.desc}</p>
                    <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "8px 10px" }}>
                      <p style={{ margin: "0 0 4px", fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
                        👉 How to prepare
                      </p>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--dark)", lineHeight: 1.5 }}>
                        {tip}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FoodDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [food, setFood]     = useState(null);
  const [meals, setMeals]   = useState([]);
  const [error, setError]   = useState("");
  const [session, setSession]   = useState(null);
  const [logOpen, setLogOpen]   = useState(false);
  const [logSaved, setLogSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  const handleLogSubmit = async (reaction, notes) => {
    if (!session || !food) return;
    await supabase.from("feeding_logs").insert({
      user_id:   session.user.id,
      food_id:   food.id,
      item_name: food.name,
      reaction,
      notes:     notes?.trim() || null,
      fed_at:    new Date().toISOString(),
    });
    setLogSaved(true);
    setTimeout(() => setLogSaved(false), 3000);
  };

  useEffect(() => {
    const load = async () => {
      const isUUID = /^[0-9a-f-]{36}$/i.test(id);
      // Support name-slug lookup e.g. /foods/sweet-potato → name ILIKE 'sweet potato'
      const foodRes = await (isUUID
        ? supabase.from("foods").select("*").eq("id", id).single()
        : supabase.from("foods").select("*").ilike("name", id.replace(/-/g, " ")).limit(1).single());

      if (foodRes.error) { setError("Food not found."); return; }
      setFood(foodRes.data);

      const mealsRes = await supabase
        .from("meal_foods")
        .select("meals(*)")
        .eq("food_id", foodRes.data.id);

      setMeals(
        (mealsRes.data || [])
          .map((r) => r.meals)
          .filter((m) => m && m.is_public)
      );
    };
    load();
  }, [id]);

  if (error) return <div className="page"><Helmet><title>Food Not Found | Baby Bites</title></Helmet><p className="muted" style={{ marginTop: "2rem" }}>{error}</p></div>;
  if (!food)  return <div className="page"><Helmet><title>Baby Bites</title></Helmet><p className="muted" style={{ marginTop: "2rem" }}>Loading...</p></div>;

  return (
    <div className="page">
      <Helmet>
        <title>{food.name} for Babies | Baby Bites</title>
        <meta name="description" content={`When can babies eat ${food.name}? Safe from ${food.safe_from_months} months. ${food.notes ? food.notes.slice(0, 120) + "…" : "Learn how to prepare and serve it safely at every stage."}`} />
      </Helmet>

      {logOpen && food && (
        <LogMealModal
          mealName={food.name}
          onSubmit={handleLogSubmit}
          onClose={() => setLogOpen(false)}
        />
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1.5rem" }}>
        <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ paddingLeft: 0 }}>
          {t("back")}
        </button>
        <button
          type="button"
          onClick={() => session ? setLogOpen(true) : navigate("/login")}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: logSaved ? "var(--cream)" : "none",
            border: "1.5px solid var(--border)", borderRadius: 10,
            padding: "6px 12px", cursor: "pointer",
            fontSize: "0.82rem", fontWeight: 700,
            color: logSaved ? "var(--orange-dark)" : "var(--muted)",
          }}
        >
          {logSaved ? "✓ Logged!" : "📋 Log as fed"}
        </button>
      </div>

      {/* ── Food header ── */}
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap", margin: "1.5rem 0" }}>
        <img
          src={food.image_url}
          alt={food.name}
          onError={(e) => { e.target.src = "https://placehold.co/120x120?text=🍽"; }}
          style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 16, border: "1.5px solid var(--border)" }}
        />
        <div style={{ flex: 1 }}>
          <span className="eyebrow eo">{food.food_group || "food"}</span>
          <h1 style={{ marginBottom: "0.75rem" }}>{food.name}</h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="badge badge-age">Safe from {food.safe_from_months}m+</span>
            {food.is_iron_rich && <span className="badge badge-quick">✓ Iron-rich</span>}
          </div>
        </div>
      </div>

      {/* ── Notes ── */}
      {(food.notes || food.texture_tips) && (
        <div className="card" style={{ marginBottom: "1rem", background: "#fffbf0", border: "1.5px solid #f5e0a0" }}>
          <h3 style={{ marginBottom: "0.5rem", fontSize: "0.9rem" }}>📝 Notes</h3>
          {food.notes && <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--dark)", lineHeight: 1.6 }}>{food.notes}</p>}
          {food.texture_tips && (
            <p style={{ margin: food.notes ? "0.6rem 0 0" : 0, fontSize: "0.85rem", color: "var(--dark)", lineHeight: 1.6 }}>{food.texture_tips}</p>
          )}
        </div>
      )}

      {/* ── Stages + Allergen side by side ── */}
      {(() => {
        const hasStages = STAGES.some((s) => food[s.key]);
        if (!hasStages && !food.allergen_notes) return null;
        return (
      <div style={{ display: "grid", gridTemplateColumns: hasStages && food.allergen_notes ? "1fr 300px" : "1fr", gap: 16, alignItems: "start", marginBottom: "1rem" }}>
        <ServingStages food={food} />
        {food.allergen_notes && (
          <div className="card card-allergen" style={{ position: "sticky", top: 90 }}>
            <h3 style={{ marginBottom: "0.5rem", color: "#c0392b", fontSize: "0.9rem" }}>{t("allergenNotes")}</h3>
            <p style={{ color: "#c0392b", margin: 0, fontSize: "0.82rem", lineHeight: 1.6 }}>{food.allergen_notes}</p>
          </div>
        )}
      </div>
        );
      })()}

      {/* ── Meals using this food ── */}
      <div className="panel" style={{ marginTop: "1.5rem" }}>
        <h2 style={{ marginBottom: "0.3rem" }}>{t("mealsWith")} {food.name}</h2>
        <p className="muted" style={{ fontSize: "0.9rem", marginBottom: "1.2rem", lineHeight: 1.6 }}>
          {t("mealsWithDesc")}
        </p>
        {meals.length === 0 ? (
          <p className="muted">{t("noMealsFood")}</p>
        ) : (
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, scrollSnapType: "x mandatory" }}>
            {meals.map((meal) => (
              <Link key={meal.id} to={`/meal/${meal.id}`} style={{ textDecoration: "none", flexShrink: 0, scrollSnapAlign: "start" }}>
                <div style={{
                  width: 200,
                  background: "var(--cream)",
                  border: "1.5px solid var(--border)",
                  borderRadius: 16,
                  padding: "1rem",
                  cursor: "pointer",
                  height: "100%",
                }}>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
                    <span className="badge badge-slot">{meal.meal_slot}</span>
                    <span className={`badge badge-${meal.meal_type}`}>{meal.meal_type}</span>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: "0.92rem", margin: "0 0 6px", color: "var(--dark)", fontFamily: "Aileron, sans-serif", lineHeight: 1.3 }}>
                    {meal.title}
                  </p>
                  <p className="muted" style={{ fontSize: "0.78rem", margin: 0 }}>
                    {meal.min_age_months}–{meal.max_age_months}m
                    {meal.prep_time_minutes ? ` · ${meal.prep_time_minutes} min` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── References ── */}
      {(() => {
        const refs = getReferences(food);
        if (!refs || refs.length === 0) return null;
        return (
          <div className="panel" style={{ marginTop: "1.5rem" }}>
            <h2 style={{ marginBottom: "0.3rem" }}>{t("references")}</h2>
            <p className="muted" style={{ fontSize: "0.9rem", marginBottom: "1rem", lineHeight: 1.6 }}>
              {t("referencesDesc")}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {refs.map((ref, i) => (
                <li key={i}>
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      color: "var(--orange-dark)", fontWeight: 700, fontSize: "0.9rem",
                      textDecoration: "none",
                    }}
                  >
                    <span style={{ fontSize: "1rem" }}>📖</span>
                    {ref.label}
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        );
      })()}
    </div>
  );
}

export default FoodDetail;
