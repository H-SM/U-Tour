import express from 'express';
import { htmlTemplate } from './../templates/template.js';
import sgMail from '@sendgrid/mail';
import emailjs from '@emailjs/nodejs';

const router = express.Router();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.post("/send-mail-emailjs", async (req, res) => {
  const { to, from, departureTime, name, tourType, email } = req.body;

  if (!to || !from || !departureTime || !name || !tourType || !email) {
    return res.status(400).json({
      status: "error",
      message:
        "Missing required fields: to, from, departureTime, name, tourType, or email",
    });
  }

  try {
    // Prepare the email template parameters
    const templateParams = {
      to: email,
      from: process.env.EMAILJS_FROM,
      departureTime: departureTime,
      name: name,
      tourType: tourType,
      email: email,
    };

    // Send the email using EmailJS
    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      }
    );

    console.log("Email sent successfully!");
    res.status(200).json({
      status: "success",
      message: "Email sent successfully!",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to send email",
      error: error.message,
    });
  }
});

router.post("/send-mail", async (req, res) => {
  const { to, from, departureTime, name, tourType, email } = req.body;

  if (!to || !from || !departureTime || !name || !tourType || !email) {
    return res.status(400).json({
      status: "error",
      message:
        "Missing required fields: to, from, departureTime, name, tourType, or email",
    });
  }

  try {
    const personalizations = [
      {
        to: [{ email: email }],
        substitutions: {
          To: to,
          From: from,
          Time: departureTime,
          Name: name,
          TourType: tourType,
          Email: email,
        },
      },
    ];

    const msg = {
      personalizations,
      from: process.env.SENDGRID_SENDER,
      subject: "U Robot Tour Guide Booking Confirmation",
      html: htmlTemplate,
    };

    await sgMail.send(msg);
    console.log("Email sent successfully!");
    res.status(200).json({
      status: "success",
      message: "Email sent successfully!",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to send email",
      error: error.message,
    });
  }
});

export default router;
