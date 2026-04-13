import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { mergeMealSources } from "../lib/mealSources";

const SLOTS = ["breakfast", "lunch", "dinner"];

function randomPick(items, avoidTitles = new Set()) {
  const filtered = items.filter((item) => !avoidTitles.has(item.title));
  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function useDailyMeals(customMeals = [], selectedAgeMonths = null) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dailyPlan, setDailyPlan] = useState({
    breakfast: null,
    lunch: null,
    dinner: null,
  });
  const [error, setError] = useState("");

  const userId = session?.user?.id;
  const allMeals = useMemo(() => mergeMealSources(customMeals), [customMeals]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) setSession(session);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => {
      active = false;
      data?.subscription?.unsubscribe?.();
    };
  }, []);

  const loadProfileAndLogs = useCallback(async () => {
    if (!supabase || !userId) {
      setLoading(false);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const ymd = yesterday.toISOString().slice(0, 10);

      const [profileRes, logsRes] = await Promise.all([
        // maybeSingle avoids "Cannot coerce the result to a single JSON object"
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("meal_logs").select("*").eq("user_id", userId).eq("meal_date", ymd),
      ]);

      if (profileRes.error || logsRes.error) {
        throw profileRes.error || logsRes.error;
      }

      setProfile(profileRes.data || null);
      setLogs(logsRes.data || []);
    } catch {
      setError("Couldn't load meals. Try refreshing!");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfileAndLogs();
  }, [loadProfileAndLogs]);

  const generateSuggestions = useCallback(() => {
    const age = Number(selectedAgeMonths ?? profile?.baby_age_months ?? 6);
    const yesterdayTitles = new Set((logs || []).map((log) => log.meal_title));
    const pickedTitles = new Set();

    const ageValid = allMeals.filter((m) => age >= m.minAgeMonths && age <= m.maxAgeMonths);

    const nextPlan = { breakfast: null, lunch: null, dinner: null };

    SLOTS.forEach((slot) => {
      const bySlot = ageValid.filter((meal) => meal.mealSlot === slot);
      const picked =
        randomPick(bySlot, new Set([...yesterdayTitles, ...pickedTitles])) ||
        randomPick(ageValid, new Set([...yesterdayTitles, ...pickedTitles])) ||
        randomPick(allMeals, new Set([...yesterdayTitles, ...pickedTitles]));

      nextPlan[slot] = picked;
      if (picked?.title) pickedTitles.add(picked.title);
    });

    setDailyPlan(nextPlan);
  }, [allMeals, logs, profile?.baby_age_months, selectedAgeMonths]);

  useEffect(() => {
    if (allMeals.length > 0) generateSuggestions();
  }, [allMeals, generateSuggestions]);

  const refreshSuggestions = useCallback(() => {
    generateSuggestions();
  }, [generateSuggestions]);

  const logMealAsFed = useCallback(
    async (slot) => {
      const meal = dailyPlan[slot];
      if (!supabase || !userId || !meal) return;

      const today = new Date().toISOString().slice(0, 10);
      const payload = {
        user_id: userId,
        meal_date: today,
        meal_slot: slot,
        meal_source: meal.source === "custom" ? "custom" : "built_in",
        built_in_meal_id: meal.source === "built_in" ? meal.id : null,
        custom_meal_id: meal.source === "custom" ? meal.customMealId : null,
        meal_title: meal.title,
      };

      try {
        const { error } = await supabase.from("meal_logs").insert(payload);
        if (error) throw error;
      } catch {
        setError("Couldn't save meal log. Please try again.");
      }
    },
    [dailyPlan, userId]
  );

  return {
    profile,
    dailyPlan,
    loading,
    error,
    refreshSuggestions,
    logMealAsFed,
  };
}

export default useDailyMeals;

