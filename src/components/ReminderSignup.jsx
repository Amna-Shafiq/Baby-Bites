import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const MILESTONES = [
  { value: "0-6mo",   label: "0 – 6 months",  desc: "Starting solids, first tastes" },
  { value: "6-12mo",  label: "6 – 12 months", desc: "Textures, allergens, finger foods" },
  { value: "12-24mo", label: "12 – 24 months", desc: "Family foods, self-feeding" },
];

export default function ReminderSignup() {
  const [email, setEmail]           = useState("");
  const [selected, setSelected]     = useState([]);
  const [status, setStatus]         = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg]     = useState("");

  const toggle = (value) =>
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    if (selected.length === 0) { setErrorMsg("Please select at least one age stage."); return; }

    setStatus("loading");
    setErrorMsg("");

    const { error } = await supabase
      .from("reminder_subscriptions")
      .insert({ email: email.trim().toLowerCase(), milestones: selected });

    if (error) {
      if (error.code === "23505") {
        setErrorMsg("This email is already subscribed.");
      } else {
        setErrorMsg("Something went wrong. Please try again.");
      }
      setStatus("error");
      return;
    }

    setStatus("success");
  };

  if (status === "success") {
    return (
      <div className="panel" style={{ textAlign: "center", padding: "2rem 1.5rem" }}>
        <p style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>🎉</p>
        <p style={{ fontWeight: 800, fontSize: "1rem", color: "var(--dark)", margin: "0 0 0.25rem" }}>
          You're on the list!
        </p>
        <p style={{ fontSize: "0.875rem", color: "var(--muted)", margin: 0 }}>
          We'll remind you to complete your baby's profile when the time is right.
        </p>
      </div>
    );
  }

  return (
    <div className="panel">
      <span className="eyebrow eo">Stay on track</span>
      <h2 style={{ margin: "0.3rem 0 0.35rem" }}>Get milestone reminders</h2>
      <p style={{ margin: "0 0 1.25rem", fontSize: "0.9rem", color: "var(--muted)", lineHeight: 1.6 }}>
        Tell us which stages apply to your baby and we'll remind you to complete your profile at the right time.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <input
          className="input"
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {MILESTONES.map((m) => {
            const checked = selected.includes(m.value);
            return (
              <label
                key={m.value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.65rem 0.875rem",
                  borderRadius: 10,
                  border: `1.5px solid ${checked ? "var(--orange-mid)" : "var(--border)"}`,
                  background: checked ? "var(--orange)" : "var(--card-bg)",
                  cursor: "pointer",
                  transition: "border-color 0.15s, background 0.15s",
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(m.value)}
                  style={{ accentColor: "var(--orange-dark)", width: 16, height: 16, flexShrink: 0 }}
                />
                <span style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--dark)", display: "block" }}>
                    {m.label}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{m.desc}</span>
                </span>
              </label>
            );
          })}
        </div>

        {errorMsg && (
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#c0392b", fontWeight: 600 }}>
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={status === "loading"}
          style={{ alignSelf: "flex-start" }}
        >
          {status === "loading" ? "Saving…" : "Remind me"}
        </button>
      </form>
    </div>
  );
}
