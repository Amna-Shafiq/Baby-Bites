import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function LoginPromptModal({ onClose }) {
  const navigate = useNavigate();

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(45, 36, 22, 0.55)",
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backdropFilter: "blur(3px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--white)",
          borderRadius: 24,
          padding: "2.5rem 2rem",
          maxWidth: 400,
          width: "100%",
          position: "relative",
          textAlign: "center",
          boxShadow: "0 24px 64px rgba(45,36,22,0.18)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "var(--cream)",
            border: "1.5px solid var(--border)",
            borderRadius: "50%",
            width: 30,
            height: 30,
            cursor: "pointer",
            fontSize: "0.75rem",
            color: "var(--muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
          }}
        >
          ✕
        </button>

        {/* Icon */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "var(--orange)",
          border: "2px solid var(--orange-mid)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          margin: "0 auto 1.2rem",
        }}>
          🥕
        </div>

        {/* Heading */}
        <h2 style={{ marginBottom: "0.5rem", fontSize: "1.3rem" }}>
          Sign in to use your pantry
        </h2>
        <p style={{
          color: "var(--muted)",
          fontSize: "0.88rem",
          lineHeight: 1.6,
          marginBottom: "1.8rem",
          maxWidth: 300,
          margin: "0 auto 1.8rem",
        }}>
          Save the foods you have at home and get meal suggestions tailored to what's in your kitchen.
        </p>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.75rem", justifyContent: "center" }}
            onClick={() => navigate("/login")}
          >
            Sign in
          </button>
          <button
            className="btn"
            style={{ width: "100%", padding: "0.75rem", justifyContent: "center" }}
            onClick={() => navigate("/login")}
          >
            Create account
          </button>
          <button
            className="btn btn-ghost"
            style={{ width: "100%", justifyContent: "center", color: "var(--muted)", fontSize: "0.82rem" }}
            onClick={onClose}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPromptModal;
