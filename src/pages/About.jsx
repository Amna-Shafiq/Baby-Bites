import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useForm, ValidationError } from "@formspree/react";
import { Helmet } from "react-helmet-async";
import ReminderSignup from "../components/ReminderSignup";

const TEAM = [
  { name: "Amna Shafiq", role: "Founder and Lead Developer", photo: "/AmnaShafiq.JPG" },
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

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes between submissions
const STORAGE_KEY = "bb_contact_last_sent";

function ContactForm() {
  const [state, handleSubmit] = useForm("xbdekwlb");
  const [cooldownLeft, setCooldownLeft] = useState(() => {
    const last = Number(localStorage.getItem(STORAGE_KEY) || 0);
    const remaining = COOLDOWN_MS - (Date.now() - last);
    return remaining > 0 ? remaining : 0;
  });

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const interval = setInterval(() => {
      setCooldownLeft((prev) => {
        const next = prev - 1000;
        return next <= 0 ? 0 : next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownLeft]);

  const onSubmit = (e) => {
    if (cooldownLeft > 0) { e.preventDefault(); return; }
    handleSubmit(e);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setCooldownLeft(COOLDOWN_MS);
  };

  const minutesLeft = Math.ceil(cooldownLeft / 60000);

  if (state.succeeded) {
    return (
      <div style={{ background: "#d5f5e3", border: "1.5px solid #52c490", borderRadius: 12, padding: "1rem 1.25rem" }}>
        <p style={{ margin: 0, fontWeight: 700, color: "#1a7a45", fontSize: "0.95rem" }}>
          Message sent! We'll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <input className="input" type="text" name="firstName" placeholder="First name" required />
        <input className="input" type="text" name="lastName"  placeholder="Last name"  required />
      </div>
      <input className="input" type="email" name="email" placeholder="Email address" required />
      <ValidationError field="email" errors={state.errors} style={{ fontSize: "0.8rem", color: "#c0392b" }} />
      <textarea
        className="input"
        name="message"
        placeholder="How can we help?"
        rows={4}
        style={{ resize: "vertical" }}
        required
      />
      <ValidationError field="message" errors={state.errors} style={{ fontSize: "0.8rem", color: "#c0392b" }} />
      {cooldownLeft > 0 && (
        <p style={{ margin: 0, fontSize: "0.82rem", color: "#c0392b", fontWeight: 600 }}>
          Please wait {minutesLeft} minute{minutesLeft !== 1 ? "s" : ""} before sending another message.
        </p>
      )}
      <button
        type="submit"
        className="btn btn-primary"
        disabled={state.submitting || cooldownLeft > 0}
        style={{ alignSelf: "flex-start", opacity: cooldownLeft > 0 ? 0.5 : 1 }}
      >
        {state.submitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

function About() {
  const { hash } = useLocation();

  useEffect(() => {
    document.body.classList.add("page-warm-bg");
    return () => document.body.classList.remove("page-warm-bg");
  }, []);

  useEffect(() => {
    if (!hash) return;
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  return (
    <div className="page">
      <Helmet>
        <title>About Baby Bites | Baby Food and Weaning Guides for Parents</title>
        <meta name="description" content="Baby Bites was built by Amna, a software engineer and mama who created a calm, reliable space for parents navigating baby food, weaning, and first foods." />
        <meta property="og:type"        content="website" />
        <meta property="og:site_name"   content="Baby Bites" />
        <meta property="og:url"         content="https://babybites.net/about" />
        <meta property="og:title"       content="About Baby Bites | Baby Food and Weaning Guides for Parents" />
        <meta property="og:description" content="Baby Bites was built by Amna, a software engineer and mama who created a calm, reliable space for parents navigating baby food, weaning, and first foods." />
        <meta property="og:image"       content="https://babybites.net/AmnaShafiq.JPG" />
        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:title"       content="About Baby Bites | Baby Food and Weaning Guides for Parents" />
        <meta name="twitter:description" content="Baby Bites was built by Amna, a software engineer and mama who created a calm, reliable space for parents navigating baby food, weaning, and first foods." />
        <meta name="twitter:image"       content="https://babybites.net/AmnaShafiq.JPG" />
      </Helmet>

      {/* ── Our Story ── */}
      <div style={{ margin: "2rem 0 2.5rem", textAlign: "center" }}>
        <span className="eyebrow eo">Our story</span>
        <h1 style={{ marginBottom: "1rem" }}>About Baby Bites</h1>
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

      {/* ── Reminder signup ── */}
      <div style={{ marginBottom: "1.25rem" }}>
        <ReminderSignup />
      </div>

      {/* ── Contact ── */}
      <div id="contact" className="panel" style={{ marginBottom: "1.25rem" }}>
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
      <div id="disclaimer" className="panel" style={{ marginBottom: "2rem", background: "var(--card-bg)", border: "1.5px solid var(--border)" }}>
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
