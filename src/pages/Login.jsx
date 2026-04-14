import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import TopNav from "../components/TopNav";
import { supabase } from "../lib/supabaseClient";

function Login({ redirectTo = "/" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode]               = useState("signIn");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [fullName, setFullName]       = useState("");
  const [babyName, setBabyName]       = useState("");
  const [babyAgeMonths, setBabyAgeMonths] = useState("");
  const [babyDob, setBabyDob]         = useState("");
  const [error, setError]             = useState("");
  const [message, setMessage]         = useState("");
  const [loading, setLoading]         = useState(false);

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
        if (!fullName.trim())                        throw new Error("Please enter your full name.");
        if (!babyName.trim())                        throw new Error("Please enter your baby's name.");
        if (!babyDob)                                throw new Error("Please select baby date of birth.");

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              baby_name: babyName.trim(),
              baby_date_of_birth: babyDob,
            },
          },
        });
        if (error) throw error;
        setMessage("Account created! Check your email for confirmation, then sign in.");
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
    <div className="page">
      <TopNav />

      <div className="login-wrapper">
        <div className="login-card">
          <span className="eyebrow eo">{mode === "signIn" ? "Welcome back" : "Join Baby Bites"}</span>
          <h2>{mode === "signIn" ? "Sign in" : "Create account"}</h2>

          <form onSubmit={onSubmit} className="login-form">
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

            {mode === "signUp" && (
              <>
                <input
                  className="input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  type="text"
                  placeholder="Your full name"
                  required
                />
                <input
                  className="input"
                  value={babyName}
                  onChange={(e) => setBabyName(e.target.value)}
                  type="text"
                  placeholder="Baby's name"
                  required
                />
                <label style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: 600 }}>
                  Baby date of birth
                  <input
                    className="input"
                    value={babyDob}
                    onChange={(e) => setBabyDob(e.target.value)}
                    type="date"
                    required
                    style={{ marginTop: 6 }}
                  />
                </label>
              </>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? "Please wait…" : mode === "signIn" ? "Sign in" : "Create account"}
            </button>
          </form>

          {error   && <p style={{ color: "#c0392b", marginTop: 12, fontSize: "0.88rem" }}>{error}</p>}
          {message && <p style={{ color: "var(--green-dark)", marginTop: 12, fontSize: "0.88rem" }}>{message}</p>}

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => { setError(""); setMessage(""); setMode((m) => (m === "signIn" ? "signUp" : "signIn")); }}
            style={{ marginTop: 12, width: "100%" }}
          >
            {mode === "signIn" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
