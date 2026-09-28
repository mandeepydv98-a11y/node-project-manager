import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: process.env.MAIL_PRODUCT_NAME || "Project Camp",
      link: process.env.MAIL_PRODUCT_URL || "http://localhost:3000",
    },
  });

  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);
  const emailHtml = mailGenerator.generate(options.mailgenContent);

  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port: Number(process.env.MAILTRAP_SMTP_PORT || 2525),
    secure: process.env.MAILTRAP_SMTP_SECURE === "true",
    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || "no-reply@projectcamp.local",
    to: options.email,
    subject: options.subject,
    text: emailTextual,
    html: emailHtml,
  });
};

const emailVerificationMailgenContent = (username, verificationUrl) => ({
  body: {
    name: username,
    intro: "Welcome to Project Camp. We are excited to have you onboard.",
    action: {
      instructions: "To verify your email, click the button below.",
      button: {
        color: "#22BC66",
        text: "Verify your email",
        link: verificationUrl,
      },
    },
    outro:
      "If you did not create this account, you can safely ignore this email.",
  },
});

const forgotPasswordMailgenContent = (username, passwordResetUrl) => ({
  body: {
    name: username,
    intro: "We received a request to reset the password of your account.",
    action: {
      instructions: "To reset your password, click the button below.",
      button: {
        color: "#22BC66",
        text: "Reset Password",
        link: passwordResetUrl,
      },
    },
    outro:
      "If you did not request a password reset, you can safely ignore this email.",
  },
});

export {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
};
