import nodemailer from "nodemailer";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    throw new Error("EMAIL_USER and EMAIL_APP_PASSWORD environment variables must be set");
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
}

export async function sendMagicLinkEmail(
  to: string,
  token: string
): Promise<void> {
  const magicLink = `${APP_URL}/magic-login?token=${token}`;
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"Magic Link Auth" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Secure Login Link",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7C3AED;">Sign in to your account</h2>
        <p>Click the button below to securely sign in. No password needed!</p>
        <a href="${magicLink}" 
           style="display: inline-block; padding: 12px 24px; background-color: #7C3AED; 
                  color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Sign In Now
        </a>
        <p style="color: #64748B; font-size: 14px;">
          This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.
        </p>
        <p style="color: #64748B; font-size: 12px;">
          Or copy this link: ${magicLink}
        </p>
      </div>
    `,
  });
}
