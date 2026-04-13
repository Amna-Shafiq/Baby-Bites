import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function useCustomMeals() {
  const [session, setSession] = useState(null);
  const [customMeals, setCustomMeals] = useState([]);
  const [householdFoods, setHouseholdFoods] = useState([]);
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

  const addCustomMeal = useCallback(
    async (payload) => {
      if (!supabase || !userId) return { error: "Please login first." };

      const { error } = await supabase.from("custom_meals").insert({
        user_id: userId,
        title: payload.title,
        min_age_months: Number(payload.minAgeMonths),
        max_age_months: Number(payload.maxAgeMonths),
        meal_slot: payload.mealSlot,
        ingredients: payload.ingredients,
        steps: payload.steps,
        nutrition_highlight: payload.nutritionHighlight,
      });

      if (error) return { error: error.message };
      await loadData();
      return { error: null };
    },
    [loadData, userId]
  );

  const addHouseholdFood = useCallback(
    async (name) => {
      if (!supabase || !userId || !name?.trim()) return { error: "Invalid household food." };
      const { error } = await supabase.from("household_foods").insert({
        user_id: userId,
        name: name.trim(),
      });
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
    addCustomMeal,
    addHouseholdFood,
    reloadCustomMeals: loadData,
  };
}

export default useCustomMeals;

