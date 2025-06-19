const nodemailer = require('nodemailer');
const pug = require('pug');
const { convert } = require('html-to-text');
const ErrorResponse = require('./errorResponse');

// Create a transporter for sending emails
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Use SendGrid for production
    return nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: process.env.SENDGRID_USERNAME,
        pass: process.env.SENDGRID_PASSWORD
      }
    });
  }

  // Use Mailtrap for development
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Email class for sending emails
class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Finance Management System <${process.env.EMAIL_FROM}>`;
  }

  // Create a new transport
  newTransport() {
    return createTransporter();
  }

  // Send the actual email
  async send(template, subject, context = {}) {
    try {
      // 1) Render HTML based on a pug template
      const html = pug.renderFile(
        `${__dirname}/../views/emails/${template}.pug`,
        {
          firstName: this.firstName,
          url: this.url,
          subject,
          ...context
        }
      );

      // 2) Define email options
      const mailOptions = {
        from: this.from,
        to: this.to,
        subject,
        html,
        text: convert(html, { wordwrap: 80 })
      };

      // 3) Create a transport and send email
      await this.newTransport().sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('There was an error sending the email. Please try again later.');
    }
  }

  // Welcome email
  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Finance Management System!');
  }

  // Password reset email
  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for 10 minutes)'
    );
  }
}

// Send email function
const sendEmail = async (options) => {
  try {
    // 1) Create a transporter
    const transporter = createTransporter();

    // 2) Define the email options
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || options.message
    };

    // 3) Actually send the email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Email could not be sent');
  }
};

module.exports = { Email, sendEmail };
