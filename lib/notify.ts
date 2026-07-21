import { Resend } from 'resend';
import twilio from 'twilio';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

export type SendResult = { sent: boolean; reason?: string };

export async function sendEmail(to: string, subject: string, body: string): Promise<SendResult> {
  if (!resend) {
    return { sent: false, reason: 'RESEND_API_KEY not configured — message drafted but not sent.' };
  }
  if (!to) {
    return { sent: false, reason: 'No email address on file for this client.' };
  }

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'studio@resend.dev',
    to,
    subject,
    text: body,
  });

  return { sent: true };
}

export async function sendSms(to: string, body: string): Promise<SendResult> {
  if (!twilioClient || !process.env.TWILIO_FROM_NUMBER) {
    return { sent: false, reason: 'Twilio not configured — message drafted but not sent.' };
  }
  if (!to) {
    return { sent: false, reason: 'No phone number on file for this client.' };
  }

  await twilioClient.messages.create({
    to,
    from: process.env.TWILIO_FROM_NUMBER,
    body,
  });

  return { sent: true };
}

// Picks SMS if a phone number is available, otherwise falls back to email.
export async function sendBestChannel(
  client: { email?: string | null; phone?: string | null },
  subject: string,
  body: string
): Promise<SendResult & { channel: 'sms' | 'email' }> {
  if (client.phone) {
    const result = await sendSms(client.phone, body);
    return { ...result, channel: 'sms' };
  }
  const result = await sendEmail(client.email || '', subject, body);
  return { ...result, channel: 'email' };
}
