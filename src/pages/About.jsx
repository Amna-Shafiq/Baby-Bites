import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";

const TEAM = [
  { name: "Amna Shafiq", role: "Co-Founder", photo: "/AmnaShafiq.JPG" },
];

const VALUES = [
  { emoji: "🔬", title: "Evidence-based", desc: "Every piece of guidance is grounded in current paediatric nutrition research, not trends or guesswork." },
  { emoji: "🌍", title: "Inclusive",      desc: "Built for families across Pakistan and beyond — multilingual, culturally relevant, and accessible to all." },
  { emoji: "❤️", title: "Parent-first",   desc: "We design for tired parents making fast decisions." },
  { emoji: "🔒", title: "Safe by default", desc: "Age gating, allergen flags, and safety articles are built into the core." },
];

const STORY_PARAGRAPHS = [
  "Like many first-time parents, I quickly realized that starting solids and feeding a baby can feel overwhelming. Between conflicting advice online, endless social media opinions, and trying to figure out what was actually safe, nutritious, and age-appropriate, I often found myself searching for answers late at night while caring for my little one.",
  "My husband and I are raising our baby away from family, without the day-to-day support system many parents rely on. That meant learning everything ourselves — from first foods and textures to allergens, meal ideas, feeding schedules, and nutrition. I started collecting notes, saving meal ideas, researching ingredients, tracking reactions, and documenting what worked for us.",
  "What began as a personal collection of feeding information slowly turned into something bigger: a digital diary for our parenting journey. Baby Bites was created from that experience.",
  "I wanted a calm, simple, and reliable space where parents could explore baby foods, discover meal ideas, learn about nutrition, and feel a little less overwhelmed during the journey of feeding their little ones. My goal was to build something practical and comforting — the kind of app I wished I had when I was starting out.",
  "As both a software engineer and a mother, I've poured my heart into creating Baby Bites with care, intention, and empathy for real parents navigating real life. Every feature is designed with busy, tired parents in mind — because I am one too.",
  "Baby Bites is still growing and evolving alongside our own journey, and I'm so grateful you're here to be part of it. I truly hope this little corner of the internet helps make feeding your baby feel easier, more joyful, and a little less lonely. 🤍",
];

// Replace YOUR_FORM_ID with the ID from formspree.io/f/YOUR_FORM_ID
const FORMSPREE_URL = "https://formspree.io/f/YOUR_FORM_ID";

function ContactForm() {
  const [fields, setFields] = useState({ firstName: "", lastName: "", email: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | success | error

  const set = (key, val) => setFields(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch(FORMSPREE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          firstName: fields.firstName,
          lastName:  fields.lastName,
          email:     fields.email,
          message:   fields.message,
        }),
      });
      if (res.ok) {
        setStatus("success");
        setFields({ firstName: "", lastName: "", email: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div style={{ background: "#d5f5e3", border: "1.5px solid #52c490", borderRadius: 12, padding: "1rem 1.25rem" }}>
        <p style={{ margin: 0, fontWeight: 700, color: "#1a7a45", fontSize: "0.95rem" }}>
          Message sent! We'll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <input
          className="input"
          placeholder="First name"
          value={fields.firstName}
          onChange={e => set("firstName", e.target.value)}
          required
        />
        <input
          className="input"
          placeholder="Last name"
          value={fields.lastName}
          onChange={e => set("lastName", e.target.value)}
          required
        />
      </div>
      <input
        className="input"
        type="email"
        placeholder="Email address"
        value={fields.email}
        onChange={e => set("email", e.target.value)}
        required
      />
      <textarea
        className="input"
        placeholder="How can we help?"
        value={fields.message}
        onChange={e => set("message", e.target.value)}
        rows={4}
        style={{ resize: "vertical" }}
        required
      />
      {status === "error" && (
        <p style={{ margin: 0, fontSize: "0.82rem", color: "#c0392b", fontWeight: 600 }}>
          Something went wrong — please try emailing us directly.
        </p>
      )}
      <button
        type="submit"
        className="btn btn-primary"
        disabled={status === "sending"}
        style={{ alignSelf: "flex-start" }}
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

function About() {
  useEffect(() => {
    document.body.classList.add("page-warm-bg");
    return () => document.body.classList.remove("page-warm-bg");
  }, []);

  return (
    <div className="page">
      <Helmet>
        <title>About Baby Bites | Our Story</title>
        <meta name="description" content="Baby Bites was built by Amna — a software engineer and mama who wanted a calm, reliable space for parents navigating baby feeding." />
      </Helmet>

      {/* ── Our Story ── */}
      <div style={{ margin: "2rem 0 2.5rem", textAlign: "center" }}>
        <p style={{ margin: "0 0 0.25rem", fontSize: "1.35rem", fontWeight: 800, color: "var(--dark)" }}>Hi, I'm Amna</p>
        <p style={{ margin: "0 0 1.5rem", fontSize: "1.05rem", fontWeight: 600, color: "var(--muted)", lineHeight: 1.6 }}>
          A software engineer, a mama, and the creator of Baby Bites.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 680, margin: "0 auto" }}>
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

      {/* ── Contact ── */}
      <div className="panel" style={{ marginBottom: "1.25rem" }}>
        <span className="eyebrow eo">Get in touch</span>
        <h2 style={{ margin: "0.3rem 0 0.4rem" }}>Contact us</h2>
        <p style={{ margin: "0 0 1.25rem", fontSize: "0.9rem", color: "var(--muted)", lineHeight: 1.6 }}>
          Email us directly at{" "}
          <a href="mailto:contactus.babybites@gmail.com" style={{ color: "var(--orange-dark)", fontWeight: 700 }}>
            contactus.babybites@gmail.com
          </a>{" "}
          or fill in the form below and we'll get back to you.
        </p>
        <ContactForm />
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

      {/* ── Team ── */}
      <div style={{ marginBottom: "2.5rem" }}>
        <span className="eyebrow eo">The people</span>
        <h2 style={{ margin: "0.3rem 0 1.25rem" }}>Who we are</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 20 }}>
          {TEAM.map((member) => (
            <div key={member.name} style={{ display: "flex", flexDirection: "column" }}>
              <img
                src={member.photo}
                alt={member.name}
                style={{
                  width: "100%", aspectRatio: "1/1", objectFit: "cover",
                  borderRadius: 12, display: "block",
                  marginBottom: 10,
                }}
              />
              <p style={{ margin: "0 0 2px", fontWeight: 800, fontSize: "0.95rem", color: "var(--dark)" }}>
                {member.name}
              </p>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)", fontWeight: 500 }}>
                {member.role}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default About;
