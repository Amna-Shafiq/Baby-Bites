import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useLanguage } from "../contexts/LanguageContext";

import { supabase } from "../lib/supabaseClient";
import LogMealModal from "../components/LogMealModal";

function MealPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [meal, setMeal]           = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [copied, setCopied]       = useState(false);
  const [logOpen, setLogOpen]     = useState(false);
  const [logSaved, setLogSaved]   = useState(false);
  const [session, setSession]     = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  const handleLogSubmit = async (reaction, notes) => {
    if (!session || !meal) return;
    await supabase.from("feeding_logs").insert({
      user_id:   session.user.id,
      meal_id:   meal.id,
      item_name: meal.title,
      reaction,
      notes:     notes?.trim() || null,
      fed_at:    new Date().toISOString(),
    });
    setLogSaved(true);
    setTimeout(() => setLogSaved(false), 3000);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    const loadMeal = async () => {
      setLoading(true);

      const { data: mealData, error: mealError } = await supabase
        .from("meals").select("*").eq("id", id).single();

      if (mealError || !mealData) {
        setError("Meal not found.");
        setLoading(false);
        return;
      }
      setMeal(mealData);

      const { data: mfData } = await supabase
        .from("meal_foods")
        .select("quantity, foods(id, name, food_group, is_iron_rich, allergen_notes)")
        .eq("meal_id", id);

      setIngredients(mfData || []);
      setLoading(false);
    };
    loadMeal();
  }, [id]);

  if (loading) return <div className="page"><Helmet><title>Baby Bites</title></Helmet><p className="muted" style={{ marginTop: "2rem" }}>Loading...</p></div>;
  if (error || !meal) return (
    <div className="page">
      <Helmet><title>Meal Not Found | Baby Bites</title></Helmet>
      <p className="muted" style={{ marginTop: "2rem" }}>{error || "Meal not found."}</p>
      <button className="btn" onClick={() => navigate(-1)} style={{ marginTop: 12 }}>← Go Back</button>
    </div>
  );

  const steps = meal.steps
    ? meal.steps.split("\n").filter((s) => s.trim())
    : [];
  const hasAllergens = ingredients.some((i) => i.foods?.allergen_notes);

  return (
    <div className="page">
      <Helmet>
        <title>{meal.title} | Baby Bites</title>
        <meta name="description" content={`${meal.description ? meal.description.slice(0, 140) + "…" : `${meal.title} — a baby-friendly recipe for ${meal.min_age_months}–${meal.max_age_months} month olds. Ready in ${meal.prep_time_minutes} minutes.`}`} />
      </Helmet>

      {logOpen && meal && (
        <LogMealModal
          mealName={meal.title}
          onSubmit={handleLogSubmit}
          onClose={() => setLogOpen(false)}
        />
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1.5rem", gap: 8 }}>
        <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ paddingLeft: 0 }}>
          {t("back")}
        </button>
        <div style={{ display: "flex", gap: 8 }}>
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
          <button
            type="button"
            onClick={handleShare}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: copied ? "var(--cream)" : "none",
              border: "1.5px solid var(--border)", borderRadius: 10,
              padding: "6px 12px", cursor: "pointer",
              fontSize: "0.82rem", fontWeight: 700,
              color: copied ? "var(--orange-dark)" : "var(--muted)",
            }}
          >
            {copied ? "✓ Copied!" : "🔗 Share"}
          </button>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="meal-detail-header">
        <img
          src={meal.image_url || "https://res.cloudinary.com/dr0ixt3za/image/upload/v1776696906/Gemini_Generated_Image_y2myiqy2myiqy2my_sd3eov.png"}
          alt={meal.title}
          style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 16, display: "block" }}
        />
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            <span className="badge badge-slot">{meal.meal_slot}</span>
            <span className={`badge ${meal.meal_type === "quick" ? "badge-quick" : "badge-fancy"}`}>
              {meal.meal_type}
            </span>
          </div>
          <h1 style={{ marginBottom: 8 }}>{meal.title}</h1>
          <p className="muted" style={{ marginBottom: 10 }}>{meal.description}</p>
          <div style={{ display: "flex", gap: 16, fontSize: "0.88rem", color: "var(--muted)", flexWrap: "wrap" }}>
            <span>🕐 {meal.prep_time_minutes} min prep</span>
            <span>👶 {meal.min_age_months}–{meal.max_age_months} months</span>
          </div>
        </div>
      </div>

      {/* ── Nutrition highlight ── */}
      {meal.nutrition_highlight && (
        <div className="card card-nutrition">
          <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--green-dark)", fontWeight: 700 }}>
            ✓ {meal.nutrition_highlight}
          </p>
        </div>
      )}

      {/* ── Allergen warning ── */}
      {hasAllergens && (
        <div className="card card-allergen">
          <h3 style={{ marginBottom: 8, color: "#c0392b", fontSize: "0.95rem" }}>⚠️ Allergen notes</h3>
          {ingredients.filter((i) => i.foods?.allergen_notes).map((i, idx) => (
            <p key={idx} style={{ margin: "3px 0", fontSize: "0.85rem", color: "#c0392b" }}>
              <strong>{i.foods.name}:</strong> {i.foods.allergen_notes}
            </p>
          ))}
        </div>
      )}

      {/* ── Ingredients ── */}
      {ingredients.length > 0 && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h3 style={{ marginBottom: "0.75rem" }}>Ingredients</h3>
          {ingredients.map((item, idx) => (
            <div
              key={idx}
              className="ingredient-row"
              onClick={() => item.foods?.id && navigate(`/foods/${item.foods.id}`)}
              style={{ cursor: item.foods?.id ? "pointer" : undefined }}
            >
              <span style={{ color: item.foods?.id ? "var(--orange-dark)" : undefined, fontWeight: item.foods?.id ? 600 : undefined }}>
                {item.foods?.name}
              </span>
              <span className="muted">{item.quantity}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Steps ── */}
      {steps.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>How to make it</h3>
          {(() => {
            let stepCount = 0;
            return steps.map((step, idx) => {
              const isHeading =
                step.toLowerCase().includes("stovetop method") ||
                step.toLowerCase().includes("pressure cooker method") ||
                step.toLowerCase().includes("tawa method") ||
                step.toLowerCase().includes("oven method") ||
                step.toLowerCase().startsWith("spices used");

              if (isHeading) {
                const isSpiceNote = step.toLowerCase().startsWith("spices used");
                stepCount = 0;
                return (
                  <div key={idx} style={{
                    margin: "12px 0 8px",
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: isSpiceNote ? "#FFF8E1" : "#f5f5f5",
                    borderLeft: `3px solid ${isSpiceNote ? "#F5A623" : "#c4622a"}`,
                  }}>
                    <p style={{
                      fontWeight: 700, fontSize: 12,
                      color: isSpiceNote ? "#C4920A" : "#c4622a",
                      margin: 0,
                      textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>
                      {step.replace(":", "")}
                    </p>
                  </div>
                );
              }

              stepCount++;
              return (
                <div key={idx} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
                  <span style={{
                    minWidth: 24, height: 24, borderRadius: "50%",
                    background: "#f5f5f5", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#555",
                  }}>
                    {stepCount}
                  </span>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#444" }}>
                    {step.replace(/^\d+\.\s*/, "")}
                  </p>
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* ── More photos ── */}
      {Array.isArray(meal.extra_photos) && meal.extra_photos.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>More photos</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
            {meal.extra_photos.map((photo, idx) => (
              <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <img
                  src={photo.url}
                  alt={photo.caption || `Photo ${idx + 1}`}
                  onError={e => { e.target.src = "https://placehold.co/140x140?text=🍽"; }}
                  style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 10 }}
                />
                {photo.caption && (
                  <p style={{ margin: 0, fontSize: 12, color: "var(--muted)", textAlign: "center", lineHeight: 1.4 }}>
                    {photo.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Source reference ── */}
      {meal.source_url && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h3 style={{ marginBottom: "0.5rem", fontSize: "0.9rem" }}>Recipe source</h3>
          <a
            href={meal.source_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "0.82rem", color: "var(--orange-dark)", fontWeight: 700, wordBreak: "break-all" }}
          >
            {meal.source_url}
          </a>
        </div>
      )}
    </div>
  );
}

export default MealPage;
