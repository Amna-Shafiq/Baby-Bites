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
        <table width="100%" style="max-width:560px;background:#fff;border-radius:20px;overflow:hidden;border:1.5px solid #f0e0d0;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#FF8C42,#E8623A);padding:36px 32px;text-align:center;">
              <p style="margin:0;font-size:2.2rem;">🍼</p>
              <h1 style="margin:10px 0 4px;color:#fff;font-size:1.6rem;font-weight:800;letter-spacing:-0.5px;">Baby Bites</h1>
              <p style="margin:0;color:rgba(255,255,255,0.88);font-size:0.95rem;font-weight:500;">Your baby food companion</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 12px;font-size:1.25rem;color:#2d1a0e;font-weight:800;">Welcome! So glad you're here 🧡</h2>
              <p style="margin:0 0 16px;color:#5a3e2b;font-size:0.95rem;line-height:1.7;">
                Baby Bites is a calm, reliable space built for parents navigating first foods, weaning, and everything in between.
              </p>
              <p style="margin:0 0 24px;color:#5a3e2b;font-size:0.95rem;line-height:1.7;">
                Here's what you can do straight away:
              </p>

              <!-- Feature list -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f5ece4;">
                    <span style="font-size:1.1rem;">🥦</span>
                    <strong style="color:#2d1a0e;margin-left:8px;">Browse 100+ foods</strong>
                    <p style="margin:2px 0 0 28px;color:#7a5a44;font-size:0.85rem;">Safe-from ages, texture tips and allergen guidance</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f5ece4;">
                    <span style="font-size:1.1rem;">🍛</span>
                    <strong style="color:#2d1a0e;margin-left:8px;">Explore baby meals</strong>
                    <p style="margin:2px 0 0 28px;color:#7a5a44;font-size:0.85rem;">Purees, finger foods and family-friendly recipes</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f5ece4;">
                    <span style="font-size:1.1rem;">🛒</span>
                    <strong style="color:#2d1a0e;margin-left:8px;">Check your Pantry</strong>
                    <p style="margin:2px 0 0 28px;color:#7a5a44;font-size:0.85rem;">See which meals you can make with what you have</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;">
                    <span style="font-size:1.1rem;">📋</span>
                    <strong style="color:#2d1a0e;margin-left:8px;">Log what your baby eats</strong>
                    <p style="margin:2px 0 0 28px;color:#7a5a44;font-size:0.85rem;">Track reactions and build a feeding history</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <div style="text-align:center;margin:28px 0 8px;">
                <a href="https://babybites.net" style="display:inline-block;background:linear-gradient(135deg,#FF8C42,#E8623A);color:#fff;font-weight:800;font-size:0.95rem;padding:14px 32px;border-radius:50px;text-decoration:none;letter-spacing:0.02em;">
                  Get started →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fff8f3;padding:20px 32px;border-top:1.5px solid #f0e0d0;text-align:center;">
              <p style="margin:0;color:#a07860;font-size:0.78rem;line-height:1.6;">
                Made with love by Amna · <a href="https://babybites.net" style="color:#E8623A;text-decoration:none;">babybites.net</a>
              </p>
              <p style="margin:6px 0 0;color:#c0a090;font-size:0.72rem;">
                You're receiving this because you signed up to Baby Bites.
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
        subject: "Welcome to Baby Bites 🍼",
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
