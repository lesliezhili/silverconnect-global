import nodemailer from 'nodemailer';

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  cc?: string[];
  bcc?: string[];
}

/**
 * Email Service
 * Handles email notifications and communications
 */
export class EmailService {
  /**
   * Send email
   */
  static async send(payload: EmailPayload) {
    const { to, subject, html, cc, bcc } = payload;

    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        cc,
        bcc,
        subject,
        html,
      });

      return {
        messageId: info.messageId,
        accepted: info.accepted,
      };
    } catch (error: any) {
      throw new Error(`Email send failed: ${error.message}`);
    }
  }

  /**
   * Send booking confirmation email
   */
  static async sendBookingConfirmation(
    email: string,
    bookingDetails: any
  ) {
    const html = `
      <h2>Booking Confirmation</h2>
      <p>Your booking has been confirmed!</p>
      <ul>
        <li>Service: ${bookingDetails.service}</li>
        <li>Date: ${bookingDetails.date}</li>
        <li>Time: ${bookingDetails.time}</li>
        <li>Cost: ${bookingDetails.currency} ${bookingDetails.amount}</li>
      </ul>
      <p>Reference: ${bookingDetails.bookingId}</p>
    `;

    return this.send({
      to: email,
      subject: 'Booking Confirmation - SilverConnect Global',
      html,
    });
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(email: string, resetLink: string) {
    const html = `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    return this.send({
      to: email,
      subject: 'Password Reset - SilverConnect Global',
      html,
    });
  }

  /**
   * Send welcome email
   */
  static async sendWelcome(email: string, name: string) {
    const html = `
      <h2>Welcome to SilverConnect Global, ${name}!</h2>
      <p>We're excited to have you on board.</p>
      <p>You can now browse and book services in your country.</p>
      <p>Need help? Contact us at support@silverconnect.global</p>
    `;

    return this.send({
      to: email,
      subject: 'Welcome to SilverConnect Global',
      html,
    });
  }
}
