import express from 'express';
import { htmlTemplate } from './../templates/template.js';
import sgMail from '@sendgrid/mail';
import emailjs from '@emailjs/nodejs';
import { generateResponse } from '../utils/constant.js';

const router = express.Router();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.post("/send-mail-emailjs", async (req, res) => {
  const { to, from, departureTime, name, tourType, email } = req.body;

  if (!to || !from || !departureTime || !name || !tourType || !email) {
    const result = generateResponse(false, "Missing required fields: to, from, departureTime, name, tourType, or email");
    return res.status(400).json(result);
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
    const result = generateResponse(true, "Email sent successfully!");
    res.json(result);
  } catch (error) {
    console.error("Error sending email:", error);
    const result = generateResponse(false, "Failed to send email", error.message);
    res.status(500).json(result);
  }
});

router.post("/send-mail", async (req, res) => {
  const { to, from, departureTime, name, tourType, email } = req.body;

  if (!to || !from || !departureTime || !name || !tourType || !email) {
    const result = generateResponse(false, "Missing required fields: to, from, departureTime, name, tourType, or email");
    return res.status(400).json(result);
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
    const result = generateResponse(true, "Email sent successfully!");
    res.json(result);
  } catch (error) {
    console.error("Error sending email:", error);
    const result = generateResponse(false, "Failed to send email", error.message);
    res.status(500).json(result);
  }
});

export default router;
