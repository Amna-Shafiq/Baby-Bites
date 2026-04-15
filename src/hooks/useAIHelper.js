import { useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { geminiModel } from "../lib/geminiClient";
import useActiveBaby from "./useActiveBaby";

const SYSTEM_INSTRUCTION = `You are a warm, helpful baby nutrition assistant for Pakistani parents. Answer using ONLY the provided database results — do not make up foods or meals not listed. Be concise, practical and culturally aware (Pakistani/South Asian context). If the question is in Urdu or mixed Urdu-English, respond in the same language. Always prioritise baby safety.

Return ONLY a valid JSON object with no markdown, no backticks, no explanation outside the JSON:
{
  "answer": "2-3 warm helpful sentences",
  "recommended_meal_ids": ["id1", "id2", "id3"],
  "recommended_food_ids": ["id1", "id2"],
  "safety_note": "string or null"
}`;

function extractKeywords(question) {
  const words = question
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  // If nothing survives the filter, use the whole trimmed question as one keyword
  return words.length > 0 ? words : [question.trim()];
}

async function fetchMeals(keywords, ageMonths) {
  try {
    const orFilter = keywords
      .map((kw) => `title.ilike.%${kw}%`)
      .join(",");

    let q = supabase
      .from("meals")
      .select("id, title, description, nutrition_highlight, min_age_months, max_age_months, meal_slot, meal_type, prep_time_minutes")
      .or(orFilter)
      .eq("is_public", true)
      .limit(10);

    if (ageMonths != null) {
      q = q.lte("min_age_months", ageMonths).gte("max_age_months", ageMonths);
    }

    const { data, error } = await q;
    if (error) {
      console.warn("Meals query error:", error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn("Meals fetch threw:", e);
    return [];
  }
}

async function fetchFoods(keywords, ageMonths) {
  try {
    const orFilter = keywords
      .map((kw) => `name.ilike.%${kw}%`)
      .join(",");

    let q = supabase
      .from("foods")
      .select("id, name, food_group, allergen_notes, texture_tips, safe_from_months, image_url")
      .or(orFilter)
      .limit(10);

    if (ageMonths != null) {
      q = q.lte("safe_from_months", ageMonths);
    }

    const { data, error } = await q;
    if (error) {
      console.warn("Foods query error:", error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn("Foods fetch threw:", e);
    return [];
  }
}

function useAIHelper() {
  const { activeBaby, activeBabyAgeMonths } = useActiveBaby();
  const [answer, setAnswer]                     = useState(null);
  const [recommendedMeals, setRecommendedMeals] = useState([]);
  const [recommendedFoods, setRecommendedFoods] = useState([]);
  const [safetyNote, setSafetyNote]             = useState(null);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState(null);

  const ask = useCallback(async (question) => {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    setRecommendedMeals([]);
    setRecommendedFoods([]);
    setSafetyNote(null);

    try {
      const keywords  = extractKeywords(question);
      const ageMonths = activeBabyAgeMonths;

      const [meals, foods] = await Promise.all([
        fetchMeals(keywords, ageMonths),
        fetchFoods(keywords, ageMonths),
      ]);

      const babyInfo = activeBaby
        ? `Baby name: ${activeBaby.name}, Age: ${ageMonths} months${activeBaby.dietary_flags?.length ? `, Dietary flags: ${activeBaby.dietary_flags.join(", ")}` : ""}`
        : "No baby profile set up yet — answer generally without age filtering.";

      const mealsText = meals.length
        ? meals.map((m) =>
            `- ID: ${m.id} | ${m.title} (${m.min_age_months}–${m.max_age_months}m, ${m.meal_slot}, ${m.meal_type})` +
            (m.description ? ` | ${m.description}` : "") +
            (m.nutrition_highlight ? ` | Nutrition: ${m.nutrition_highlight}` : "")
          ).join("\n")
        : "No matching meals found.";

      const foodsText = foods.length
        ? foods.map((f) =>
            `- ID: ${f.id} | ${f.name} (${f.food_group}, safe from ${f.safe_from_months}m)` +
            (f.allergen_notes ? ` | Allergen: ${f.allergen_notes}` : "") +
            (f.texture_tips ? ` | Texture: ${f.texture_tips}` : "")
          ).join("\n")
        : "No matching foods found.";

      const prompt = `${SYSTEM_INSTRUCTION}

--- Baby profile ---
${babyInfo}

--- Matching meals from database ---
${mealsText}

--- Matching foods from database ---
${foodsText}

--- Parent's question ---
${question}`;

      const result  = await geminiModel.generateContent(prompt);
      const raw     = result.response.text().trim();
      const jsonStr = raw
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

      const parsed = JSON.parse(jsonStr);

      const mealMap = Object.fromEntries(meals.map((m) => [m.id, m]));
      const foodMap = Object.fromEntries(foods.map((f) => [f.id, f]));

      setAnswer(parsed.answer || null);
      setRecommendedMeals((parsed.recommended_meal_ids || []).map((id) => mealMap[id]).filter(Boolean));
      setRecommendedFoods((parsed.recommended_food_ids || []).map((id) => foodMap[id]).filter(Boolean));
      setSafetyNote(parsed.safety_note || null);
    } catch (err) {
      console.error("AI helper error:", err);
      setError(`Something went wrong: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [activeBaby, activeBabyAgeMonths]);

  return { ask, answer, recommendedMeals, recommendedFoods, safetyNote, loading, error };
}

export default useAIHelper;
