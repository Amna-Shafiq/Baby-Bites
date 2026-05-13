import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

const TEAM = [
  { name: "Amna Shafiq",  role: "Co-Founder", initials: "AS" },
  { name: "Mohsin Jalil", role: "Co-Founder", initials: "MJ" },
];

const VALUES = [
  { emoji: "🔬", title: "Evidence-based", desc: "Every piece of guidance is grounded in current paediatric nutrition research — not trends or guesswork." },
  { emoji: "🌍", title: "Inclusive",      desc: "Built for families across Pakistan and beyond — multilingual, culturally relevant, and accessible to all." },
  { emoji: "❤️", title: "Parent-first",   desc: "We design for tired parents making fast decisions, not for nutritionists with unlimited time." },
  { emoji: "🔒", title: "Safe by default", desc: "Age gating, allergen flags, and safety articles are built into the core — not bolted on as an afterthought." },
];

const STORY_PARAGRAPHS = [
  "Like many first-time parents, I quickly realized that starting solids and feeding a baby can feel overwhelming. Between conflicting advice online, endless social media opinions, and trying to figure out what was actually safe, nutritious, and age-appropriate, I often found myself searching for answers late at night while caring for my little one.",
  "My husband and I are raising our baby away from family, without the day-to-day support system many parents rely on. That meant learning everything ourselves — from first foods and textures to allergens, meal ideas, feeding schedules, and nutrition. I started collecting notes, saving meal ideas, researching ingredients, tracking reactions, and documenting what worked for us.",
  "What began as a personal collection of feeding information slowly turned into something bigger: a digital diary for our parenting journey. Baby Bites was created from that experience.",
  "I wanted a calm, simple, and reliable space where parents could explore baby foods, discover meal ideas, learn about nutrition, and feel a little less overwhelmed during the journey of feeding their little ones. My goal was to build something practical and comforting — the kind of app I wished I had when I was starting out.",
  "As both a software engineer and a mother, I've poured my heart into creating Baby Bites with care, intention, and empathy for real parents navigating real life. Every feature is designed with busy, tired parents in mind — because I am one too.",
  "Baby Bites is still growing and evolving alongside our own journey, and I'm so grateful you're here to be part of it. I truly hope this little corner of the internet helps make feeding your baby feel easier, more joyful, and a little less lonely. 🤍",
];

function About() {
  useEffect(() => {
    document.body.classList.add("page-foods");
    return () => document.body.classList.remove("page-foods");
  }, []);

  return (
    <div className="page">
      <Helmet>
        <title>About Baby Bites | Our Story</title>
        <meta name="description" content="Baby Bites was built by Amna — a software engineer and mama who wanted a calm, reliable space for parents navigating baby feeding." />
      </Helmet>

      {/* ── Our Story ── */}
      <div style={{ margin: "2rem 0 2.5rem" }}>
        <span className="eyebrow eo">Our story</span>
        <h1 style={{ marginBottom: "1.5rem" }}>Hi, I'm Amna</h1>

        <div style={{
          display: "grid",
          gridTemplateColumns: "64px 1fr",
          gap: "0 1.25rem",
          alignItems: "start",
          marginBottom: "1.5rem",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--orange-mid), var(--orange-dark))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.6rem", color: "#fff", fontWeight: 800,
            flexShrink: 0,
          }}>
            AS
          </div>
          <p style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600, color: "var(--dark)", lineHeight: 1.6 }}>
            A software engineer, a mama, and the creator of Baby Bites.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 680 }}>
          {STORY_PARAGRAPHS.map((p, i) => (
            <p key={i} style={{ margin: 0, fontSize: "0.97rem", color: "var(--muted)", lineHeight: 1.8 }}>
              {p}
            </p>
          ))}
        </div>
      </div>

      {/* ── Values ── */}
      <div style={{ marginBottom: "2rem" }}>
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
      <div style={{ marginBottom: "2rem" }}>
        <span className="eyebrow eo">The people</span>
        <h2 style={{ margin: "0.3rem 0 1rem" }}>Who we are</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {TEAM.map((member) => (
            <div key={member.name} className="card" style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 200, flex: 1 }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, var(--orange-mid), var(--orange-dark))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.85rem", fontWeight: 800, color: "#fff",
                letterSpacing: "0.04em",
              }}>
                {member.initials}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: "0.95rem", color: "var(--dark)" }}>{member.name}</p>
                <p className="muted" style={{ margin: 0, fontSize: "0.8rem" }}>{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Contact ── */}
      <div className="panel" style={{ marginBottom: "1.25rem" }}>
        <span className="eyebrow eo">Get in touch</span>
        <h2 style={{ margin: "0.3rem 0 0.75rem" }}>Contact us</h2>
        <a
          href="mailto:contactus.babybites@gmail.com"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            color: "var(--orange-dark)", fontWeight: 700, fontSize: "0.95rem",
            textDecoration: "none",
          }}
        >
          <span>✉️</span> contactus.babybites@gmail.com
        </a>
      </div>

      {/* ── Disclaimer ── */}
      <div id="disclaimer" className="panel" style={{ marginBottom: "2rem", background: "#fffbf0", border: "1.5px solid #f5e0a0" }}>
        <span className="eyebrow eo">Legal</span>
        <h2 style={{ margin: "0.3rem 0 0.75rem" }}>Disclaimer</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.75 }}>
          <p style={{ margin: 0 }}>
            Baby Bites is designed to provide general educational information about baby nutrition, feeding, meals, allergens, and developmental milestones. The content in this app is <strong style={{ color: "var(--dark)" }}>not intended to replace professional medical advice, diagnosis, or treatment.</strong>
          </p>
          <p style={{ margin: 0 }}>
            Always consult your pediatrician, healthcare provider, or qualified medical professional regarding your child's health, nutrition, allergies, feeding concerns, or developmental needs.
          </p>
          <p style={{ margin: 0 }}>
            While we strive to provide accurate and up-to-date information, Baby Bites does not guarantee the completeness, reliability, or accuracy of any content within the app. Any actions you take based on the information provided are at your own discretion and responsibility.
          </p>
          <p style={{ margin: 0, fontWeight: 700, color: "#c0392b" }}>
            ⚠️ If your child is experiencing a medical emergency or severe allergic reaction, seek immediate medical attention or contact emergency services right away.
          </p>
        </div>
      </div>
    </div>
  );
}

export default About;
