import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

const SECTIONS = [
  {
    num: "1",
    title: "Information We Collect",
    content: (
      <>
        <p style={{ margin: "0 0 0.75rem" }}>
          Baby Bites may collect the following information to provide personalised baby feeding and meal-planning features:
        </p>
        <p style={{ margin: "0 0 0.4rem", fontWeight: 700, fontSize: "0.92rem" }}>Parent / Guardian Information</p>
        <ul style={{ margin: "0 0 1rem", paddingLeft: "1.25rem", lineHeight: 1.8 }}>
          <li>Name</li>
          <li>Email address</li>
          <li>Account login details</li>
          <li>Preferences and settings</li>
        </ul>
        <p style={{ margin: "0 0 0.4rem", fontWeight: 700, fontSize: "0.92rem" }}>Baby Information</p>
        <ul style={{ margin: "0 0 0", paddingLeft: "1.25rem", lineHeight: 1.8 }}>
          <li>Baby's first name or nickname</li>
          <li>Age or date of birth</li>
          <li>Feeding preferences</li>
          <li>Allergies and sensitivities</li>
          <li>Saved meals, foods, and progress tracking</li>
          <li>Notes added by parents or caregivers</li>
        </ul>
        <p style={{ margin: "0.75rem 0 0", fontSize: "0.88rem" }}>
          We only collect information necessary to provide the functionality of the app.
        </p>
      </>
    ),
  },
  {
    num: "2",
    title: "How We Use Your Information",
    content: (
      <>
        <p style={{ margin: "0 0 0.75rem" }}>We use collected information solely to:</p>
        <ul style={{ margin: "0 0 1rem", paddingLeft: "1.25rem", lineHeight: 1.8 }}>
          <li>Provide and improve the Baby Bites experience</li>
          <li>Personalise meal recommendations and food tracking</li>
          <li>Save your baby's feeding progress and preferences</li>
          <li>Help parents manage feeding schedules and food introductions</li>
          <li>Maintain account security and platform functionality</li>
        </ul>
        <p style={{ margin: 0 }}>
          We do <strong>not</strong> sell, rent, or share your personal data or your child's data with advertisers or third parties for marketing purposes.
        </p>
      </>
    ),
  },
  {
    num: "3",
    title: "Children's Privacy",
    content: (
      <>
        <p style={{ margin: "0 0 0.75rem" }}>
          Baby Bites is designed for use by parents and guardians. We do not knowingly allow children to create accounts independently.
        </p>
        <p style={{ margin: 0 }}>
          Any baby-related information stored in the app is provided voluntarily by a parent or legal guardian for personal tracking and meal-planning purposes.
        </p>
      </>
    ),
  },
  {
    num: "4",
    title: "Data Storage and Security",
    content: (
      <>
        <p style={{ margin: "0 0 0.75rem" }}>
          We take reasonable technical and organisational measures to protect your information from unauthorised access, loss, misuse, or disclosure.
        </p>
        <p style={{ margin: 0 }}>
          While we work hard to protect your data, no online platform or storage system can guarantee absolute security.
        </p>
      </>
    ),
  },
  {
    num: "5",
    title: "Data Sharing",
    content: (
      <>
        <p style={{ margin: "0 0 0.75rem" }}>
          We do not share your personal information or baby-related data with third parties except:
        </p>
        <ul style={{ margin: "0 0 0.75rem", paddingLeft: "1.25rem", lineHeight: 1.8 }}>
          <li>When required by law</li>
          <li>To protect the safety, rights, or security of Baby Bites or its users</li>
          <li>With trusted service providers necessary to operate the platform (such as secure hosting or authentication services)</li>
        </ul>
        <p style={{ margin: 0 }}>
          These providers are only given access to information required for platform functionality.
        </p>
      </>
    ),
  },
  {
    num: "6",
    title: "Your Rights and Control",
    content: (
      <>
        <p style={{ margin: "0 0 0.75rem" }}>You may:</p>
        <ul style={{ margin: "0 0 0.75rem", paddingLeft: "1.25rem", lineHeight: 1.8 }}>
          <li>Access or update your account information</li>
          <li>Edit or remove baby-related data</li>
          <li>Request deletion of your account and stored information</li>
          <li>Contact us regarding privacy concerns</li>
        </ul>
        <p style={{ margin: 0 }}>We will make reasonable efforts to process deletion requests promptly.</p>
      </>
    ),
  },
  {
    num: "7",
    title: "Cookies and Analytics",
    content: (
      <>
        <p style={{ margin: "0 0 0.75rem" }}>Baby Bites may use cookies or similar technologies to:</p>
        <ul style={{ margin: "0 0 0.75rem", paddingLeft: "1.25rem", lineHeight: 1.8 }}>
          <li>Keep users signed in</li>
          <li>Improve app performance</li>
          <li>Understand general usage trends</li>
        </ul>
        <p style={{ margin: 0 }}>
          We do not use invasive tracking or advertising cookies targeted at children.
        </p>
      </>
    ),
  },
  {
    num: "8",
    title: "Third-Party Services",
    content: (
      <p style={{ margin: 0 }}>
        Baby Bites may use third-party tools or infrastructure providers for hosting, authentication, analytics, or payment processing.
        These services may process limited information necessary to operate the platform securely.
        We encourage users to review the privacy policies of any third-party services connected to the app.
      </p>
    ),
  },
  {
    num: "10",
    title: "Changes to This Privacy Policy",
    content: (
      <>
        <p style={{ margin: "0 0 0.75rem" }}>
          We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date.
        </p>
        <p style={{ margin: 0 }}>
          Continued use of Baby Bites after changes are posted constitutes acceptance of the updated policy.
        </p>
      </>
    ),
  },
];

function PrivacyPolicy() {
  useEffect(() => {
    document.body.classList.add("page-warm-bg");
    return () => document.body.classList.remove("page-warm-bg");
  }, []);

  return (
    <div className="page">
      <Helmet>
        <title>Privacy Policy | Baby Bites</title>
        <meta name="description" content="Privacy Policy for Baby Bites — how we collect, use, and protect your information." />
      </Helmet>

      <div style={{ margin: "2rem 0 1rem" }}>
        <span className="eyebrow eo">Legal</span>
        <h1 style={{ margin: "0.3rem 0 0.25rem", fontSize: "1.6rem" }}>Privacy Policy</h1>
        <p className="muted" style={{ margin: "0 0 2rem", fontSize: "0.85rem" }}>Last updated: May 15, 2026</p>

        <p style={{ margin: "0 0 2rem", fontSize: "0.95rem", color: "var(--muted)", lineHeight: 1.75 }}>
          Welcome to Baby Bites. Your privacy and your child's safety are important to us. This Privacy Policy explains how we collect, use, store, and protect information when you use our platform. By using Baby Bites, you agree to the practices described in this policy.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {SECTIONS.map((sec) => (
            <div key={sec.num} className="card" style={{ padding: "1.25rem 1.5rem" }}>
              <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem", color: "var(--dark)" }}>
                <span style={{ color: "var(--orange-dark)", marginRight: 6 }}>{sec.num}.</span>
                {sec.title}
              </h2>
              <div style={{ fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.75 }}>
                {sec.content}
              </div>
            </div>
          ))}
        </div>

        <div className="panel" style={{ marginTop: "1.5rem", marginBottom: "2rem" }}>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.75 }}>
            For any privacy-related questions or requests, please contact us at{" "}
            <a href="mailto:contactus.babybites@gmail.com" style={{ color: "var(--orange-dark)", fontWeight: 700 }}>
              contactus.babybites@gmail.com
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
