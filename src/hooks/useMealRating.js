import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function useMealRating(mealId, userId) {
  const [avgRating, setAvgRating]   = useState(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchRatings = async () => {
    const { data } = await supabase
      .from("meal_ratings")
      .select("rating, user_id")
      .eq("meal_id", mealId);
    if (!data) return;
    setRatingCount(data.length);
    if (data.length > 0) {
      const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
      setAvgRating(Math.round(avg * 10) / 10);
    } else {
      setAvgRating(null);
    }
    if (userId) {
      const mine = data.find((r) => r.user_id === userId);
      setUserRating(mine ? mine.rating : 0);
    }
  };

  useEffect(() => {
    if (mealId) fetchRatings();
  }, [mealId, userId]);

  const submitRating = async (rating) => {
    if (!userId || !mealId) return;
    setSubmitting(true);
    await supabase.from("meal_ratings").upsert(
      { meal_id: mealId, user_id: userId, rating },
      { onConflict: "meal_id,user_id" }
    );
    await fetchRatings();
    setSubmitting(false);
  };

  return { avgRating, ratingCount, userRating, submitRating, submitting };
}
