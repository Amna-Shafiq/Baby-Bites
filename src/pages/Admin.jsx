import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const FOOD_GROUPS = ["grain", "veggie", "fruit", "protein", "spice"];
const MEAL_SLOTS  = ["breakfast", "lunch", "dinner"];
const MEAL_TYPES  = ["quick", "fancy"];

const emptyFood = {
  name: "", safe_from_months: "6", is_iron_rich: false,
  food_group: "protein", allergen_notes: "", texture_tips: "",
  is_warning: false, search_aliases: "", image_url: "",
  tip_puree: "", tip_finger_food: "", tip_self_feeding: "", tip_family_meal: "",
};

const emptyMeal = {
  title: "", min_age_months: "6", max_age_months: "18",
  meal_slot: "lunch", meal_type: "quick", prep_time_minutes: "10",
  steps: "", nutrition_highlight: "", description: "", image_url: "",
};

function Admin() {
  const [tab, setTab] = useState("foods");

  // ── Foods state ──
  const [foods, setFoods]       = useState([]);
  const [food, setFood]         = useState(emptyFood);
  const [foodStatus, setFoodStatus] = useState("");
  const [foodSearch, setFoodSearch] = useState("");

  // ── Meals state ──
  const [meals, setMeals]       = useState([]);
  const [meal, setMeal]         = useState(emptyMeal);
  const [mealStatus, setMealStatus] = useState("");
  const [mealSearch, setMealSearch] = useState("");
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [foodQuery, setFoodQuery] = useState("");

  const loadFoods = useCallback(async () => {
    const { data } = await supabase.from("foods").select("*").order("name");
    setFoods(data || []);
  }, []);

  const loadMeals = useCallback(async () => {
    const { data } = await supabase
      .from("meals").select("*, meal_foods(food_id, foods(name))")
      .order("title");
    setMeals(data || []);
  }, []);

  useEffect(() => { loadFoods(); loadMeals(); }, [loadFoods, loadMeals]);

  // ── Food handlers ──
  const setF = (k, v) => setFood((f) => ({ ...f, [k]: v }));

  const submitFood = async (e) => {
    e.preventDefault();
    setFoodStatus("");
    const payload = {
      name:             food.name.trim(),
      safe_from_months: Number(food.safe_from_months),
      is_iron_rich:     food.is_iron_rich,
      food_group:       food.food_group,
      allergen_notes:   food.allergen_notes.trim() || null,
      texture_tips:     food.texture_tips.trim() || null,
      is_warning:       food.is_warning,
      search_aliases:   food.search_aliases.trim() || null,
      image_url:        food.image_url.trim() || null,
      tip_puree:        food.tip_puree.trim() || null,
      tip_finger_food:  food.tip_finger_food.trim() || null,
      tip_self_feeding: food.tip_self_feeding.trim() || null,
      tip_family_meal:  food.tip_family_meal.trim() || null,
    };
    const { error } = await supabase.from("foods").insert(payload);
    if (error) { setFoodStatus(`Error: ${error.message}`); return; }
    setFood(emptyFood);
    setFoodStatus("Food added!");
    loadFoods();
  };

  const deleteFood = async (id) => {
    if (!confirm("Delete this food?")) return;
    await supabase.from("foods").delete().eq("id", id);
    loadFoods();
  };

  // ── Meal handlers ──
  const setM = (k, v) => setMeal((m) => ({ ...m, [k]: v }));

  const toggleIngredient = (foodItem) => {
    setSelectedFoods((prev) =>
      prev.find((f) => f.id === foodItem.id)
        ? prev.filter((f) => f.id !== foodItem.id)
        : [...prev, foodItem]
    );
  };

  const submitMeal = async (e) => {
    e.preventDefault();
    setMealStatus("");
    const { data: inserted, error } = await supabase.from("meals").insert({
      title:             meal.title.trim(),
      min_age_months:    Number(meal.min_age_months),
      max_age_months:    Number(meal.max_age_months),
      meal_slot:         meal.meal_slot,
      meal_type:         meal.meal_type,
      prep_time_minutes: Number(meal.prep_time_minutes),
      steps:             meal.steps.trim(),
      nutrition_highlight: meal.nutrition_highlight.trim(),
      description:       meal.description.trim() || null,
      image_url:         meal.image_url.trim() || null,
      is_public:         true,
    }).select().single();

    if (error) { setMealStatus(`Error: ${error.message}`); return; }

    if (selectedFoods.length > 0) {
      await supabase.from("meal_foods").insert(
        selectedFoods.map((f) => ({ meal_id: inserted.id, food_id: f.id }))
      );
    }

    setMeal(emptyMeal);
    setSelectedFoods([]);
    setFoodQuery("");
    setMealStatus("Meal added!");
    loadMeals();
  };

  const deleteMeal = async (id) => {
    if (!confirm("Delete this meal?")) return;
    await supabase.from("meal_foods").delete().eq("meal_id", id);
    await supabase.from("meals").delete().eq("id", id);
    loadMeals();
  };

  const filteredFoods = foods.filter((f) =>
    f.name.toLowerCase().includes(foodSearch.toLowerCase())
  );

  const filteredMeals = meals.filter((m) =>
    m.title.toLowerCase().includes(mealSearch.toLowerCase())
  );

  const ingredientMatches = foods.filter((f) =>
    f.name.toLowerCase().includes(foodQuery.toLowerCase()) && foodQuery.length > 0
  );

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <span className="eyebrow eo" style={{ marginTop: "1.5rem", display: "block" }}>Admin</span>
      <h1>Content Manager</h1>

      <div className="tabs" style={{ marginBottom: "1.5rem" }}>
        <button className={tab === "foods" ? "btn btn-primary" : "btn"} onClick={() => setTab("foods")}>Foods</button>
        <button className={tab === "meals" ? "btn btn-primary" : "btn"} onClick={() => setTab("meals")}>Meals</button>
      </div>

      {/* ══════════════ FOODS TAB ══════════════ */}
      {tab === "foods" && (
        <>
          <section className="panel">
            <h2 style={{ marginBottom: "1rem" }}>Add Food</h2>
            {foodStatus && (
              <p style={{ fontSize: "0.85rem", fontWeight: 700, color: foodStatus.startsWith("Error") ? "#c0392b" : "var(--green-dark)", marginBottom: 8 }}>
                {foodStatus}
              </p>
            )}
            <form onSubmit={submitFood} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input className="input" placeholder="Name *" value={food.name} onChange={(e) => setF("name", e.target.value)} required />
              <input className="input" placeholder="Image URL (Cloudinary)" value={food.image_url} onChange={(e) => setF("image_url", e.target.value)} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Safe from (months) *</label>
                  <input className="input" type="number" min="0" max="36" value={food.safe_from_months} onChange={(e) => setF("safe_from_months", e.target.value)} required />
                </div>
                <div>
                  <label style={labelStyle}>Food group *</label>
                  <select className="input" value={food.food_group} onChange={(e) => setF("food_group", e.target.value)}>
                    {FOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <input className="input" placeholder="Search aliases (e.g. qeema, mince)" value={food.search_aliases} onChange={(e) => setF("search_aliases", e.target.value)} />
              <input className="input" placeholder="Allergen notes" value={food.allergen_notes} onChange={(e) => setF("allergen_notes", e.target.value)} />
              <textarea className="input" placeholder="Texture tips (legacy fallback)" value={food.texture_tips} onChange={(e) => setF("texture_tips", e.target.value)} rows={2} style={{ resize: "vertical" }} />

              <p style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", margin: "4px 0 0" }}>Serving stage tips (optional — shown on food detail page)</p>
              <textarea className="input" placeholder="🍼 Just Starting Solids (6m+) — puree & textured tips" value={food.tip_puree} onChange={(e) => setF("tip_puree", e.target.value)} rows={2} style={{ resize: "vertical" }} />
              <textarea className="input" placeholder="👅 Learning to Move Food (7–9m) — finger food tips" value={food.tip_finger_food} onChange={(e) => setF("tip_finger_food", e.target.value)} rows={2} style={{ resize: "vertical" }} />
              <textarea className="input" placeholder="🤲 Self-Feeding Stage (8–10m) — mixed texture tips" value={food.tip_self_feeding} onChange={(e) => setF("tip_self_feeding", e.target.value)} rows={2} style={{ resize: "vertical" }} />
              <textarea className="input" placeholder="🍽️ Eating with Family (12m+) — family meal tips" value={food.tip_family_meal} onChange={(e) => setF("tip_family_meal", e.target.value)} rows={2} style={{ resize: "vertical" }} />

              <div style={{ display: "flex", gap: 20, fontSize: "0.85rem", fontWeight: 700 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={food.is_iron_rich} onChange={(e) => setF("is_iron_rich", e.target.checked)} />
                  Iron rich
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={food.is_warning} onChange={(e) => setF("is_warning", e.target.checked)} />
                  Show age warning
                </label>
              </div>

              <button type="submit" className="btn btn-primary">Add Food</button>
            </form>
          </section>

          <section className="panel">
            <h2 style={{ marginBottom: "0.75rem" }}>All Foods ({foods.length})</h2>
            <input className="input" placeholder="Search foods…" value={foodSearch} onChange={(e) => setFoodSearch(e.target.value)} style={{ marginBottom: 12 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filteredFoods.map((f) => (
                <div key={f.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "8px 12px" }}>
                  <div>
                    <strong style={{ fontSize: "0.9rem" }}>{f.name}</strong>
                    <span className="muted" style={{ fontSize: "0.75rem", marginLeft: 8 }}>{f.food_group} · {f.safe_from_months}m+</span>
                    {f.is_iron_rich && <span style={{ marginLeft: 6, fontSize: "0.7rem", color: "var(--green-dark)", fontWeight: 700 }}>⚡ iron</span>}
                  </div>
                  <button type="button" onClick={() => deleteFood(f.id)} style={deleteBtnStyle}>✕</button>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ══════════════ MEALS TAB ══════════════ */}
      {tab === "meals" && (
        <>
          <section className="panel">
            <h2 style={{ marginBottom: "1rem" }}>Add Meal</h2>
            {mealStatus && (
              <p style={{ fontSize: "0.85rem", fontWeight: 700, color: mealStatus.startsWith("Error") ? "#c0392b" : "var(--green-dark)", marginBottom: 8 }}>
                {mealStatus}
              </p>
            )}
            <form onSubmit={submitMeal} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input className="input" placeholder="Title *" value={meal.title} onChange={(e) => setM("title", e.target.value)} required />
              <input className="input" placeholder="Image URL (Cloudinary)" value={meal.image_url} onChange={(e) => setM("image_url", e.target.value)} />
              <textarea className="input" placeholder="Description (optional)" value={meal.description} onChange={(e) => setM("description", e.target.value)} rows={2} style={{ resize: "vertical" }} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Min age (months) *</label>
                  <input className="input" type="number" min="0" value={meal.min_age_months} onChange={(e) => setM("min_age_months", e.target.value)} required />
                </div>
                <div>
                  <label style={labelStyle}>Max age (months) *</label>
                  <input className="input" type="number" min="0" value={meal.max_age_months} onChange={(e) => setM("max_age_months", e.target.value)} required />
                </div>
                <div>
                  <label style={labelStyle}>Prep time (min)</label>
                  <input className="input" type="number" min="0" value={meal.prep_time_minutes} onChange={(e) => setM("prep_time_minutes", e.target.value)} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Meal slot *</label>
                  <select className="input" value={meal.meal_slot} onChange={(e) => setM("meal_slot", e.target.value)}>
                    {MEAL_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Meal type *</label>
                  <select className="input" value={meal.meal_type} onChange={(e) => setM("meal_type", e.target.value)}>
                    {MEAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <input className="input" placeholder="Nutrition highlight (e.g. Iron-rich + protein)" value={meal.nutrition_highlight} onChange={(e) => setM("nutrition_highlight", e.target.value)} />
              <textarea className="input" placeholder={"Steps (one per line)\n1. Step one\n2. Step two"} value={meal.steps} onChange={(e) => setM("steps", e.target.value)} rows={4} style={{ resize: "vertical" }} />

              {/* Ingredient picker */}
              <div>
                <label style={labelStyle}>Ingredients</label>
                {selectedFoods.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {selectedFoods.map((f) => (
                      <span key={f.id} onClick={() => toggleIngredient(f)} style={{
                        background: "var(--orange-light, #fff3ea)", border: "1.5px solid var(--orange-dark)",
                        borderRadius: 20, padding: "3px 10px", fontSize: "0.78rem", fontWeight: 700,
                        color: "var(--orange-dark)", cursor: "pointer",
                      }}>
                        {f.name} ✕
                      </span>
                    ))}
                  </div>
                )}
                <input
                  className="input"
                  placeholder="Search foods to add as ingredients…"
                  value={foodQuery}
                  onChange={(e) => setFoodQuery(e.target.value)}
                />
                {ingredientMatches.length > 0 && (
                  <div style={{ border: "1px solid var(--border)", borderRadius: 10, marginTop: 4, overflow: "hidden", maxHeight: 180, overflowY: "auto" }}>
                    {ingredientMatches.map((f) => {
                      const selected = !!selectedFoods.find((s) => s.id === f.id);
                      return (
                        <div
                          key={f.id}
                          onClick={() => { toggleIngredient(f); setFoodQuery(""); }}
                          style={{
                            padding: "8px 12px", cursor: "pointer", fontSize: "0.85rem",
                            background: selected ? "var(--cream)" : "#fff",
                            fontWeight: selected ? 700 : 400,
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          {selected ? "✓ " : ""}{f.name} <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>· {f.food_group}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary">Add Meal</button>
            </form>
          </section>

          <section className="panel">
            <h2 style={{ marginBottom: "0.75rem" }}>All Meals ({meals.length})</h2>
            <input className="input" placeholder="Search meals…" value={mealSearch} onChange={(e) => setMealSearch(e.target.value)} style={{ marginBottom: 12 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filteredMeals.map((m) => (
                <div key={m.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, padding: "8px 12px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: "0.9rem" }}>{m.title}</strong>
                    <span className="muted" style={{ fontSize: "0.75rem", marginLeft: 8 }}>{m.meal_slot} · {m.min_age_months}–{m.max_age_months}m</span>
                    {m.meal_foods?.length > 0 && (
                      <p className="muted" style={{ margin: "3px 0 0", fontSize: "0.72rem" }}>
                        {m.meal_foods.map((mf) => mf.foods?.name).filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  <button type="button" onClick={() => deleteMeal(m.id)} style={deleteBtnStyle}>✕</button>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

const labelStyle = { fontSize: "0.73rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 };
const deleteBtnStyle = { background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "0.95rem", padding: 4, flexShrink: 0 };

export default Admin;
