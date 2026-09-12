import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export async function sendPasswordResetEmail({ email, token }) {
  const resetUrl = `${config.authResetUrl}?token=${encodeURIComponent(token)}`;

  if (!config.resendApiKey) {
    if (config.nodeEnv === 'development') {
      logger.warn(
        { event: 'auth.reset_email_not_configured', email },
        'Password reset email provider is not configured',
      );
      return;
    }
    throw new Error('Password reset email provider is not configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.mailFrom,
      to: [email],
      subject: 'Reset your URL Notes password',
      text: `Reset your password using this link: ${resetUrl}`,
    }),
  });

  if (!response.ok) {
    throw new Error('Password reset email could not be sent');
  }
}
