import { useEffect, useState } from "react";

function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed or installed
    if (localStorage.getItem("pwa_dismissed")) return;

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa_dismissed", "1");
    setVisible(false);
  };

  if (!visible || installed) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: "var(--white)", borderTop: "1.5px solid var(--border)",
      padding: "1rem 1.25rem", display: "flex", alignItems: "center",
      gap: 12, boxShadow: "0 -4px 20px rgba(45,36,22,0.10)",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, overflow: "hidden", flexShrink: 0,
        border: "1.5px solid var(--border)",
      }}>
        <img src="/pwa-192x192.png" alt="Baby Bites" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem", color: "var(--dark)" }}>
          Add Baby Bites to Home Screen
        </p>
        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--muted)" }}>
          Quick access while cooking — works offline too
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: "none", border: "1.5px solid var(--border)",
            borderRadius: 10, padding: "6px 12px", cursor: "pointer",
            fontSize: "0.82rem", fontWeight: 600, color: "var(--muted)",
          }}
        >
          Not now
        </button>
        <button
          type="button"
          onClick={handleInstall}
          style={{
            background: "var(--orange)", border: "none",
            borderRadius: 10, padding: "6px 14px", cursor: "pointer",
            fontSize: "0.82rem", fontWeight: 700, color: "var(--white)",
          }}
        >
          Install
        </button>
      </div>
    </div>
  );
}

export default InstallPrompt;
