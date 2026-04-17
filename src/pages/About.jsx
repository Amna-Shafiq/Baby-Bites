import TopNav from "../components/TopNav";

const TEAM = [
  { name: "Amna Shafiq", role: "Co-founder & Product", avatar: "👩‍💻" },
  { name: "Team Member", role: "Co-founder & Design",  avatar: "🧑‍🎨" },
];

const VALUES = [
  { emoji: "🔬", title: "Evidence-based",   desc: "Every piece of guidance is grounded in current paediatric nutrition research — not trends or guesswork." },
  { emoji: "🌍", title: "Inclusive",         desc: "Built for families across Pakistan and beyond — multilingual, culturally relevant, and accessible to all." },
  { emoji: "❤️", title: "Parent-first",      desc: "We design for tired parents making fast decisions, not for nutritionists with unlimited time." },
  { emoji: "🔒", title: "Safe by default",   desc: "Age gating, allergen flags, and safety articles are built into the core — not bolted on as an afterthought." },
];

function About() {
  return (
    <div className="page">
      <TopNav />

      {/* ── Hero ── */}
      <div style={{ margin: "2rem 0 2.5rem" }}>
        <span className="eyebrow eo">Our story</span>
        <h1 style={{ marginBottom: "0.75rem" }}>About Baby Bites</h1>
        <p style={{ fontSize: "1.05rem", color: "var(--muted)", lineHeight: 1.7, maxWidth: 560 }}>
          Placeholder — add your story here. Why you built this, what problem you saw, what moment made it click.
        </p>
      </div>

      {/* ── Vision ── */}
      <div className="panel" style={{ marginBottom: "1.25rem" }}>
        <span className="eyebrow eo">Vision</span>
        <h2 style={{ margin: "0.3rem 0 0.75rem" }}>Placeholder headline</h2>
        <p className="muted" style={{ lineHeight: 1.75 }}>
          Placeholder — describe the world you're trying to create. One or two sentences that a parent would immediately understand and care about.
        </p>
      </div>

      {/* ── Mission ── */}
      <div className="panel" style={{ marginBottom: "1.25rem" }}>
        <span className="eyebrow eo">Mission</span>
        <h2 style={{ margin: "0.3rem 0 0.75rem" }}>Placeholder headline</h2>
        <p className="muted" style={{ lineHeight: 1.75 }}>
          Placeholder — describe what Baby Bites does, for whom, and how. Keep it specific and grounded.
        </p>
      </div>

      {/* ── Values ── */}
      <div style={{ marginBottom: "1.25rem" }}>
        <span className="eyebrow eo">What we believe</span>
        <h2 style={{ margin: "0.3rem 0 1rem" }}>Our values</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {VALUES.map((v) => (
            <div key={v.title} className="card" style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.6rem", flexShrink: 0 }}>{v.emoji}</span>
              <div>
                <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: "0.92rem", color: "var(--dark)" }}>{v.title}</p>
                <p className="muted" style={{ margin: 0, fontSize: "0.82rem", lineHeight: 1.6 }}>{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Team ── */}
      <div style={{ marginBottom: "1.25rem" }}>
        <span className="eyebrow eo">The people</span>
        <h2 style={{ margin: "0.3rem 0 1rem" }}>Who we are</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {TEAM.map((member) => (
            <div key={member.name} className="card" style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 220, flex: 1 }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                background: "var(--cream)", border: "1.5px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.6rem",
              }}>
                {member.avatar}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: "0.95rem", color: "var(--dark)" }}>{member.name}</p>
                <p className="muted" style={{ margin: 0, fontSize: "0.8rem" }}>{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Contact placeholder ── */}
      <div className="panel" style={{ marginBottom: "2rem" }}>
        <span className="eyebrow eo">Get in touch</span>
        <h2 style={{ margin: "0.3rem 0 0.5rem" }}>Contact</h2>
        <p className="muted" style={{ fontSize: "0.9rem", lineHeight: 1.7 }}>
          Placeholder — add an email address, social links, or a contact form here.
        </p>
      </div>
    </div>
  );
}

export default About;
