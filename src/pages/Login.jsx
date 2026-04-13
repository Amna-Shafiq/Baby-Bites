import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function Login({ redirectTo = "/" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("signIn"); // "signIn" | "signUp"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [babyAgeMonths, setBabyAgeMonths] = useState("");
  const [babyDob, setBabyDob] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const finalRedirectTo = location.state?.redirectTo || redirectTo;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!supabase) {
      setError("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signUp") {
        if (!fullName.trim()) {
          throw new Error("Please enter your full name.");
        }
        if (!babyAgeMonths || Number(babyAgeMonths) < 0) {
          throw new Error("Please enter a valid baby age in months.");
        }
        if (!babyDob) {
          throw new Error("Please select baby date of birth.");
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              baby_age_months: Number(babyAgeMonths),
              baby_date_of_birth: babyDob,
            },
          },
        });
        if (error) throw error;

        // Depending on your Supabase settings, users may need email confirmation.
        setMessage("Account created. Check your email for confirmation (if enabled), then sign in.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      navigate(finalRedirectTo, { replace: true });
    } catch (err) {
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 420 }}>
      <h2>{mode === "signIn" ? "Login" : "Sign up"}</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          required
        />
        <input
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password"
          required
          minLength={6}
        />
        {mode === "signUp" ? (
          <>
            <input
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              type="text"
              placeholder="Full name"
              required
            />
            <input
              className="input"
              value={babyAgeMonths}
              onChange={(e) => setBabyAgeMonths(e.target.value)}
              type="number"
              placeholder="Baby age (months)"
              min="0"
              required
            />
            <label style={{ fontSize: 14 }}>
              Baby date of birth
              <input
                className="input"
                value={babyDob}
                onChange={(e) => setBabyDob(e.target.value)}
                type="date"
                required
                style={{ marginTop: 4 }}
              />
            </label>
          </>
        ) : null}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Please wait..." : mode === "signIn" ? "Login" : "Create account"}
        </button>
      </form>

      {error ? <p style={{ color: "crimson", marginTop: 12 }}>{error}</p> : null}
      {message ? <p style={{ color: "green", marginTop: 12 }}>{message}</p> : null}

      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => {
          setError("");
          setMessage("");
          setMode((m) => (m === "signIn" ? "signUp" : "signIn"));
        }}
        style={{ marginTop: 12 }}
      >
        {mode === "signIn" ? "Switch to sign up" : "Switch to login"}
      </button>
    </div>
  );
}

export default Login;

