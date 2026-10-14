"use node";
import nodemailer from "nodemailer";
import { buildMessage, FROM_NAME } from "./message";
import { resolveProvider } from "./provider";

/**
 * Sends the verification code via the provider named by MAIL_PROVIDER.
 * "gmail" uses GMAIL_USER + GMAIL_APP_PASSWORD; "mock" logs the code and also needs MAIL_ALLOW_MOCK=true (local dev only).
 * Returns false for an unknown/unset provider or missing credentials.
 */
export async function sendCodeEmail(to: string, code: string): Promise<boolean> {
  const provider = resolveProvider(process.env.MAIL_PROVIDER, process.env.MAIL_ALLOW_MOCK);
  if (provider === "mock") {
    console.log(`[mail:mock] code for ${to}: ${code}`);
    return true;
  }
  if (provider === "gmail") {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) return false;
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
    const msg = buildMessage(code);
    await transport.sendMail({
      from: { name: FROM_NAME, address: user },
      to,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
    });
    return true;
  }
  return false;
}
