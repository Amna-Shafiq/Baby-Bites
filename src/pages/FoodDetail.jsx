import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

import { supabase } from "../lib/supabaseClient";
import { useLanguage } from "../contexts/LanguageContext";
import LogMealModal from "../components/LogMealModal";

const FOOD_REFERENCES = {
  pistachio:  [{ label: "Solid Starts", url: "https://solidstarts.com/foods/pistachios/" }],
  pistachios: [{ label: "Solid Starts", url: "https://solidstarts.com/foods/pistachios/" }],
  walnut:     [{ label: "Solid Starts", url: "https://solidstarts.com/foods/walnuts/" }],
  walnuts:    [{ label: "Solid Starts", url: "https://solidstarts.com/foods/walnuts/" }],
  cashew:     [{ label: "Solid Starts", url: "https://solidstarts.com/foods/cashew/" }],
  cashews:    [{ label: "Solid Starts", url: "https://solidstarts.com/foods/cashew/" }],
  almond:     [{ label: "Solid Starts", url: "https://solidstarts.com/foods/almond/" }],
  almonds:    [{ label: "Solid Starts", url: "https://solidstarts.com/foods/almond/" }],
  peanut:     [{ label: "Solid Starts", url: "https://solidstarts.com/foods/peanut/" }],
  peanuts:    [{ label: "Solid Starts", url: "https://solidstarts.com/foods/peanut/" }],
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
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h3 style={{ marginBottom: "1rem", fontSize: "1rem" }}>How to Serve by Stage</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {STAGES.map((stage) => {
          const tip = food[stage.key];
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
                        {tip || stage.generic}
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
      // Load food + meals that use this food in parallel
      const [foodRes, mealsRes] = await Promise.all([
        supabase.from("foods").select("*").eq("id", id).single(),
        supabase
          .from("meal_foods")
          .select("meals(*)")
          .eq("food_id", id),
      ]);
      if (foodRes.error) { setError("Food not found."); return; }
      setFood(foodRes.data);
      setMeals(
        (mealsRes.data || [])
          .map((r) => r.meals)
          .filter((m) => m && m.is_public)
      );
    };
    load();
  }, [id]);

  if (error) return <div className="page"><p className="muted" style={{ marginTop: "2rem" }}>{error}</p></div>;
  if (!food)  return <div className="page"><p className="muted" style={{ marginTop: "2rem" }}>Loading...</p></div>;

  return (
    <div className="page">
      

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

      {/* ── Stages + Allergen side by side ── */}
      <div style={{ display: "grid", gridTemplateColumns: food.allergen_notes ? "1fr 300px" : "1fr", gap: 16, alignItems: "start", marginBottom: "1rem" }}>
        <ServingStages food={food} />
        {food.allergen_notes && (
          <div className="card card-allergen" style={{ position: "sticky", top: 90 }}>
            <h3 style={{ marginBottom: "0.5rem", color: "#c0392b", fontSize: "0.9rem" }}>{t("allergenNotes")}</h3>
            <p style={{ color: "#c0392b", margin: 0, fontSize: "0.82rem", lineHeight: 1.6 }}>{food.allergen_notes}</p>
          </div>
        )}
      </div>

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
