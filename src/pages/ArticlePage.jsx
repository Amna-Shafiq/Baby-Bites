import { useParams, useNavigate } from "react-router-dom";
import TopNav from "../components/TopNav";
import articles from "../data/articles";
import { useLanguage } from "../contexts/LanguageContext";

function ArticlePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const article = articles.find((a) => a.slug === slug);

  if (!article) return (
    <div className="page">
      <TopNav />
      <p className="muted" style={{ marginTop: "2rem" }}>Article not found.</p>
      <button className="btn" onClick={() => navigate(-1)} style={{ marginTop: 12 }}>← Go Back</button>
    </div>
  );

  return (
    <div className="page">
      <TopNav />

      <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginTop: "1.5rem", paddingLeft: 0 }}>
        {t("back")}
      </button>

      {/* ── Header ── */}
      <div style={{
        background: article.color,
        border: `1.5px solid ${article.borderColor}`,
        borderRadius: 18,
        overflow: "hidden",
        margin: "1rem 0 1.75rem",
      }}>
        {article.image && (
          <img
            src={article.image}
            alt={article.title}
            style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }}
          />
        )}
        <div style={{ padding: "1.25rem 1.5rem 1.5rem" }}>
          {!article.image && <p style={{ fontSize: "2.5rem", margin: "0 0 0.5rem" }}>{article.emoji}</p>}
          <span style={{
            fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.09em", color: article.borderColor,
          }}>
            {article.category} · {article.readTime}
          </span>
          <h1 style={{ margin: "0.4rem 0 0.6rem", fontSize: "1.6rem" }}>{article.title}</h1>
          <p className="muted" style={{ margin: 0, fontSize: "0.92rem", lineHeight: 1.6 }}>{article.summary}</p>
        </div>
      </div>

      {/* ── Content sections ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        {article.sections.map((section, idx) => {
          if (section.type === "heading") {
            return (
              <h2 key={idx} style={{ margin: 0, fontSize: "1.05rem", color: "var(--dark)" }}>
                {section.text}
              </h2>
            );
          }

          if (section.type === "body") {
            return (
              <p key={idx} className="muted" style={{ margin: 0, lineHeight: 1.7, fontSize: "0.92rem" }}>
                {section.text}
              </p>
            );
          }

          if (section.type === "list") {
            return (
              <ul key={idx} style={{ margin: 0, paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: 8 }}>
                {section.items.map((item, i) => (
                  <li key={i} className="muted" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
                    {item}
                  </li>
                ))}
              </ul>
            );
          }

          if (section.type === "steps") {
            return (
              <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {section.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{
                      flexShrink: 0, width: 26, height: 26, borderRadius: "50%",
                      background: "var(--orange)", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.78rem", fontWeight: 800,
                    }}>
                      {i + 1}
                    </span>
                    <p className="muted" style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.65, paddingTop: 3 }}>
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            );
          }

          if (section.type === "callout") {
            const isWarning = section.style === "warning";
            return (
              <div key={idx} style={{
                background: isWarning ? "#fdf0ef" : "#fffde7",
                border: `1.5px solid ${isWarning ? "#c0392b" : "#f9a825"}`,
                borderRadius: 12,
                padding: "0.9rem 1.1rem",
              }}>
                <p style={{
                  margin: 0, fontSize: "0.88rem", fontWeight: 600, lineHeight: 1.6,
                  color: isWarning ? "#c0392b" : "#7d5a00",
                }}>
                  {isWarning ? "🚨 " : "💡 "}{section.text}
                </p>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* ── References ── */}
      {article.references?.length > 0 && (
        <div style={{ marginTop: "2rem", borderTop: "1.5px solid var(--border)", paddingTop: "1.25rem" }}>
          <p style={{
            fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.09em", color: "var(--muted)", marginBottom: "0.6rem",
          }}>
            References
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {article.references.map((ref, i) => (
              <a
                key={i}
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  color: "var(--orange-dark)", fontWeight: 700, fontSize: "0.85rem",
                  textDecoration: "none",
                }}
              >
                <span style={{ fontSize: "0.9rem" }}>📖</span>
                {ref.label}
                <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>↗</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: "1.5rem", marginBottom: "2rem", borderTop: "1.5px solid var(--border)", paddingTop: "1.1rem" }}>
        <p className="muted" style={{ fontSize: "0.78rem" }}>
          This content is for general information only and does not replace professional medical advice. Always consult your paediatrician.
        </p>
      </div>
    </div>
  );
}

export default ArticlePage;
