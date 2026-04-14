import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import useActiveBaby from "../hooks/useActiveBaby";

function TopNav() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { activeBaby, babies, switchBaby } = useActiveBaby();
  const menuRef = useRef(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const profileInitial = useMemo(() => {
    const fullName = session?.user?.user_metadata?.full_name;
    const email = session?.user?.email;
    return ((fullName || email || "?").trim()).charAt(0).toUpperCase();
  }, [session]);

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setMenuOpen(false);
    navigate("/");
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
            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                type="button"
                className="baby-nav-chip"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
              >
                <span className="baby-nav-avatar">{activeBaby?.avatar || profileInitial}</span>
                {activeBaby && <span className="baby-nav-name">{activeBaby.name}</span>}
              </button>

              {menuOpen && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 6px)",
                  background: "var(--white)", border: "1.5px solid var(--border)",
                  borderRadius: 14, boxShadow: "0 8px 28px rgba(45,36,22,0.13)",
                  minWidth: 200, overflow: "hidden", zIndex: 300,
                }}>
                  {/* Baby switcher */}
                  {babies.length > 0 && (
                    <>
                      <p style={{ padding: "0.5rem 1rem 0.25rem", fontSize: "0.7rem", fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Switch baby
                      </p>
                      {babies.map((baby) => {
                        const isActive = baby.id === activeBaby?.id;
                        return (
                          <button
                            key={baby.id}
                            type="button"
                            onClick={() => { if (!isActive) switchBaby(baby.id); setMenuOpen(false); }}
                            style={{
                              width: "100%", textAlign: "left", padding: "0.55rem 1rem",
                              background: isActive ? "var(--cream)" : "none",
                              border: "none", cursor: isActive ? "default" : "pointer",
                              fontSize: "0.88rem", fontWeight: 600,
                              color: isActive ? "var(--orange-dark)" : "var(--dark)",
                              display: "flex", alignItems: "center", gap: 8,
                            }}
                          >
                            <span style={{ fontSize: "1rem" }}>{baby.avatar || "🐣"}</span>
                            <span style={{ flex: 1 }}>{baby.name}</span>
                            {isActive && <span style={{ fontSize: "0.7rem", color: "var(--orange-dark)" }}>✓</span>}
                          </button>
                        );
                      })}
                      <div style={{ borderTop: "1px solid var(--border)" }} />
                    </>
                  )}

                  {/* Profile & sign out */}
                  <NavLink
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    style={{ display: "block", padding: "0.7rem 1rem", fontSize: "0.88rem", fontWeight: 600, color: "var(--dark)", textDecoration: "none", borderBottom: "1px solid var(--border)" }}
                  >
                    My Profile
                  </NavLink>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    style={{ width: "100%", textAlign: "left", padding: "0.7rem 1rem", background: "none", border: "none", cursor: "pointer", fontSize: "0.88rem", fontWeight: 600, color: "#c0392b" }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
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
