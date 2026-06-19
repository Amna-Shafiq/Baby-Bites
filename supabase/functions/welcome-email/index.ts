const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM = "Baby Bites <hello@babybites.net>";

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const email = payload.record?.email;
    if (!email) return new Response("No email", { status: 400 });

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Baby Bites</title>
</head>
<body style="margin:0;padding:0;background:#FFFAF7;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFAF7;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:580px;background:#ffffff;border-radius:20px;overflow:hidden;border:1.5px solid #f0e0d0;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#FF8C42,#E8623A);padding:40px 32px;text-align:center;">
              <p style="margin:0;font-size:2.4rem;">🥕</p>
              <h1 style="margin:10px 0 4px;color:#fff;font-size:1.7rem;font-weight:800;letter-spacing:-0.5px;">Baby Bites</h1>
              <p style="margin:0;color:rgba(255,255,255,0.9);font-size:0.95rem;font-weight:500;">Let's feed your little one with confidence</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:36px 36px 0;">
              <h2 style="margin:0 0 16px;font-size:1.2rem;color:#2d1a0e;font-weight:800;">Hi there, welcome to Baby Bites! 🎉</h2>
              <p style="margin:0 0 16px;color:#5a3e2b;font-size:0.95rem;line-height:1.75;">
                We're so glad you're here. To get the most personalised experience, make sure you've completed your baby's profile — including their date of birth, any allergies and dietary preferences. The more we know about your little one, the better we can tailor meal suggestions, food safety guidance and age-appropriate recipes just for them.
              </p>
            </td>
          </tr>

          <!-- A few things to know -->
          <tr>
            <td style="padding:24px 36px 0;">
              <p style="margin:0 0 16px;font-size:0.8rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#b07040;">A few things to know</p>
              <p style="margin:0 0 12px;color:#5a3e2b;font-size:0.92rem;line-height:1.75;">
                <span style="color:#E8623A;font-weight:700;">→</span> Our food and meal database is updated regularly with new recipes, safety information and Pakistani-specific guidance reviewed by feeding specialists.
              </p>
              <p style="margin:0 0 12px;color:#5a3e2b;font-size:0.92rem;line-height:1.75;">
                <span style="color:#E8623A;font-weight:700;">→</span> All content follows WHO guidelines. We take accuracy seriously because your baby's health matters.
              </p>
              <p style="margin:0 0 12px;color:#5a3e2b;font-size:0.92rem;line-height:1.75;">
                <span style="color:#E8623A;font-weight:700;">→</span> We're still growing and improving every day. If something looks off or you have a suggestion, we genuinely want to hear it.
              </p>
              <p style="margin:0;color:#5a3e2b;font-size:0.92rem;line-height:1.75;">
                This is a no-reply email, but you can always reach us through the <strong style="color:#2d1a0e;">Contact Us</strong> section on the website. We read every message and will get back to you.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:28px 36px;">
              <div style="text-align:center;">
                <a href="https://babybites.net" style="display:inline-block;background:linear-gradient(135deg,#FF8C42,#E8623A);color:#fff;font-weight:800;font-size:0.95rem;padding:14px 36px;border-radius:50px;text-decoration:none;letter-spacing:0.02em;">
                  Open Baby Bites →
                </a>
              </div>
            </td>
          </tr>

          <!-- Sign-off -->
          <tr>
            <td style="padding:24px 36px 32px;">
              <p style="margin:0 0 4px;color:#5a3e2b;font-size:0.95rem;line-height:1.75;">
                Thank you for trusting Baby Bites with something as important as your baby's first foods. We're honoured to be part of this journey with you. 🧡
              </p>
              <p style="margin:16px 0 0;color:#5a3e2b;font-size:0.92rem;line-height:1.6;">
                With love,<br />
                <strong style="color:#2d1a0e;">Amna</strong><br />
                <span style="color:#a07860;font-size:0.85rem;">Founder, Baby Bites</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fff8f3;padding:18px 36px;border-top:1.5px solid #f0e0d0;text-align:center;">
              <p style="margin:0;color:#a07860;font-size:0.78rem;line-height:1.6;">
                <a href="https://babybites.net" style="color:#E8623A;text-decoration:none;font-weight:700;">babybites.net</a>
              </p>
              <p style="margin:6px 0 0;color:#c0a090;font-size:0.72rem;line-height:1.5;">
                You're receiving this because you created an account on Baby Bites.<br />This is a no-reply email — please use the Contact Us page to reach us.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        subject: "Welcome to Baby Bites 🥕 — Let's feed your little one with confidence",
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return new Response(err, { status: 500 });
    }

    return new Response("sent", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(String(err), { status: 500 });
  }
});
