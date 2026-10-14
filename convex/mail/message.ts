export const FROM_NAME = "Makes' 30th";
export const CODE_TTL_MINUTES = 10;

export interface MailMessage {
  subject: string;
  text: string;
  html: string;
}

export function buildMessage(code: string): MailMessage {
  const text = [
    "Your verification code for Makes' 30th is:",
    "",
    code,
    "",
    `It expires in ${CODE_TTL_MINUTES} minutes. If you didn't ask for it, you can ignore this email.`,
  ].join("\n");
  const html = `<div style="font-family:system-ui,sans-serif;font-size:16px;color:#111">
<p>Your verification code for Makes' 30th is:</p>
<p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</p>
<p>It expires in ${CODE_TTL_MINUTES} minutes. If you didn't ask for it, you can ignore this email.</p>
</div>`;
  return { subject: "Your RSVP verification code", text, html };
}
