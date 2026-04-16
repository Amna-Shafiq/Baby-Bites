import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TopNav from "../components/TopNav";
import { supabase } from "../lib/supabaseClient";
import { useLanguage } from "../contexts/LanguageContext";

function CustomMealPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const fileRef = useRef(null);

  const [meal, setMeal]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [uploading, setUploading] = useState(false);
  const [session, setSession]   = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("custom_meals")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) { setError("Meal not found."); setLoading(false); return; }
      setMeal(data);
      setLoading(false);
    };
    load();
  }, [id]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${session.user.id}/${id}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("meal-images")
      .upload(path, file, { upsert: true });

    if (upErr) {
      console.error("Upload error:", upErr.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("meal-images")
      .getPublicUrl(path);

    await supabase.from("custom_meals").update({ image_url: publicUrl }).eq("id", id);
    setMeal((m) => ({ ...m, image_url: publicUrl }));
    setUploading(false);
  };

  if (loading) return <div className="page"><TopNav /><p className="muted" style={{ marginTop: "2rem" }}>{t("loading")}</p></div>;
  if (error || !meal) return (
    <div className="page">
      <TopNav />
      <p className="muted" style={{ marginTop: "2rem" }}>{error || "Meal not found."}</p>
      <button className="btn" onClick={() => navigate(-1)} style={{ marginTop: 12 }}>← Go Back</button>
    </div>
  );

  const steps = meal.steps
    ? meal.steps.replace(/\\n/g, "\n").split("\n").filter((s) => s.trim())
    : [];
  const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];

  return (
    <div className="page">
      <TopNav />

      <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginTop: "1.5rem", paddingLeft: 0 }}>
        {t("back")}
      </button>

      {/* ── Photo ── */}
      <div
        onClick={() => fileRef.current?.click()}
        style={{
          margin: "1rem 0",
          width: "100%",
          height: 220,
          borderRadius: 18,
          border: meal.image_url ? "none" : "2px dashed var(--border)",
          overflow: "hidden",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: meal.image_url ? "none" : "var(--cream)",
          position: "relative",
        }}
      >
        {meal.image_url ? (
          <img
            src={meal.image_url}
            alt={meal.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ textAlign: "center", color: "var(--muted)", pointerEvents: "none" }}>
            <p style={{ fontSize: "2.5rem", margin: 0 }}>📷</p>
            <p style={{ margin: "6px 0 0", fontSize: "0.85rem", fontWeight: 700 }}>
              {uploading ? "Uploading..." : "Add a photo"}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "0.75rem" }}>Tap to choose from your camera roll</p>
          </div>
        )}
        {meal.image_url && (
          <div style={{
            position: "absolute", bottom: 10, right: 10,
            background: "rgba(0,0,0,0.55)", color: "#fff",
            borderRadius: 8, padding: "5px 12px",
            fontSize: "0.78rem", fontWeight: 700,
          }}>
            {uploading ? "Uploading..." : "📷 Change photo"}
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />

      {/* ── Header ── */}
      <div style={{ margin: "0.5rem 0 1.5rem" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          <span className="badge badge-slot">{meal.meal_slot}</span>
          <span className="badge badge-quick">Custom</span>
        </div>
        <h1 style={{ marginBottom: 8 }}>{meal.title}</h1>
        <p className="muted" style={{ fontSize: "0.88rem" }}>
          👶 {meal.min_age_months}–{meal.max_age_months} months
        </p>
      </div>

      {/* ── Nutrition ── */}
      {meal.nutrition_highlight && (
        <div className="card card-nutrition" style={{ marginBottom: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--green-dark)", fontWeight: 700 }}>
            ✓ {meal.nutrition_highlight}
          </p>
        </div>
      )}

      {/* ── Ingredients ── */}
      {ingredients.length > 0 && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h3 style={{ marginBottom: "0.75rem" }}>Ingredients</h3>
          {ingredients.map((item, idx) => (
            <div key={idx} className="ingredient-row">
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Steps ── */}
      {steps.length > 0 && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>How to make it</h3>
          {steps.map((step, idx) => (
            <div key={idx} className="step-item">
              <span className="step-num">{idx + 1}</span>
              <p className="step-text">{step.replace(/^\d+\.\s*/, "")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomMealPage;
