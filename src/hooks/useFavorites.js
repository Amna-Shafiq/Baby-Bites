import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function useFavorites() {
  const [session, setSession]           = useState(null);
  const [favoriteIds, setFavoriteIds]   = useState([]);
  const [favoriteMeals, setFavoriteMeals] = useState([]);
  const [favoritesError, setFavoritesError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const toastTimerRef = useRef(null);

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

  const loadFavorites = useCallback(async () => {
    if (!supabase || !userId) {
      setFavoriteIds([]);
      setFavoriteMeals([]);
      return;
    }

    // Fetch favorite IDs + full meal details in one query
    const { data, error } = await supabase
      .from("favorites")
      .select("meal_id, meals(*)")
      .eq("user_id", userId);

    if (error) {
      setFavoritesError(error.message || "Could not load favorites.");
      return;
    }

    setFavoritesError("");
    const rows = data || [];
    setFavoriteIds(rows.map((r) => r.meal_id));
    setFavoriteMeals(rows.map((r) => r.meals).filter(Boolean));
  }, [userId]);

  useEffect(() => { loadFavorites(); }, [loadFavorites]);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(""), 1700);
  }, []);

  const toggleFavorite = useCallback(
    async (mealId) => {
      if (!supabase || !userId) {
        setFavoritesError("Please log in to save favorites.");
        showToast("Please log in first.");
        return;
      }

      const isFavorite = favoriteIds.includes(mealId);

      // Optimistic update
      setFavoriteIds((prev) => isFavorite ? prev.filter((x) => x !== mealId) : [...prev, mealId]);
      setFavoritesError("");

      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("meal_id", mealId);
        if (error) {
          setFavoritesError(error.message || "Could not update favorites.");
          showToast("Could not update favorites.");
          await loadFavorites();
        } else {
          showToast("Removed from favorites");
          await loadFavorites();
        }
        return;
      }

      const { error } = await supabase
        .from("favorites")
        .upsert({ user_id: userId, meal_id: mealId }, { onConflict: "user_id,meal_id" });

      if (error) {
        setFavoritesError(error.message || "Could not update favorites.");
        showToast("Could not update favorites.");
        await loadFavorites();
        return;
      }

      showToast("Saved to favorites");
      await loadFavorites();
    },
    [favoriteIds, loadFavorites, userId, showToast]
  );

  return { session, favoriteIds, favoriteMeals, toggleFavorite, favoritesError, toastMessage };
}

export default useFavorites;
