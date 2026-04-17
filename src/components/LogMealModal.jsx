import { useState } from "react";

const REACTIONS = [
  { key: "loved",    emoji: "😍", label: "Loved" },
  { key: "liked",    emoji: "👍", label: "Liked" },
  { key: "neutral",  emoji: "😐", label: "Ok" },
  { key: "disliked", emoji: "👎", label: "Nope" },
  { key: "allergic", emoji: "🚨", label: "Reaction" },
];

function LogMealModal({ mealName, onSubmit, onClose }) {
  const [reaction,  setReaction]  = useState(null);
  const [notes,     setNotes]     = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [saving,    setSaving]    = useState(false);

  const handleSubmit = async () => {
    if (!reaction) return;
    setSaving(true);
    await onSubmit(reaction, notes);
    setSaving(false);
    onClose();
  };

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 500,
      }} />

      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 501,
        background: "var(--white)", borderRadius: "20px 20px 0 0",
        padding: "1rem 1.25rem 2.5rem",
        boxShadow: "0 -8px 32px rgba(45,36,22,0.15)",
      }}>
        {/* Handle bar */}
        <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 2, margin: "0 auto 1rem" }} />

        <p style={{
          fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.09em", color: "var(--muted)", marginBottom: 3,
        }}>
          Log as fed
        </p>
        <p style={{
          fontWeight: 700, fontSize: "1rem", color: "var(--dark)",
          marginBottom: "1.1rem", fontFamily: "Aileron, sans-serif",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {mealName}
        </p>

        {/* Reaction picker */}
        <div style={{ display: "flex", gap: 6, marginBottom: "1rem" }}>
          {REACTIONS.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setReaction(r.key)}
              style={{
                flex: 1,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "9px 2px",
                background: reaction === r.key ? "var(--cream)" : "none",
                border: reaction === r.key ? "2px solid var(--orange)" : "1.5px solid var(--border)",
                borderRadius: 12, cursor: "pointer", transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: "1.4rem" }}>{r.emoji}</span>
              <span style={{
                fontSize: "0.6rem", fontWeight: 700,
                color: reaction === r.key ? "var(--orange-dark)" : "var(--muted)",
              }}>
                {r.label}
              </span>
            </button>
          ))}
        </div>

        {/* Notes */}
        {!showNotes ? (
          <button
            type="button"
            onClick={() => setShowNotes(true)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "0.82rem", color: "var(--muted)", fontWeight: 600,
              padding: "0 0 0.8rem", display: "block",
            }}
          >
            + Add a note
          </button>
        ) : (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. loved the texture, slight rash on cheek..."
            rows={2}
            autoFocus
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "9px 12px", fontSize: "0.85rem",
              border: "1.5px solid var(--border)", borderRadius: 10,
              resize: "none", fontFamily: "Nunito, sans-serif",
              background: "var(--cream)", marginBottom: "0.8rem",
              outline: "none",
            }}
          />
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!reaction || saving}
          className="btn btn-primary"
          style={{ width: "100%" }}
        >
          {saving ? "Saving…" : "Log it"}
        </button>
      </div>
    </>
  );
}

export default LogMealModal;
