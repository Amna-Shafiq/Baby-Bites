import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import TopNav from "../components/TopNav";
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

  const [session, setSession]           = useState(null);
  const [showForm, setShowForm]         = useState(setup);
  const [editingBaby, setEditingBaby]   = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // baby id to confirm delete
  const [formStatus, setFormStatus]     = useState("");
  const [pageStatus, setPageStatus]     = useState(setup ? "Add your first baby to get personalised suggestions." : "");

  // form fields
  const [babyName, setBabyName]         = useState("");
  const [dob, setDob]                   = useState("");
  const [gender, setGender]             = useState("prefer_not_to_say");
  const [avatar, setAvatar]             = useState("🐣");
  const [feedingStyle, setFeedingStyle] = useState("solids only");
  const [flags, setFlags]               = useState({ ...BLANK_FLAGS });
  const [allergyNotes, setAllergyNotes] = useState("");

  // account section
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword]           = useState("");
  const [passwordStatus, setPasswordStatus]     = useState("");
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data?.subscription?.unsubscribe?.();
  }, []);

  const resetForm = () => {
    setBabyName(""); setDob(""); setGender("prefer_not_to_say");
    setAvatar("🐣"); setFeedingStyle("solids only");
    setFlags({ ...BLANK_FLAGS }); setAllergyNotes("");
    setFormStatus("");
  };

  const openAdd = () => {
    // Pre-fill from user metadata if no babies yet
    if (babies.length === 0 && session?.user?.user_metadata) {
      const meta = session.user.user_metadata;
      if (meta.baby_name)         setBabyName(meta.baby_name);
      if (meta.baby_date_of_birth) setDob(meta.baby_date_of_birth);
    }
    setEditingBaby(null);
    setShowForm(true);
    setFormStatus("");
  };

  const openEdit = (baby) => {
    setBabyName(baby.name);
    setDob(baby.date_of_birth);
    setGender(baby.gender || "prefer_not_to_say");
    setAvatar(baby.avatar || "🐣");
    setFeedingStyle(baby.feeding_style || "solids only");
    setFlags(Object.fromEntries(DIETARY_FLAGS.map(({ key }) => [key, !!baby[key]])));
    setAllergyNotes(baby.allergy_notes || "");
    setEditingBaby(baby);
    setShowForm(true);
    setFormStatus("");
  };

  const handleSaveBaby = async (e) => {
    e.preventDefault();
    setFormStatus("");
    const payload = {
      name: babyName.trim(),
      date_of_birth: dob,
      gender,
      avatar,
      feeding_style: feedingStyle,
      ...flags,
      allergy_notes: allergyNotes,
    };
    const result = editingBaby
      ? await updateBaby(editingBaby.id, payload)
      : await addBaby(payload);

    if (result.error) { setFormStatus(result.error); return; }
    setShowForm(false);
    setEditingBaby(null);
    resetForm();
    setPageStatus(editingBaby ? "Baby updated." : "Baby added!");
    setTimeout(() => setPageStatus(""), 3000);
  };

  const handleDeleteBaby = async (id) => {
    const result = await deleteBaby(id);
    if (result.error) { setPageStatus(result.error); return; }
    setDeleteConfirm(null);
    if (showForm && editingBaby?.id === id) { setShowForm(false); setEditingBaby(null); resetForm(); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordStatus("");
    if (!newPassword || newPassword.length < 6) { setPasswordStatus("Password must be at least 6 characters."); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setPasswordStatus(error.message); return; }
    setPasswordStatus("Password updated!");
    setNewPassword("");
    setTimeout(() => { setPasswordStatus(""); setShowPasswordForm(false); }, 2000);
  };

  const handleShare = () => {
    const url = window.location.origin;
    if (navigator.share) {
      navigator.share({ title: "Baby Bites", text: "Safe, age-appropriate meal ideas for your baby!", url });
    } else {
      navigator.clipboard.writeText(url).then(() => setPageStatus("Link copied!"));
      setTimeout(() => setPageStatus(""), 2500);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const panelStyle = { background: "var(--white)", border: "1.5px solid var(--border)", borderRadius: 20, padding: "1.6rem", marginBottom: "1.2rem" };
  const h2Style = { marginBottom: "0.3rem", fontSize: "1.15rem" };
  const subStyle = { fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "1.2rem" };

  return (
    <div className="page">
      <TopNav />

      <span className="eyebrow eo" style={{ marginTop: "1.5rem", display: "block" }}>Account</span>
      <h1>Profile</h1>

      {pageStatus && (
        <p style={{ fontSize: "0.88rem", color: "var(--muted)", fontWeight: 600, marginBottom: "0.8rem" }}>
          {pageStatus}
        </p>
      )}

      {!session && !loading && (
        <p className="muted">Please <button className="btn btn-primary" onClick={() => navigate("/login")}>sign in</button> to view your profile.</p>
      )}

      {/* ── Babies ── */}
      {session && (
        <div style={panelStyle}>
          <h2 style={h2Style}>My Babies</h2>
          <p style={subStyle}>Switch between babies to personalise meal and food suggestions.</p>

          {loading ? (
            <p className="muted">Loading…</p>
          ) : babies.length === 0 ? (
            <p className="muted" style={{ marginBottom: "1rem" }}>No babies yet — add your first one below.</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: "1rem" }}>
              {babies.map((baby) => {
                const isActive = baby.is_active || baby.id === activeBaby?.id;
                return (
                  <div
                    key={baby.id}
                    style={{
                      border: `2px solid ${isActive ? "var(--orange)" : "var(--border)"}`,
                      background: isActive ? "var(--orange-light, #FFF3EA)" : "var(--cream)",
                      borderRadius: 16,
                      padding: "0.8rem 1rem",
                      minWidth: 130,
                      cursor: "pointer",
                      position: "relative",
                    }}
                    onClick={() => !isActive && switchBaby(baby.id)}
                  >
                    {isActive && (
                      <span style={{ position: "absolute", top: 6, right: 8, fontSize: "0.65rem", fontWeight: 800, color: "var(--orange-dark)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Active
                      </span>
                    )}
                    <div style={{ fontSize: 28, marginBottom: 4 }}>{baby.avatar || "🐣"}</div>
                    <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--dark)" }}>{baby.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 2 }}>{ageLabel(baby.date_of_birth)}</div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openEdit(baby); }}
                      style={{ marginTop: 8, fontSize: "0.75rem", background: "none", border: "none", color: "var(--muted)", cursor: "pointer", textDecoration: "underline", padding: 0 }}
                    >
                      Edit
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {!showForm && (
            <button className="btn btn-primary" onClick={openAdd}>
              + Add baby
            </button>
          )}

          {/* ── Baby form ── */}
          {showForm && (
            <form onSubmit={handleSaveBaby} style={{ marginTop: "1.2rem", borderTop: "1.5px solid var(--border)", paddingTop: "1.2rem" }}>
              <h3 style={{ marginBottom: "1rem" }}>{editingBaby ? `Edit ${editingBaby.name}` : "Add a baby"}</h3>

              {/* Name */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Baby's name</label>
                <input className="input" value={babyName} onChange={(e) => setBabyName(e.target.value)} placeholder="e.g. Aiden" required />
              </div>

              {/* DOB + Gender */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Date of birth</label>
                  <input className="input" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Gender</label>
                  <select className="input" value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option value="boy">Boy</option>
                    <option value="girl">Girl</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Avatar picker */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 6 }}>Avatar</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAvatar(a)}
                      style={{
                        fontSize: 22,
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        border: `2px solid ${avatar === a ? "var(--orange)" : "var(--border)"}`,
                        background: avatar === a ? "var(--orange-light, #FFF3EA)" : "var(--cream)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feeding style */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Feeding style</label>
                <select className="input" value={feedingStyle} onChange={(e) => setFeedingStyle(e.target.value)}>
                  {FEEDING_STYLES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>

              {/* Dietary flags */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 8 }}>Dietary preferences</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {DIETARY_FLAGS.map(({ key, label }) => (
                    <label
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 10px",
                        borderRadius: 10,
                        border: `1.5px solid ${flags[key] ? "var(--orange)" : "var(--border)"}`,
                        background: flags[key] ? "var(--orange-light, #FFF3EA)" : "var(--cream)",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: flags[key] ? "var(--orange-dark)" : "var(--muted)",
                        userSelect: "none",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={flags[key]}
                        onChange={(e) => setFlags((f) => ({ ...f, [key]: e.target.checked }))}
                        style={{ accentColor: "var(--orange)" }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Allergy notes */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Allergy notes (optional)</label>
                <textarea
                  className="input"
                  value={allergyNotes}
                  onChange={(e) => setAllergyNotes(e.target.value)}
                  placeholder="Any specific allergies or notes…"
                  rows={2}
                  style={{ resize: "vertical" }}
                />
              </div>

              {formStatus && (
                <p style={{ fontSize: "0.85rem", color: "#c0392b", marginBottom: 10 }}>{formStatus}</p>
              )}

              {/* Form actions */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="submit" className="btn btn-primary">
                  {editingBaby ? "Save changes" : "Add baby"}
                </button>
                <button type="button" className="btn" onClick={() => { setShowForm(false); setEditingBaby(null); resetForm(); }}>
                  Cancel
                </button>
                {editingBaby && babies.length > 1 && (
                  deleteConfirm === editingBaby.id ? (
                    <>
                      <span style={{ fontSize: "0.85rem", color: "var(--muted)", alignSelf: "center" }}>Are you sure?</span>
                      <button type="button" className="btn" style={{ color: "#c0392b", borderColor: "#c0392b" }} onClick={() => handleDeleteBaby(editingBaby.id)}>
                        Yes, delete
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                    </>
                  ) : (
                    <button type="button" className="btn btn-ghost" style={{ color: "#c0392b" }} onClick={() => setDeleteConfirm(editingBaby.id)}>
                      Delete baby
                    </button>
                  )
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Account ── */}
      {session && (
        <div style={panelStyle}>
          <h2 style={h2Style}>Account</h2>
          <p style={subStyle}>{session.user.email}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            {/* Change password */}
            {!showPasswordForm ? (
              <button className="btn" style={{ alignSelf: "flex-start" }} onClick={() => setShowPasswordForm(true)}>
                Change password
              </button>
            ) : (
              <form onSubmit={handleChangePassword} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                <input
                  className="input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 6 chars)"
                  minLength={6}
                  style={{ flex: 1, minWidth: 200 }}
                />
                <button type="submit" className="btn btn-primary">Update</button>
                <button type="button" className="btn btn-ghost" onClick={() => { setShowPasswordForm(false); setNewPassword(""); setPasswordStatus(""); }}>Cancel</button>
                {passwordStatus && <p style={{ width: "100%", fontSize: "0.85rem", color: passwordStatus.includes("!") ? "var(--green-dark)" : "#c0392b", margin: 0 }}>{passwordStatus}</p>}
              </form>
            )}

            {/* Share */}
            <button className="btn" style={{ alignSelf: "flex-start" }} onClick={handleShare}>
              Share Baby Bites
            </button>

            {/* Sign out */}
            <button className="btn" style={{ alignSelf: "flex-start" }} onClick={handleSignOut}>
              Sign out
            </button>

            {/* Delete account */}
            {!showDeleteAccount ? (
              <button className="btn btn-ghost" style={{ alignSelf: "flex-start", color: "#c0392b" }} onClick={() => setShowDeleteAccount(true)}>
                Delete account
              </button>
            ) : (
              <div style={{ background: "var(--cream)", border: "1.5px solid #c0392b", borderRadius: 12, padding: "1rem" }}>
                <p style={{ fontSize: "0.88rem", marginBottom: 10 }}>
                  To permanently delete your account and all data, email <strong>support@babybites.app</strong> from your registered address.
                </p>
                <button className="btn btn-ghost" onClick={() => setShowDeleteAccount(false)}>Cancel</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
