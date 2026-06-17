import { useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { mealSlug } from "../lib/mealSlug";
import { supabase } from "../lib/supabaseClient";

import useCustomMeals from "../hooks/useCustomMeals";
import useFavorites from "../hooks/useFavorites";
import { useLanguage } from "../contexts/LanguageContext";
import useFeedingLog, { REACTION_EMOJI, REACTION_LABEL } from "../hooks/useFeedingLog";

const FREE_MEAL_LIMIT = 5;

const SLOT_COLORS = {
  breakfast: { bg: "var(--yellow)", color: "var(--yellow-dark)" },
  lunch:     { bg: "var(--green)",  color: "var(--green-dark)"  },
  dinner:    { bg: "var(--blue)",   color: "var(--blue-dark)"   },
  snack:     { bg: "var(--orange)", color: "var(--orange-dark)" },
};

function MealBoxCard({ meal, onDelete, linkTo }) {
  const slot = SLOT_COLORS[meal.meal_slot] || SLOT_COLORS.lunch;
  return (
    <Link to={linkTo} style={{ textDecoration: "none", color: "inherit" }}>
      <div style={{
        background: "var(--card-bg, #fff)",
        borderRadius: 14,
        border: "1.5px solid var(--border)",
        borderTop: "3px solid var(--green-mid)",
        overflow: "hidden",
        position: "relative",
        cursor: "pointer",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(45,36,22,0.1)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
      >
        {meal.image_url ? (
          <img src={meal.image_url} alt={meal.title} style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: 90, background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>
            🍽️
          </div>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(meal.id); }}
            title="Delete meal"
            style={{
              position: "absolute", top: 6, right: 6,
              background: "rgba(255,255,255,0.88)", backdropFilter: "blur(4px)",
              border: "none", cursor: "pointer", color: "var(--muted)",
              fontSize: "0.7rem", width: 22, height: 22, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, lineHeight: 1,
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#c0392b"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--muted)"}
          >
            ✕
          </button>
        )}
        <div style={{ padding: "8px 10px 10px" }}>
          <p style={{ margin: "0 0 5px", fontSize: "0.82rem", fontWeight: 700, color: "var(--dark)", lineHeight: 1.3,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {meal.title}
          </p>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {meal.meal_slot && (
              <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 7px", borderRadius: 8, background: slot.bg, color: slot.color }}>
                {meal.meal_slot}
              </span>
            )}
            <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 7px", borderRadius: 8, background: "var(--cream)", color: "var(--muted)" }}>
              {meal.min_age_months}m+
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function FavBoxCard({ meal, onUnfav }) {
  const slot = SLOT_COLORS[meal.meal_slot] || SLOT_COLORS.lunch;
  return (
    <Link to={`/meal/${mealSlug(meal)}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div style={{
        background: "var(--card-bg, #fff)",
        borderRadius: 14,
        border: "1.5px solid var(--border)",
        borderTop: "3px solid #e74c3c",
        overflow: "hidden",
        position: "relative",
        cursor: "pointer",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(45,36,22,0.1)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
      >
        {meal.image_url ? (
          <img src={meal.image_url} alt={meal.title} style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: 90, background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>
            🍽️
          </div>
        )}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUnfav(meal.id); }}
          title="Remove from favourites"
          style={{
            position: "absolute", top: 6, right: 6,
            background: "rgba(255,255,255,0.88)", backdropFilter: "blur(4px)",
            border: "none", cursor: "pointer", color: "#e74c3c",
            fontSize: "0.75rem", width: 22, height: 22, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            lineHeight: 1,
          }}
        >
          ♥
        </button>
        <div style={{ padding: "8px 10px 10px" }}>
          <p style={{ margin: "0 0 5px", fontSize: "0.82rem", fontWeight: 700, color: "var(--dark)", lineHeight: 1.3,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {meal.title}
          </p>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {meal.meal_slot && (
              <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 7px", borderRadius: 8, background: slot.bg, color: slot.color }}>
                {meal.meal_slot}
              </span>
            )}
            <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 7px", borderRadius: 8, background: "var(--cream)", color: "var(--muted)" }}>
              {meal.min_age_months}m+
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ProUpgradeCard({ used, limit }) {
  return (
    <div style={{
      border: "2px dashed var(--border)",
      borderRadius: 16,
      padding: "1.5rem",
      textAlign: "center",
      background: "var(--cream)",
    }}>
      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔒</div>
      <p style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--dark)", margin: "0 0 4px" }}>
        You have used all {limit} free recipe slots
      </p>
      <p style={{ fontSize: "0.82rem", color: "var(--muted)", margin: "0 0 1.1rem", lineHeight: 1.6 }}>
        Upgrade to Baby Bites Pro to unlock unlimited custom recipes and more.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, textAlign: "left", marginBottom: "1.2rem" }}>
        {[
          "Unlimited custom recipes",
          "AI meal suggestions (coming soon)",
          "Weekly meal schedule planner",
          "Export shopping list as PDF",
          "Allergy-safe ingredient swaps",
        ].map((f) => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--green-dark)", fontWeight: 800, fontSize: "0.8rem" }}>✓</span>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--dark)" }}>{f}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => alert("Pro plan coming soon! We will notify you when it launches.")}
        style={{
          background: "var(--orange-dark)", color: "#fff", border: "none",
          borderRadius: 100, padding: "0.6rem 1.5rem",
          fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", width: "100%",
        }}
      >
        Upgrade to Pro
      </button>
    </div>
  );
}

// ── Feeding Log helpers ───────────────────────────────────────────────────

function getRangeBounds(range) {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = today.getDay(); // 0 = Sunday
  const sinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  if (range === "this_week") {
    const monday = new Date(today);
    monday.setDate(today.getDate() - sinceMonday);
    return { from: monday, to: null };
  }
  if (range === "last_week") {
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - sinceMonday);
    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(thisMonday.getDate() - 7);
    return { from: lastMonday, to: thisMonday };
  }
  if (range === "this_month") {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: null };
  }
  return { from: null, to: null };
}

function formatDayLabel(date) {
  const now       = new Date();
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(date, today))     return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

const RANGE_TABS = [
  { key: "this_week",  label: "This week"  },
  { key: "last_week",  label: "Last week"  },
  { key: "this_month", label: "This month" },
  { key: "all",        label: "All time"   },
];
const TYPE_TABS = [
  { key: "all",   label: "All"   },
  { key: "meals", label: "Meals" },
  { key: "foods", label: "Foods" },
];

function FeedingLogSection({ logs, deleteLog, logRange, setLogRange, logType, setLogType }) {
  const { from, to } = getRangeBounds(logRange);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const d = new Date(l.fed_at);
      if (from && d < from) return false;
      if (to   && d >= to)  return false;
      if (logType === "meals" &&  l.food_id) return false;
      if (logType === "foods" && !l.food_id) return false;
      return true;
    });
  }, [logs, logRange, logType, from, to]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((l) => {
      const d   = new Date(l.fed_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = { date: d, entries: [] };
      map[key].entries.push(l);
    });
    return Object.values(map).sort((a, b) => b.date - a.date);
  }, [filtered]);

  const mealCount = filtered.filter((l) => !l.food_id).length;
  const foodCount = filtered.filter((l) =>  l.food_id).length;

  const PillBtn = ({ active, onClick, children }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "4px 12px", borderRadius: 100,
        fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", border: "none",
        background: active ? "var(--orange-dark)" : "var(--cream)",
        color: active ? "#fff" : "var(--muted)",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );

  return (
    <section className="panel">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
        <h2 style={{ margin: 0 }}>Feeding Log</h2>
        {filtered.length > 0 && (
          <span style={{
            background: "var(--orange)", color: "var(--orange-dark)",
            fontSize: "0.7rem", fontWeight: 800, padding: "3px 10px", borderRadius: 20,
          }}>
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          </span>
        )}
      </div>
      <p className="muted" style={{ fontSize: "0.8rem", marginBottom: "1rem" }}>
        Open any meal or food and tap "Log as fed".
      </p>

      {/* Time range tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "0.6rem" }}>
        {RANGE_TABS.map((t) => (
          <PillBtn key={t.key} active={logRange === t.key} onClick={() => setLogRange(t.key)}>
            {t.label}
          </PillBtn>
        ))}
      </div>

      {/* Type filter + stats */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: "1.1rem" }}>
        <div style={{ display: "flex", gap: 5 }}>
          {TYPE_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setLogType(t.key)}
              style={{
                padding: "3px 11px", borderRadius: 8,
                fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                border: `1.5px solid ${logType === t.key ? "var(--orange-dark)" : "var(--border)"}`,
                background: logType === t.key ? "var(--orange)" : "transparent",
                color: logType === t.key ? "var(--orange-dark)" : "var(--muted)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        {filtered.length > 0 && (
          <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--muted)", fontWeight: 600 }}>
            {mealCount > 0 && `${mealCount} meal${mealCount !== 1 ? "s" : ""}`}
            {mealCount > 0 && foodCount > 0 && " · "}
            {foodCount > 0 && `${foodCount} food${foodCount !== 1 ? "s" : ""} tried`}
          </p>
        )}
      </div>

      {/* Grouped entries */}
      {logs.length === 0 ? (
        <p className="muted" style={{ fontSize: "0.82rem" }}>No entries yet. Open a meal or food page to log what baby ate.</p>
      ) : filtered.length === 0 ? (
        <p className="muted" style={{ fontSize: "0.82rem" }}>No entries for this period.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {grouped.map((group) => (
            <div key={group.date.toISOString()}>
              {/* Day label */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.5rem" }}>
                <span style={{
                  fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: "var(--orange-dark)",
                  background: "var(--orange)", padding: "2px 9px", borderRadius: 20,
                  flexShrink: 0,
                }}>
                  {formatDayLabel(group.date)}
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span style={{ fontSize: "0.65rem", color: "var(--muted)", fontWeight: 600, flexShrink: 0 }}>
                  {group.date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>

              {/* Entries for this day */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {group.entries.map((log) => {
                  const isMeal = !log.food_id;
                  return (
                    <div key={log.id} style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "10px 12px",
                      background: "var(--cream)", borderRadius: 10,
                      border: "1px solid var(--border)",
                    }}>
                      {/* Reaction */}
                      <span style={{ fontSize: "1.25rem", flexShrink: 0, lineHeight: 1.2 }}>
                        {REACTION_EMOJI[log.reaction]}
                      </span>

                      {/* Main content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--dark)", lineHeight: 1.3 }}>
                            {log.item_name}
                          </span>
                          <span style={{
                            fontSize: "0.58rem", fontWeight: 800, padding: "1px 7px",
                            borderRadius: 20, flexShrink: 0,
                            background: isMeal ? "var(--orange)" : "var(--blue)",
                            color:      isMeal ? "var(--orange-dark)" : "var(--blue-dark)",
                          }}>
                            {isMeal ? "Meal" : "Food"}
                          </span>
                        </div>
                        {log.notes && (
                          <p className="muted" style={{ margin: "3px 0 0", fontSize: "0.75rem", lineHeight: 1.4 }}>
                            {log.notes}
                          </p>
                        )}
                        <p style={{ margin: "3px 0 0", fontSize: "0.68rem", color: "var(--muted)", fontWeight: 600 }}>
                          {REACTION_LABEL[log.reaction]} · {formatTime(log.fed_at)}
                        </p>
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => deleteLog(log.id)}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: "var(--muted)", fontSize: "0.7rem",
                          padding: "2px 4px", flexShrink: 0, lineHeight: 1,
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = "#c0392b"}
                        onMouseLeave={e => e.currentTarget.style.color = "var(--muted)"}
                      >✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function MyMeals() {
  const { t } = useLanguage();
  const { session, userId, customMeals, addCustomMeal, deleteCustomMeal, error, loading } = useCustomMeals();
  const { favoriteMeals, toggleFavorite } = useFavorites();
  const { logs, deleteLog } = useFeedingLog(userId);
  const [logRange, setLogRange] = useState("this_week");
  const [logType,  setLogType]  = useState("all");

  const [title, setTitle]                     = useState("");
  const [startingMonth, setStartingMonth]     = useState("6");
  const [mealSlot, setMealSlot]               = useState("lunch");
  const [ingredientsText, setIngredientsText] = useState("");
  const [steps, setSteps]                     = useState("");
  const [nutritionHighlight, setNutritionHighlight] = useState("");
  const [status, setStatus]                   = useState("");
  const [imageFile, setImageFile]             = useState(null);
  const [imagePreview, setImagePreview]       = useState(null);
  const [uploading, setUploading]             = useState(false);
  const fileRef                               = useRef(null);

  const atLimit = customMeals.length >= FREE_MEAL_LIMIT;

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const submitMeal = async (e) => {
    e.preventDefault();
    if (atLimit) return;
    setStatus("");
    setUploading(true);

    let imageUrl = null;
    if (imageFile && session) {
      const ext = imageFile.name.split(".").pop();
      const path = `${session.user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("meal-images").upload(path, imageFile, { upsert: true });
      if (upErr) {
        setStatus(`Photo upload failed: ${upErr.message}`);
        setUploading(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from("meal-images").getPublicUrl(path);
      imageUrl = publicUrl;
    }

    const result = await addCustomMeal({
      title, startingMonth, mealSlot,
      ingredients: ingredientsText.split(",").map((s) => s.trim()).filter(Boolean),
      steps, nutritionHighlight, imageUrl,
    });
    setUploading(false);
    if (result.error) { setStatus(result.error); return; }
    setTitle(""); setIngredientsText(""); setSteps(""); setNutritionHighlight("");
    setImageFile(null); setImagePreview(null);
    setStatus(t("mealAdded"));
  };

  return (
    <div className="page">
      <span className="eyebrow eo" style={{ marginTop: "1.5rem", display: "block" }}>{t("recipesEyebrow")}</span>
      <h1>{t("myMealsTitle")}</h1>

      {error  && <p className="muted">{error}</p>}
      {status && <p style={{ fontSize: "0.88rem", color: "var(--muted)", fontWeight: 600 }}>{status}</p>}

      {/* ── Add custom meal ── */}
      <section className="panel">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0 }}>{t("addCustomMealTitle")}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: atLimit ? "#c0392b" : "var(--muted)" }}>
              {customMeals.length}/{FREE_MEAL_LIMIT} used
            </span>
            <div style={{ width: 56, height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${(customMeals.length / FREE_MEAL_LIMIT) * 100}%`,
                background: atLimit ? "#c0392b" : "var(--orange-dark)",
                borderRadius: 3,
                transition: "width 0.3s",
              }} />
            </div>
          </div>
        </div>

        {atLimit ? (
          <ProUpgradeCard used={customMeals.length} limit={FREE_MEAL_LIMIT} />
        ) : (
          <form onSubmit={submitMeal} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Image picker */}
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: "100%", height: 120, borderRadius: 12, cursor: "pointer",
                border: imagePreview ? "none" : "2px dashed var(--border)",
                background: imagePreview ? "none" : "var(--cream)",
                overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
              }}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <span style={{ position: "absolute", bottom: 6, right: 8, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: "0.72rem", fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>
                    📷 Change
                  </span>
                </>
              ) : (
                <div style={{ textAlign: "center", color: "var(--muted)" }}>
                  <p style={{ margin: 0, fontSize: "1.5rem" }}>📷</p>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8rem", fontWeight: 700 }}>Add photo (optional)</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImagePick} />

            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("mealTitlePlaceholder")} required />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Starting month</label>
                <input className="input" type="number" min="0" max="36" value={startingMonth} onChange={(e) => setStartingMonth(e.target.value)} placeholder="e.g. 6" required />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Meal slot</label>
                <select className="input" value={mealSlot} onChange={(e) => setMealSlot(e.target.value)}>
                  <option value="breakfast">{t("slotBreakfast")}</option>
                  <option value="lunch">{t("slotLunch")}</option>
                  <option value="dinner">{t("slotDinner")}</option>
                </select>
              </div>
            </div>

            <input className="input" value={ingredientsText} onChange={(e) => setIngredientsText(e.target.value)} placeholder={t("ingredientsPlaceholder")} />
            <textarea className="input" value={steps} onChange={(e) => setSteps(e.target.value)} placeholder={t("stepsPlaceholder")} rows={3} style={{ resize: "vertical" }} />
            <input className="input" value={nutritionHighlight} onChange={(e) => setNutritionHighlight(e.target.value)} placeholder={t("nutritionPlaceholder")} />

            <button type="submit" className="btn btn-primary" disabled={!session || loading || uploading}>
              {uploading ? "Saving…" : t("saveMeal")}
            </button>
          </form>
        )}
      </section>

      {/* ── Your added meals ── */}
      <section className="panel">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
          <h2 style={{ margin: 0 }}>{t("yourMealsTitle")}</h2>
          {customMeals.length > 0 && (
            <span style={{
              background: "var(--green)", color: "var(--green-dark)",
              fontSize: "0.65rem", fontWeight: 800, padding: "2px 8px", borderRadius: 8,
            }}>
              {customMeals.length}
            </span>
          )}
        </div>

        {customMeals.length === 0 ? (
          <div>
            <p className="muted" style={{ marginBottom: "0.75rem" }}>{t("noCustomMeals")}</p>
            <button
              type="button"
              onClick={() => {
                setTitle("Banana Oatmeal Mash");
                setStartingMonth("6");
                setMealSlot("breakfast");
                setIngredientsText("Banana, Oatmeal, Breast milk or formula");
                setSteps("1. Cook oatmeal according to package instructions.\n2. Mash a ripe banana with a fork until smooth.\n3. Mix mashed banana into warm oatmeal.\n4. Add a splash of breast milk or formula to reach desired consistency.");
                setNutritionHighlight("Iron-rich oats + natural banana sweetness");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              style={{
                background: "var(--cream)", border: "1.5px solid var(--border)",
                borderRadius: 12, padding: "8px 16px",
                fontSize: "0.85rem", fontWeight: 700, color: "var(--orange-dark)", cursor: "pointer",
              }}
            >
              Try a sample recipe →
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
            {customMeals.map((meal) => (
              <MealBoxCard
                key={meal.id}
                meal={meal}
                linkTo={`/my-meals/${meal.id}`}
                onDelete={deleteCustomMeal}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Favourites ── */}
      <section className="panel">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
          <h2 style={{ margin: 0 }}>{t("savedFavsTitle")}</h2>
          {favoriteMeals.length > 0 && (
            <span style={{
              background: "#fde8e8", color: "#c0392b",
              fontSize: "0.65rem", fontWeight: 800, padding: "2px 8px", borderRadius: 8,
            }}>
              {favoriteMeals.length}
            </span>
          )}
        </div>
        <p className="muted" style={{ fontSize: "0.9rem", marginBottom: "1.2rem", lineHeight: 1.6 }}>
          {t("savedFavsDesc")}
        </p>
        {favoriteMeals.length === 0 ? (
          <p className="muted">{t("noFavsMyMeals")}</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
            {favoriteMeals.map((meal) => (
              <FavBoxCard key={meal.id} meal={meal} onUnfav={toggleFavorite} />
            ))}
          </div>
        )}
      </section>

      {/* ── Feeding Log ── */}
      <FeedingLogSection logs={logs} deleteLog={deleteLog} logRange={logRange} setLogRange={setLogRange} logType={logType} setLogType={setLogType} />

      <div style={{ marginBottom: "2rem" }}>
        <Link to="/pantry" style={{ fontSize: "0.88rem", color: "var(--muted)", textDecoration: "underline" }}>
          {t("backToPantry")}
        </Link>
      </div>
    </div>
  );
}

export default MyMeals;
