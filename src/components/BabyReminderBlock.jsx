import { useId, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AGE_RANGES = [
  { value: "0-6mo",   label: "0 – 6 months",  desc: "First tastes & purees" },
  { value: "6-12mo",  label: "6 – 12 months", desc: "Textures, allergens & finger foods" },
  { value: "12-24mo", label: "12 – 24 months", desc: "Family foods & self-feeding" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function BabyReminderBlock({ baby, userEmail = "" }) {
  const uid         = useId();
  const emailRef    = useRef(null);

  const [email, setEmail]           = useState(userEmail);
  const [ranges, setRanges]         = useState([]);
  const [emailError, setEmailError] = useState("");
  const [rangeError, setRangeError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [status, setStatus]         = useState("idle"); // idle | loading | success

  const emailErrId  = `${uid}-email-err`;
  const rangeErrId  = `${uid}-range-err`;
  const submitErrId = `${uid}-submit-err`;
  const liveId      = `${uid}-live`;

  const toggleRange = (val) =>
    setRanges((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );

  const validate = () => {
    let ok = true;
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError("Please enter a valid email address.");
      emailRef.current?.focus();
      ok = false;
    } else {
      setEmailError("");
    }
    if (ranges.length === 0) {
      setRangeError("Select at least one age range.");
      ok = false;
    } else {
      setRangeError("");
    }
    return ok;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setStatus("loading");
    const { error } = await supabase.from("profile_reminders").upsert(
      { baby_id: baby.id, email: email.trim().toLowerCase(), age_ranges: ranges, opted_in_at: new Date().toISOString() },
      { onConflict: "baby_id" }
    );

    if (error) {
      setSubmitError("Could not save your reminder. Please try again.");
      setStatus("idle");
      return;
    }

    setStatus("success");
  };

  const labelStyle = {
    fontSize: ".72rem", fontWeight: 700, color: "var(--muted)",
    display: "block", marginBottom: 4, letterSpacing: ".04em",
    textTransform: "uppercase", fontFamily: "Nunito, sans-serif",
  };

  if (status === "success") {
    return (
      <div
        style={{
          background: "var(--cream)", border: "1.5px solid var(--border)",
          borderRadius: 14, padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 12,
        }}
        role="status"
        aria-live="polite"
      >
        <span style={{ fontSize: 24 }}>{baby.avatar || "🐣"}</span>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: ".9rem", color: "var(--dark)", fontFamily: "Nunito, sans-serif" }}>
            {baby.name} — reminders saved!
          </p>
          <p style={{ margin: "2px 0 0", fontSize: ".8rem", color: "var(--muted)", fontFamily: "Nunito, sans-serif" }}>
            We'll remind you at the right milestone stages.
          </p>
        </div>
      </div>
    );
  }

  const isValid = EMAIL_RE.test(email.trim()) && ranges.length > 0;

  return (
    <form
      onSubmit={handleSubmit}
      aria-label={`Milestone reminders for ${baby.name}`}
      noValidate
      style={{
        background: "var(--cream)", border: "1.5px solid var(--border)",
        borderRadius: 14, padding: "14px 16px",
      }}
    >
      {/* Baby label */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 20 }}>{baby.avatar || "🐣"}</span>
        <span style={{ fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: ".92rem", color: "var(--dark)" }}>
          {baby.name}
        </span>
      </div>

      {/* Email */}
      <div style={{ marginBottom: 10 }}>
        <label htmlFor={`${uid}-email`} style={labelStyle}>Email for reminders</label>
        <input
          id={`${uid}-email`}
          ref={emailRef}
          className="input"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(""); }}
          placeholder="your@email.com"
          aria-describedby={emailError ? emailErrId : undefined}
          aria-invalid={!!emailError}
          required
        />
        {emailError && (
          <p id={emailErrId} role="alert" style={{ margin: "4px 0 0", fontSize: ".78rem", color: "#c0392b", fontFamily: "Nunito, sans-serif" }}>
            {emailError}
          </p>
        )}
      </div>

      {/* Age ranges */}
      <div style={{ marginBottom: 10 }}>
        <p
          id={`${uid}-range-label`}
          style={{ ...labelStyle, marginBottom: 8 }}
        >
          Remind me at these stages
        </p>
        <div
          role="group"
          aria-labelledby={`${uid}-range-label`}
          aria-describedby={rangeError ? rangeErrId : undefined}
          style={{ display: "flex", flexDirection: "column", gap: 6 }}
        >
          {AGE_RANGES.map((r) => {
            const checked = ranges.includes(r.value);
            return (
              <label
                key={r.value}
                htmlFor={`${uid}-${r.value}`}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", borderRadius: 10, cursor: "pointer",
                  border: `1.5px solid ${checked ? "var(--orange-mid)" : "var(--border)"}`,
                  background: checked ? "var(--orange)" : "var(--white)",
                  transition: "border-color 0.15s, background 0.15s",
                }}
              >
                <input
                  id={`${uid}-${r.value}`}
                  type="checkbox"
                  checked={checked}
                  onChange={() => { toggleRange(r.value); if (rangeError) setRangeError(""); }}
                  style={{ accentColor: "var(--orange-dark)", width: 15, height: 15, flexShrink: 0 }}
                />
                <span style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: ".85rem", color: "var(--dark)", display: "block", fontFamily: "Nunito, sans-serif" }}>
                    {r.label}
                  </span>
                  <span style={{ fontSize: ".76rem", color: "var(--muted)", fontFamily: "Nunito, sans-serif" }}>
                    {r.desc}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        {rangeError && (
          <p id={rangeErrId} role="alert" style={{ margin: "6px 0 0", fontSize: ".78rem", color: "#c0392b", fontFamily: "Nunito, sans-serif" }}>
            {rangeError}
          </p>
        )}
      </div>

      {/* Submission error — live region so screen readers catch it */}
      <div aria-live="polite" id={liveId}>
        {submitError && (
          <p id={submitErrId} style={{ margin: "0 0 8px", fontSize: ".78rem", color: "#c0392b", fontFamily: "Nunito, sans-serif" }}>
            {submitError}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={!isValid || status === "loading"}
        style={{ marginTop: 4 }}
        aria-describedby={submitError ? submitErrId : undefined}
      >
        {status === "loading" ? "Saving…" : "Save reminders"}
      </button>
    </form>
  );
}
