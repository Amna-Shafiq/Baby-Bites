import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export const REACTION_EMOJI = {
  loved:    "😍",
  liked:    "👍",
  neutral:  "😐",
  disliked: "👎",
  allergic: "🚨",
};

export const REACTION_LABEL = {
  loved:    "Loved it",
  liked:    "Liked",
  neutral:  "Ok",
  disliked: "Didn't like",
  allergic: "Reaction",
};

export function relativeDate(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7)  return `${diff}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function useFeedingLog(userId) {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) { setLogs([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("feeding_logs")
      .select("*")
      .eq("user_id", userId)
      .order("fed_at", { ascending: false })
      .limit(50);
    setLogs(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const addLog = useCallback(async ({ mealId, customMealId, foodId, itemName, reaction, notes }) => {
    if (!userId) return { error: "Not logged in" };
    const { error } = await supabase.from("feeding_logs").insert({
      user_id:        userId,
      meal_id:        mealId || null,
      custom_meal_id: customMealId || null,
      food_id:        foodId || null,
      item_name:      itemName,
      reaction,
      notes:          notes?.trim() || null,
      fed_at:         new Date().toISOString(),
    });
    if (error) return { error: error.message };
    await load();
    return { error: null };
  }, [userId, load]);

  const deleteLog = useCallback(async (id) => {
    await supabase.from("feeding_logs").delete().eq("id", id).eq("user_id", userId);
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }, [userId]);

  return { logs, loading, addLog, deleteLog };
}

export default useFeedingLog;
