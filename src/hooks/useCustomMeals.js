import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function useCustomMeals() {
  const [session, setSession] = useState(null);
  const [customMeals, setCustomMeals] = useState([]);
  const [householdFoods, setHouseholdFoods] = useState([]);
  const [mealSuggestions, setMealSuggestions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const userId = session?.user?.id;

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) setSession(session);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      active = false;
      data?.subscription?.unsubscribe?.();
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!supabase || !userId) {
      setCustomMeals([]);
      setHouseholdFoods([]);
      return;
    }

    setLoading(true);
    setError("");
    const [mealsRes, foodsRes] = await Promise.all([
      supabase.from("custom_meals").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("household_foods").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);

    if (mealsRes.error) setError(mealsRes.error.message);
    if (foodsRes.error) setError(foodsRes.error.message);

    setCustomMeals(mealsRes.data || []);
    setHouseholdFoods(foodsRes.data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recompute meal suggestions whenever pantry changes
  useEffect(() => {
    if (!supabase || !userId) { setMealSuggestions([]); return; }

    const pantryFoodIds = new Set(householdFoods.map((f) => f.food_id).filter(Boolean));
    if (pantryFoodIds.size === 0) { setMealSuggestions([]); return; }

    supabase
      .from("meals")
      .select("id, title, meal_slot, meal_type, min_age_months, max_age_months, prep_time_minutes, nutrition_highlight, meal_foods(food_id)")
      .eq("is_public", true)
      .then(({ data }) => {
        const suggestions = (data || []).filter(
          (meal) =>
            meal.meal_foods.length > 0 &&
            meal.meal_foods.every((mf) => pantryFoodIds.has(mf.food_id))
        );
        setMealSuggestions(suggestions);
      });
  }, [userId, householdFoods]);

  const addCustomMeal = useCallback(
    async (payload) => {
      if (!supabase || !userId) return { error: "Please login first." };

      const { error } = await supabase.from("custom_meals").insert({
        user_id: userId,
        title: payload.title,
        min_age_months: Number(payload.startingMonth),
        max_age_months: Math.max(Number(payload.startingMonth) + 12, 36),
        meal_slot: payload.mealSlot,
        ingredients: payload.ingredients,
        steps: payload.steps,
        nutrition_highlight: payload.nutritionHighlight,
        image_url: payload.imageUrl || null,
      });

      if (error) return { error: error.message };
      await loadData();
      return { error: null };
    },
    [loadData, userId]
  );

  const deleteCustomMeal = useCallback(
    async (id) => {
      if (!supabase || !userId) return { error: "Please login first." };
      const { error } = await supabase
        .from("custom_meals")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (error) return { error: error.message };
      await loadData();
      return { error: null };
    },
    [loadData, userId]
  );

  const addHouseholdFood = useCallback(
    async ({ name, food_id }) => {
      if (!supabase) return { error: "Supabase not configured." };
      if (!userId)   return { error: "Please log in to add foods to your pantry." };
      if (!name?.trim()) return { error: "Please select a food." };

      // Duplicate check: by food_id if available, otherwise by stem
      const stem = (s) => s.toLowerCase().replace(/es$/, "").replace(/s$/, "");
      const isDupe = food_id
        ? householdFoods.some((f) => f.food_id === food_id)
        : householdFoods.some((f) => stem(f.name) === stem(name));

      if (isDupe) return { error: null, duplicates: [name], added: 0 };

      const { error } = await supabase
        .from("household_foods")
        .insert({ user_id: userId, name: name.trim(), food_id: food_id || null });

      if (error) return { error: error.message };
      await loadData();
      return { error: null, duplicates: [], added: 1 };
    },
    [loadData, userId, householdFoods]
  );

  const removeHouseholdFood = useCallback(
    async (id) => {
      if (!supabase || !userId) return { error: "Please login first." };
      const { error } = await supabase
        .from("household_foods")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (error) return { error: error.message };
      await loadData();
      return { error: null };
    },
    [loadData, userId]
  );

  return {
    session,
    userId,
    loading,
    error,
    customMeals,
    householdFoods,
    mealSuggestions,
    addCustomMeal,
    deleteCustomMeal,
    addHouseholdFood,
    removeHouseholdFood,
    reloadCustomMeals: loadData,
  };
}

export default useCustomMeals;

