const nodemailer = require("nodemailer");

const { AppError } = require("../utils/errors");

class EmailService {
  constructor(env) {
    this.env = env;
    this.transporter = env.mailEnabled ? this.createTransporter() : null;
  }

  isConfigured() {
    return Boolean(this.transporter);
  }

  createTransporter() {
    const {
      gmailUser,
      gmailAppPassword,
      gmailOauthClientId,
      gmailOauthClientSecret,
      gmailOauthRefreshToken
    } = this.env;

    if (gmailOauthClientId && gmailOauthClientSecret && gmailOauthRefreshToken) {
      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: gmailUser,
          clientId: gmailOauthClientId,
          clientSecret: gmailOauthClientSecret,
          refreshToken: gmailOauthRefreshToken
        }
      });
    }

    if (gmailAppPassword) {
      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailAppPassword
        }
      });
    }

    throw new Error(
      "Email is enabled, but no Gmail credentials were found. Configure GMAIL_APP_PASSWORD or Gmail OAuth2 variables."
    );
  }

  async sendMail({ to, subject, text, html }) {
    if (!this.transporter) {
      throw new AppError("Email service is not configured.", 500);
    }

    const result = await this.transporter.sendMail({
      from: this.env.mailFrom,
      to,
      subject,
      text,
      html
    });

    return {
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected
    };
  }
}

module.exports = EmailService;
