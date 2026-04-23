import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import useActiveBaby from "../hooks/useActiveBaby";
import { supabase } from "../lib/supabaseClient";

const AVATARS = ["🐣","🍼","👶","🧒","🌟","🐻","🦁","🐼","🐨","🐸","🦊","🐧","🦋","🌈","⭐","🍭"];

const FEEDING_STYLES = [
  "breastfed only","formula only","combination",
  "breastfed + solids","formula + solids","solids only",
];

const DIETARY_FLAGS = [
  { key: "is_dairy_free",   label: "Dairy-free" },
  { key: "is_gluten_free",  label: "Gluten-free" },
  { key: "is_nut_free",     label: "Nut-free" },
  { key: "is_egg_free",     label: "Egg-free" },
  { key: "is_soy_free",     label: "Soy-free" },
  { key: "is_fish_free",    label: "Fish-free" },
  { key: "is_vegetarian",   label: "Vegetarian" },
  { key: "is_vegan",        label: "Vegan" },
];

const BLANK_FLAGS = Object.fromEntries(DIETARY_FLAGS.map(({ key }) => [key, false]));

const TABS = [
  { k: "basics",   l: "Basics" },
  { k: "diet",     l: "Diet" },
  { k: "allergy",  l: "Allergies" },
  { k: "account",  l: "Account" },
];

function ageLabel(dob) {
  if (!dob) return "";
  const months = Math.max(0, Math.floor((Date.now() - new Date(dob)) / (30.44 * 24 * 60 * 60 * 1000)));
  if (months < 12) return `${months}m`;
  const y = Math.floor(months / 12), m = months % 12;
  return m > 0 ? `${y}y ${m}m` : `${y}y`;
}

