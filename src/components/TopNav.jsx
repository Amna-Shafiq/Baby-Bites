import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import useActiveBaby from "../hooks/useActiveBaby";

function TopNav() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const { activeBaby } = useActiveBaby();

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) setSession(session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      active = false;
      subscription?.subscription?.unsubscribe?.();
    };
  }, []);

  const profileInitial = useMemo(() => {
    const fullName = session?.user?.user_metadata?.full_name;
    const email = session?.user?.email;
    const source = (fullName || email || "?").trim();
    return source.charAt(0).toUpperCase();
  }, [session]);

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <nav className="top-nav">
      <div className="top-nav-inner">
        <NavLink to="/" end className="brand">
          <span className="brand-dot" />
          Baby Bites
        </NavLink>

        <div className="top-nav-links">
          <NavLink to="/explore">Explore</NavLink>
          <NavLink to="/foods">All Foods</NavLink>
          <NavLink to="/meals">Meals</NavLink>
          <NavLink to="/pantry">Pantry</NavLink>
          <NavLink to="/my-meals">My Meals</NavLink>
        </div>

        <div className="top-nav-actions">
          {session ? (
            <>
              <NavLink to="/profile" className="baby-nav-chip" title="My profile">
                <span className="baby-nav-avatar">{activeBaby?.avatar || profileInitial}</span>
                {activeBaby && <span className="baby-nav-name">{activeBaby.name}</span>}
              </NavLink>
              <button type="button" className="btn" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => navigate("/login")}>
              Get started
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default TopNav;
