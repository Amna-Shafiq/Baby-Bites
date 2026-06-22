import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { supabase } from "../lib/supabaseClient";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

function Login({ redirectTo = "/" }) {
  const navigate = useNavigate();
  const location = useLocation();

  // modes: "signIn" | "signUp" | "forgotPassword" | "resetPassword"
  const [mode, setMode]               = useState("signIn");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [fullName, setFullName]       = useState("");
  const [babyName, setBabyName]       = useState("");
  const [babyDob, setBabyDob]         = useState("");
  const [error, setError]             = useState("");
  const [message, setMessage]         = useState("");
  const [loading, setLoading]         = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const finalRedirectTo = location.state?.redirectTo || redirectTo;

  useEffect(() => {
    if (location.state?.verified) {
      setMessage("✅ Email verified! You can now sign in.");
    }
  }, [location.state]);

  // Supabase fires PASSWORD_RECOVERY when the user lands via a reset link
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("resetPassword");
        setError("");
        setMessage("");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/profile` },
    });
    if (error) { setError(error.message); setGoogleLoading(false); }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      setMessage("Check your email for a password reset link.");
    } catch (err) {
      setError(err?.message || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage("Password updated! You can now sign in.");
      await supabase.auth.signOut();
      setTimeout(() => { setMode("signIn"); setNewPassword(""); setMessage(""); }, 2000);
    } catch (err) {
      setError(err?.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");

    if (!supabase) {
      setError("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signUp") {
        if (!fullName.trim())        throw new Error("Please enter your full name.");
        if (!babyName.trim())        throw new Error("Please enter your baby's name.");
        if (!babyDob)                throw new Error("Please select baby date of birth.");
        if (password.length < 8)     throw new Error("Password must be at least 8 characters.");

        const { data, error } = await supabase.auth.signUp({
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
        if (data?.user?.identities?.length === 0) {
          setMessage("Check your email — if this address is new, you'll receive a confirmation link.");
          return;
        }
        setMessage("Account created! Check your email to confirm, then sign in.");
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

  const switchMode = (next) => { setError(""); setMessage(""); setMode(next); };

  // ── Reset password (after clicking email link) ──
  if (mode === "resetPassword") {
    return (
      <div className="page">
        <div className="login-wrapper">
          <div className="login-card">
            <span className="eyebrow eo">Reset password</span>
            <h2>Set a new password</h2>
            <form onSubmit={handleResetPassword} className="login-form">
              <input
                className="input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 8 chars)"
                minLength={8}
                required
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Updating…" : "Set new password"}
              </button>
            </form>
            {error   && <p style={{ color: "#c0392b", marginTop: 12, fontSize: "0.88rem" }}>{error}</p>}
            {message && <p style={{ color: "var(--green-dark)", marginTop: 12, fontSize: "0.88rem" }}>{message}</p>}
          </div>
        </div>
      </div>
    );
  }

  // ── Forgot password ──
  if (mode === "forgotPassword") {
    return (
      <div className="page">
        <div className="login-wrapper">
          <div className="login-card">
            <span className="eyebrow eo">Forgot password</span>
            <h2>Reset your password</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", marginBottom: 12 }}>
              Enter your email and we'll send you a reset link.
            </p>
            <form onSubmit={handleForgotPassword} className="login-form">
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
            {error   && <p style={{ color: "#c0392b", marginTop: 12, fontSize: "0.88rem" }}>{error}</p>}
            {message && <p style={{ color: "var(--green-dark)", marginTop: 12, fontSize: "0.88rem" }}>{message}</p>}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => switchMode("signIn")}
              style={{ marginTop: 12, width: "100%" }}
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Sign in / Sign up ──
  return (
    <div className="page">
      <div className="login-wrapper">
        <div className="login-card">
          <span className="eyebrow eo">{mode === "signIn" ? "Welcome back" : "Join Baby Bites"}</span>
          <h2>{mode === "signIn" ? "Sign in" : "Create account"}</h2>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              gap: 10, padding: "10px 16px", borderRadius: 12, cursor: "pointer",
              border: "1.5px solid var(--border)", background: "var(--white)",
              fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: "0.92rem",
              color: "var(--dark)", marginBottom: 4,
              transition: "box-shadow 0.15s",
            }}
          >
            <GoogleIcon />
            {googleLoading ? "Redirecting…" : "Continue with Google"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: "0.78rem", color: "var(--muted)", fontWeight: 600, whiteSpace: "nowrap" }}>or continue with email</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

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
              placeholder={mode === "signUp" ? "Password (min 8 chars)" : "Password"}
              required
              minLength={mode === "signUp" ? 8 : undefined}
            />

            {mode === "signIn" && (
              <button
                type="button"
                onClick={() => switchMode("forgotPassword")}
                style={{
                  alignSelf: "flex-end", background: "none", border: "none",
                  color: "var(--orange-dark)", fontFamily: "Nunito, sans-serif",
                  fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", padding: 0,
                  marginTop: -4,
                }}
              >
                Forgot password?
              </button>
            )}

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
            onClick={() => switchMode(mode === "signIn" ? "signUp" : "signIn")}
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