function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setup = searchParams.get("setup") === "true";

  const { babies, activeBaby, switchBaby, addBaby, updateBaby, deleteBaby, loading } = useActiveBaby();

  const [session, setSession]             = useState(null);
  const [tab, setTab]                     = useState("basics");
  const [selectedBabyId, setSelectedBabyId] = useState(null);
  const [addMode, setAddMode]             = useState(setup);
  const [pageStatus, setPageStatus]       = useState("");
  const [formStatus, setFormStatus]       = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // form fields
  const [babyName, setBabyName]       = useState("");
  const [dob, setDob]                 = useState("");
  const [gender, setGender]           = useState("prefer_not_to_say");
  const [avatar, setAvatar]           = useState("🐣");
  const [feedingStyle, setFeedingStyle] = useState("solids only");
  const [flags, setFlags]             = useState({ ...BLANK_FLAGS });
  const [allergyNotes, setAllergyNotes] = useState("");

  // account
  const [showPasswordForm, setShowPasswordForm]   = useState(false);
  const [newPassword, setNewPassword]             = useState("");
  const [passwordStatus, setPasswordStatus]       = useState("");
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data?.subscription?.unsubscribe?.();
  }, []);

  // seed selectedBabyId from activeBaby once loaded
  useEffect(() => {
    if (!selectedBabyId && activeBaby) setSelectedBabyId(activeBaby.id);
  }, [activeBaby, selectedBabyId]);

  // pre-fill form from selected baby
  const selectedBaby = babies.find(b => b.id === selectedBabyId);
  useEffect(() => {
    if (selectedBaby && !addMode) {
      setBabyName(selectedBaby.name || "");
      setDob(selectedBaby.date_of_birth || "");
      setGender(selectedBaby.gender || "prefer_not_to_say");
      setAvatar(selectedBaby.avatar || "🐣");
      setFeedingStyle(selectedBaby.feeding_style || "solids only");
      setFlags(Object.fromEntries(DIETARY_FLAGS.map(({ key }) => [key, !!selectedBaby[key]])));
      setAllergyNotes(selectedBaby.allergy_notes || "");
    }
  }, [selectedBabyId, selectedBaby, addMode]);

  const resetForm = () => {
    setBabyName(""); setDob(""); setGender("prefer_not_to_say");
    setAvatar("🐣"); setFeedingStyle("solids only");
    setFlags({ ...BLANK_FLAGS }); setAllergyNotes(""); setFormStatus("");
  };

  const flash = (msg) => { setPageStatus(msg); setTimeout(() => setPageStatus(""), 2500); };

  const saveBabyData = async () => {
    setFormStatus("");
    const payload = {
      name: babyName.trim(), date_of_birth: dob, gender, avatar,
      feeding_style: feedingStyle, ...flags, allergy_notes: allergyNotes,
    };
    if (addMode) {
      const result = await addBaby(payload);
      if (result.error) { setFormStatus(result.error); return; }
      setAddMode(false); resetForm(); flash("Baby added!");
    } else {
      const result = await updateBaby(selectedBabyId, payload);
      if (result.error) { setFormStatus(result.error); return; }
      flash("Saved!");
    }
  };

  const handleSaveBaby = async (e) => { e.preventDefault(); await saveBabyData(); };

  const handleDeleteBaby = async (id) => {
    const result = await deleteBaby(id);
    if (result.error) { setPageStatus(result.error); return; }
    setDeleteConfirm(null);
    if (selectedBabyId === id) setSelectedBabyId(activeBaby?.id || babies[0]?.id || null);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault(); setPasswordStatus("");
    if (!newPassword || newPassword.length < 6) { setPasswordStatus("Password must be at least 6 characters."); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setPasswordStatus(error.message); return; }
    setPasswordStatus("Password updated!"); setNewPassword("");
    setTimeout(() => { setPasswordStatus(""); setShowPasswordForm(false); }, 2000);
  };

  const handleShare = () => {
    const url = window.location.origin;
    if (navigator.share) {
      navigator.share({ title: "Baby Bites", text: "Safe, age-appropriate meal ideas for your baby!", url });
    } else {
      navigator.clipboard.writeText(url).then(() => flash("Link copied!"));
    }
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); navigate("/"); };

  const isActiveBaby = (b) => b.is_active || b.id === activeBaby?.id;

  // ── Shared styles ──
  const panelCard = { background: "var(--white)", border: "1.5px solid var(--border)", borderRadius: 18, padding: 16 };
  const labelStyle = { fontSize: ".72rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4, letterSpacing: ".04em", textTransform: "uppercase", fontFamily: "Nunito, sans-serif" };
  const sectionTitle = { fontFamily: "Aileron, sans-serif", fontWeight: 700, fontSize: "1.05rem", color: "var(--dark)", marginBottom: 4 };
  const sectionSub = { fontFamily: "Nunito, sans-serif", fontSize: ".82rem", color: "var(--muted)", marginBottom: 12 };

  if (!session && !loading) {
    return (
      <div className="page">
        <span className="eyebrow eo" style={{ marginTop: "1.5rem", display: "block" }}>Account</span>
        <h1>Profile</h1>
        <p className="muted">Please <button className="btn btn-primary" onClick={() => navigate("/login")}>sign in</button> to view your profile.</p>
      </div>
    );
  }

  const visibleTabs = addMode ? TABS.filter(t => t.k !== "account") : TABS;

  return (
    <div className="page" style={{ paddingBottom: 40 }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: "1.5rem", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div>
          <span className="eyebrow eo" style={{ display: "block" }}>Account</span>
          <h1 style={{ margin: "2px 0 0" }}>Profile</h1>
        </div>
        {session && (
          <div style={{ fontSize: ".82rem", color: "var(--muted)", fontFamily: "Nunito, sans-serif" }}>
            Signed in as <strong style={{ color: "var(--dark)" }}>{session.user.email}</strong>
          </div>
        )}
      </div>

      {pageStatus && (
        <p style={{ fontSize: ".88rem", color: "var(--muted)", fontWeight: 600, marginBottom: ".8rem" }}>{pageStatus}</p>
      )}

      {session && (
        <div className="profile-grid">

          {/* ── SIDEBAR ── */}
          <div style={{ ...panelCard, padding: 12, alignSelf: "start", position: "sticky", top: 80 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 4px 8px" }}>
              <div style={{ fontFamily: "Aileron, sans-serif", fontWeight: 700, fontSize: ".95rem", color: "var(--dark)" }}>My Babies</div>
              <button
                onClick={() => { setAddMode(true); resetForm(); setTab("basics"); }}
                style={{ background: "none", border: "none", color: "var(--orange-dark)", fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: ".78rem", cursor: "pointer" }}
              >+ Add</button>
            </div>

            {loading ? (
              <p className="muted" style={{ padding: "8px 4px", fontSize: ".82rem" }}>Loading…</p>
            ) : babies.length === 0 ? (
              <p className="muted" style={{ padding: "8px 4px", fontSize: ".82rem" }}>No babies yet.</p>
            ) : (
              babies.map(b => {
                const on = !addMode && b.id === selectedBabyId;
                return (
                  <div
                    key={b.id}
                    onClick={() => { setSelectedBabyId(b.id); setAddMode(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 10px", marginBottom: 4, borderRadius: 12,
                      background: on ? "var(--orange)" : "transparent",
                      border: "1.5px solid " + (on ? "var(--orange-mid)" : "transparent"),
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--cream)", display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>{b.avatar || "🐣"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: ".88rem", color: on ? "var(--orange-dark)" : "var(--dark)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</div>
                      <div style={{ fontFamily: "Nunito, sans-serif", fontSize: ".72rem", color: "var(--muted)" }}>{ageLabel(b.date_of_birth)}</div>
                    </div>
                    {isActiveBaby(b) && <span style={{ fontSize: ".65rem", fontWeight: 800, color: "var(--orange-dark)", letterSpacing: ".06em", flexShrink: 0 }}>ACTIVE</span>}
                  </div>
                );
              })
            )}

            {/* Quick stats */}
            {selectedBaby && !addMode && (
              <div style={{ borderTop: "1px solid var(--border)", marginTop: 10, paddingTop: 10 }}>
                <div style={{ fontFamily: "Nunito, sans-serif", fontSize: ".72rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", padding: "0 4px 6px" }}>Quick stats</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: "0 4px" }}>
                  {[
                    ["Age", ageLabel(selectedBaby.date_of_birth) || "—"],
                    ["Allergen flags", DIETARY_FLAGS.filter(({ key }) => !!selectedBaby[key]).length],
                  ].map(([l, v], i) => (
                    <div key={i} style={{ background: "var(--cream)", borderRadius: 10, padding: "6px 8px" }}>
                      <div style={{ fontFamily: "Aileron, sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--orange-dark)" }}>{v}</div>
                      <div style={{ fontFamily: "Nunito, sans-serif", fontSize: ".65rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── MAIN PANEL ── */}
          <div>
            {/* Baby header strip */}
            {!addMode && selectedBaby && (
              <div style={{ ...panelCard, padding: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <span style={{ width: 56, height: 56, borderRadius: 14, background: "var(--cream)", display: "grid", placeItems: "center", fontSize: 32, flexShrink: 0 }}>{selectedBaby.avatar || "🐣"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "Aileron, sans-serif", fontWeight: 700, fontSize: "1.3rem", color: "var(--dark)", lineHeight: 1.1 }}>{selectedBaby.name}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                    <span className="badge badge-age">{ageLabel(selectedBaby.date_of_birth)}</span>
                    <span className="badge badge-slot">{selectedBaby.feeding_style || "solids only"}</span>
                    {DIETARY_FLAGS.filter(({ key }) => !!selectedBaby[key]).slice(0, 3).map(({ key, label }) => (
                      <span key={key} className="badge">{label}</span>
                    ))}
                  </div>
                </div>
                {!isActiveBaby(selectedBaby) && (
                  <button className="btn" onClick={() => switchBaby(selectedBaby.id)} style={{ fontSize: ".8rem", flexShrink: 0 }}>Set as active</button>
                )}
              </div>
            )}

            {addMode && (
              <div style={{ ...panelCard, padding: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ width: 56, height: 56, borderRadius: 14, background: "var(--cream)", display: "grid", placeItems: "center", fontSize: 32 }}>🐣</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "Aileron, sans-serif", fontWeight: 700, fontSize: "1.3rem", color: "var(--dark)", lineHeight: 1.1 }}>New baby</div>
                  <div style={{ fontFamily: "Nunito, sans-serif", fontSize: ".82rem", color: "var(--muted)", marginTop: 4 }}>Fill in the details below</div>
                </div>
                <button className="btn btn-ghost" onClick={() => { setAddMode(false); setFormStatus(""); }} style={{ fontSize: ".8rem" }}>Cancel</button>
              </div>
            )}

            {/* Tab strip */}
            <div style={{ display: "flex", gap: 4, padding: "4px", background: "var(--cream)", borderRadius: 100, border: "1.5px solid var(--border)", marginBottom: 10, width: "fit-content", flexWrap: "wrap" }}>
              {visibleTabs.map(t => {
                const on = tab === t.k;
                return (
                  <button
                    key={t.k}
                    onClick={() => setTab(t.k)}
                    style={{
                      padding: "6px 16px", borderRadius: 100, border: "none",
                      background: on ? "var(--white)" : "transparent",
                      color: on ? "var(--orange-dark)" : "var(--muted)",
                      fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: ".82rem",
                      cursor: "pointer", boxShadow: on ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                    }}
                  >{t.l}</button>
                );
              })}
            </div>

            {/* ── Tab: Basics ── */}
            {tab === "basics" && (
              <form onSubmit={handleSaveBaby} style={panelCard}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Baby's name</label>
                    <input className="input" value={babyName} onChange={e => setBabyName(e.target.value)} placeholder="e.g. Aiden" required />
                  </div>
                  <div>
                    <label style={labelStyle}>Date of birth</label>
                    <input className="input" type="date" value={dob} onChange={e => setDob(e.target.value)} required />
                  </div>
                  <div>
                    <label style={labelStyle}>Gender</label>
                    <select className="input" value={gender} onChange={e => setGender(e.target.value)}>
                      <option value="boy">Boy</option>
                      <option value="girl">Girl</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Feeding style</label>
                    <select className="input" value={feedingStyle} onChange={e => setFeedingStyle(e.target.value)}>
                      {FEEDING_STYLES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label style={labelStyle}>Avatar</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {AVATARS.map(a => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAvatar(a)}
                        style={{
                          fontSize: 20, width: 36, height: 36, borderRadius: 10, cursor: "pointer",
                          border: "1.5px solid " + (avatar === a ? "var(--orange-dark)" : "var(--border)"),
                          background: avatar === a ? "var(--orange)" : "var(--cream)",
                          display: "grid", placeItems: "center",
                        }}
                      >{a}</button>
                    ))}
                  </div>
                </div>

                {formStatus && <p style={{ color: "#c0392b", fontSize: ".85rem", marginTop: 10 }}>{formStatus}</p>}

                <div style={{ marginTop: 14, display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap", alignItems: "center" }}>
                  {!addMode && selectedBaby && babies.length > 1 && (
                    deleteConfirm === selectedBabyId ? (
                      <>
                        <span style={{ fontSize: ".85rem", color: "var(--muted)" }}>Are you sure?</span>
                        <button type="button" className="btn" style={{ color: "#c0392b", borderColor: "#c0392b" }} onClick={() => handleDeleteBaby(selectedBabyId)}>Yes, delete</button>
                        <button type="button" className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                      </>
                    ) : (
                      <button type="button" className="btn btn-ghost" style={{ color: "#c0392b" }} onClick={() => setDeleteConfirm(selectedBabyId)}>Delete baby</button>
                    )
                  )}
                  <button type="submit" className="btn btn-primary">{addMode ? "Add baby" : "Save changes"}</button>
                </div>
              </form>
            )}

            {/* ── Tab: Diet ── */}
            {tab === "diet" && (
              <div style={panelCard}>
                <div style={sectionTitle}>Dietary preferences</div>
                <div style={sectionSub}>Tap to toggle. Meal suggestions will respect these.</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {DIETARY_FLAGS.map(({ key, label }) => {
                    const on = !!flags[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFlags(f => ({ ...f, [key]: !f[key] }))}
                        style={{
                          padding: "7px 14px", borderRadius: 100, cursor: "pointer",
                          border: "1.5px solid " + (on ? "var(--orange-dark)" : "var(--border)"),
                          background: on ? "var(--orange-dark)" : "var(--white)",
                          color: on ? "#fff" : "var(--text)",
                          fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: ".82rem",
                          display: "inline-flex", alignItems: "center", gap: 5,
                        }}
                      >{on && <span>✓</span>}{label}</button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn btn-primary" onClick={saveBabyData}>Save changes</button>
                </div>
              </div>
            )}

            {/* ── Tab: Allergies ── */}
            {tab === "allergy" && (
              <div style={panelCard}>
                <div style={sectionTitle}>Allergy notes</div>
                <div style={sectionSub}>Anything specific we should watch for.</div>
                <textarea
                  className="input"
                  value={allergyNotes}
                  onChange={e => setAllergyNotes(e.target.value)}
                  rows={4}
                  style={{ resize: "vertical", width: "100%", boxSizing: "border-box" }}
                  placeholder="Any specific allergies or notes…"
                />
                <div style={{ marginTop: 10, padding: 12, background: "#FDF0EF", border: "1.5px solid #F4C6C1", borderRadius: 12 }}>
                  <div style={{ fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: ".85rem", color: "#C0392B", marginBottom: 4 }}>⚠ Known reactions</div>
                  <div style={{ fontFamily: "Nunito, sans-serif", fontSize: ".82rem", color: "var(--text)" }}>We'll flag recipes containing ingredients from this note.</div>
                </div>
                <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn btn-primary" onClick={saveBabyData}>Save changes</button>
                </div>
              </div>
            )}

            {/* ── Tab: Account ── */}
            {tab === "account" && !addMode && (
              <div style={panelCard}>
                {/* Email */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 4px 12px", marginBottom: 4, borderBottom: "1px solid var(--border)" }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--cream)", display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0 }}>✉️</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "Nunito, sans-serif", fontSize: ".72rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>Email</div>
                    <div style={{ fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: ".9rem", color: "var(--dark)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.user.email}</div>
                  </div>
                </div>

                {/* Password */}
                <div style={{ padding: "12px 4px", borderBottom: "1px solid var(--border)" }}>
                  {!showPasswordForm ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 20 }}>🔑</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: ".9rem", color: "var(--dark)" }}>Change password</div>
                        <div style={{ fontFamily: "Nunito, sans-serif", fontSize: ".78rem", color: "var(--muted)" }}>Update your login password</div>
                      </div>
                      <button className="btn" onClick={() => setShowPasswordForm(true)}>Change</button>
                    </div>
                  ) : (
                    <form onSubmit={handleChangePassword} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                      <input
                        className="input"
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="New password (min 6 chars)"
                        minLength={6}
                        style={{ flex: 1, minWidth: 200 }}
                      />
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button type="button" className="btn btn-ghost" onClick={() => { setShowPasswordForm(false); setNewPassword(""); setPasswordStatus(""); }}>Cancel</button>
                      {passwordStatus && <p style={{ width: "100%", fontSize: ".85rem", color: passwordStatus.includes("!") ? "var(--green-dark)" : "#c0392b", margin: 0 }}>{passwordStatus}</p>}
                    </form>
                  )}
                </div>

                {/* Share */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 4px", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 20 }}>🔗</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: ".9rem", color: "var(--dark)" }}>Share Baby Bites</div>
                    <div style={{ fontFamily: "Nunito, sans-serif", fontSize: ".78rem", color: "var(--muted)" }}>Invite a co-parent or friend</div>
                  </div>
                  <button className="btn" onClick={handleShare}>Copy link</button>
                </div>

                {/* Sign out */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 4px", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 20 }}>🚪</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: ".9rem", color: "var(--dark)" }}>Sign out</div>
                    <div style={{ fontFamily: "Nunito, sans-serif", fontSize: ".78rem", color: "var(--muted)" }}>End this session</div>
                  </div>
                  <button className="btn" onClick={handleSignOut}>Sign out</button>
                </div>

                {/* Delete account */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 4px" }}>
                  <span style={{ fontSize: 20 }}>🗑️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: ".9rem", color: "#C0392B" }}>Delete account</div>
                    <div style={{ fontFamily: "Nunito, sans-serif", fontSize: ".78rem", color: "var(--muted)" }}>Permanently remove your data</div>
                  </div>
                  <button className="btn btn-ghost" style={{ color: "#c0392b", borderColor: "#c0392b" }} onClick={() => setShowDeleteAccount(!showDeleteAccount)}>Delete</button>
                </div>
                {showDeleteAccount && (
                  <div style={{ background: "var(--cream)", border: "1.5px solid #c0392b", borderRadius: 12, padding: "1rem", marginTop: 8 }}>
                    <p style={{ fontSize: ".88rem", marginBottom: 10 }}>
                      To permanently delete your account and all data, email <strong>support@babybites.app</strong> from your registered address.
                    </p>
                    <button className="btn btn-ghost" onClick={() => setShowDeleteAccount(false)}>Cancel</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
