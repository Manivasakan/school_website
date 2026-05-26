/**
 * Brevo (Sendinblue) transactional email via HTTP API.
 * Works on Cloudflare Workers / edge runtime (uses fetch, no Node TCP).
 * Get an API key from https://app.brevo.com/ → SMTP & API → API keys
 */
export async function sendEmail(opts: {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  replyTo?: { email: string; name?: string };
}) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY not set");

  const fromEmail = process.env.SMTP_FROM || "no-reply@school.lk";
  const fromName = process.env.SEED_SCHOOL_NAME || "School";

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: opts.to,
      replyTo: opts.replyTo,
      subject: opts.subject,
      htmlContent: opts.htmlContent,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo send failed (${res.status}): ${body}`);
  }
  return res.json();
}
