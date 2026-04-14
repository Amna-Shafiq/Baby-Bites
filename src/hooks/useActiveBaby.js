import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function ageInMonths(dob) {
  if (!dob) return null;
  const ms = Date.now() - new Date(dob).getTime();
  return Math.max(0, Math.floor(ms / (30.44 * 24 * 60 * 60 * 1000)));
}

function useActiveBaby() {
  const [userId, setUserId]         = useState(null);
  const [babies, setBabies]         = useState([]);
  const [activeBaby, setActiveBaby] = useState(null);
  const [loading, setLoading]       = useState(true);

  // Track auth state
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });

    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => data?.subscription?.unsubscribe?.();
  }, []);

  const loadBabies = useCallback(async () => {
    if (!supabase || !userId) {
      setBabies([]);
      setActiveBaby(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("babies")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    const list = data || [];
    setBabies(list);
    setActiveBaby(list.find((b) => b.is_active) || list[0] || null);
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadBabies(); }, [loadBabies]);

  const switchBaby = useCallback(async (babyId) => {
    if (!supabase) return;
    await supabase.rpc("switch_active_baby", { baby_id: babyId });
    await loadBabies();
  }, [loadBabies]);

  const addBaby = useCallback(async (payload) => {
    if (!supabase || !userId) return { error: "Not logged in." };
    const { error } = await supabase.from("babies").insert({ user_id: userId, ...payload });
    if (error) return { error: error.message };
    await loadBabies();
    return { error: null };
  }, [userId, loadBabies]);

  const updateBaby = useCallback(async (babyId, payload) => {
    if (!supabase || !userId) return { error: "Not logged in." };
    const { error } = await supabase
      .from("babies").update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", babyId).eq("user_id", userId);
    if (error) return { error: error.message };
    await loadBabies();
    return { error: null };
  }, [userId, loadBabies]);

  const deleteBaby = useCallback(async (babyId) => {
    if (!supabase || !userId) return { error: "Not logged in." };
    const { error } = await supabase
      .from("babies").delete().eq("id", babyId).eq("user_id", userId);
    if (error) return { error: error.message };
    await loadBabies();
    return { error: null };
  }, [userId, loadBabies]);

  return {
    babies,
    activeBaby,
    activeBabyAgeMonths: ageInMonths(activeBaby?.date_of_birth),
    loading,
    loadBabies,
    switchBaby,
    addBaby,
    updateBaby,
    deleteBaby,
  };
}

export default useActiveBaby;
