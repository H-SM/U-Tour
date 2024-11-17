const express = require("express");
const { PrismaClient } = require("@prisma/client");
const admin = require("firebase-admin");
const router = express.Router();
const { handleUserCreation } = require("./../utils/userManager");
const { generateCustomId } = require("./../utils/idGenerator");
const { htmlTemplate } = require("./../templates/template");
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const prisma = new PrismaClient();

const formatLocation = (location) => {
  return location
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};


// Route to create a new session
router.post("/create", async (req, res) => {
  try {
    const {
      bookingUserId, // Firebase UID or email of booking user
      userEmail, // Email of user for whom session is booked
      userName, // Name of user for whom session is booked
      to,
      from,
      departureTime,
      tourType,
      team, // Optional team information
    } = req.body;

    // Handle booking user
    let finalBookingUserId;
    let isBookedByFirebaseUser = false;
    let bookingUserEmail;

    if (bookingUserId.includes("@")) {
      // Email provided - first check if user exists in Firebase
      try {
        const bookingUserRecord = await admin
          .auth()
          .getUserByEmail(bookingUserId);
        finalBookingUserId = bookingUserRecord.uid;
        isBookedByFirebaseUser = true;
        bookingUserEmail = bookingUserId;
      } catch (error) {
        // Not in Firebase - create/get non-Firebase user
        const bookingUser = await handleUserCreation({
          email: bookingUserId,
          displayName: userName,
        });
        finalBookingUserId = bookingUser.id;
        bookingUserEmail = bookingUserId;
      }
    } else {
      // Firebase UID provided - fetch user details
      try {
        const bookingUserRecord = await admin.auth().getUser(bookingUserId);
        finalBookingUserId = bookingUserId;
        isBookedByFirebaseUser = true;
        bookingUserEmail = bookingUserRecord.email;
      } catch (error) {
        return res.status(400).json({ error: "Invalid booking user ID" });
      }
    }

    // Handle user for whom session is booked
    let finalUserId;
    let isUserFirebaseUser = false;
    try {
      // Check if user exists in Firebase
      const userRecord = await admin.auth().getUserByEmail(userEmail);
      finalUserId = userRecord.uid;
      isUserFirebaseUser = true;

      // If booking user email matches session user email, ensure we use the same ID type
      if (bookingUserEmail === userEmail) {
        finalBookingUserId = finalUserId;
        isBookedByFirebaseUser = true;
      }
    } catch (error) {
      // User not in Firebase - create/get from User table
      const sessionUser = await handleUserCreation({
        email: userEmail,
        displayName: userName,
      });
      finalUserId = sessionUser.id;

      // If booking user email matches session user email, ensure we use the same ID type
      if (bookingUserEmail === userEmail) {
        finalBookingUserId = finalUserId;
        isBookedByFirebaseUser = false;
      }
    }

    // Create the session
    const session = await prisma.session.create({
      data: {
        id: generateCustomId(),
        bookingUserId: finalBookingUserId,
        userId: finalUserId,
        isBookedByFirebaseUser,
        isUserFirebaseUser,
        state: "QUEUED",
        to,
        from,
        departureTime: new Date(departureTime),
        tourType,
        ...(team && {
          team: {
            create: {
              id: generateCustomId(),
              name: team.name,
              size: team.size,
              notes: team.notes,
              contactId: finalUserId,
              isFirebaseContact: isUserFirebaseUser,
            },
          },
        }),
      },
      include: {
        team: true,
        ...(!isBookedByFirebaseUser || !isUserFirebaseUser),
      },
    });

    // Send confirmation emails
    try {
      // Prepare common email data
      const emailData = {
        To: formatLocation(to),
        From: formatLocation(from),
        Time: new Date(departureTime).toLocaleString(),
        TourType: tourType,
      };

      if (bookingUserEmail === userEmail) {
        // If booking user is the same as tour user, send only one email
        const combinedMsg = {
          personalizations: [{
            to: [{ email: userEmail }],
            substitutions: {
              ...emailData,
              Name: userName,
              Email: userEmail,
              Role: "Self Booking",  // Indicate it's a self-booking
              AdditionalInfo: team
                ? `Team ${team.name} booking for ${team.size} people.`
                : "Individual booking",
            },
          }],
          from: process.env.SENDGRID_SENDER,
          subject: "U Robot Tour Guide Booking Confirmation",
          html: htmlTemplate,
        };

        await sgMail.send(combinedMsg);
      } else {
        // If different users, send separate emails
        const bookingUserMsg = {
          personalizations: [{
            to: [{ email: bookingUserEmail }],
            substitutions: {
              ...emailData,
              Name: userName,
              Email: bookingUserEmail,
              Role: "Booking User",
              AdditionalInfo: team
                ? `Team ${team.name} booking for ${team.size} people.`
                : "Individual booking",
            },
          }],
          from: process.env.SENDGRID_SENDER,
          subject: "U Robot Tour Guide Booking Confirmation",
          html: htmlTemplate,
        };

        const sessionUserMsg = {
          personalizations: [{
            to: [{ email: userEmail }],
            substitutions: {
              ...emailData,
              Name: userName,
              Email: userEmail,
              Role: "Tour Participant",
              AdditionalInfo: team
                ? `Part of team: ${team.name}. Team booking for ${team.size} people.`
                : "Individual booking",
            },
          }],
          from: process.env.SENDGRID_SENDER,
          subject: "U Robot Tour Guide Booking Confirmation",
          html: htmlTemplate,
        };

        await Promise.all([
          sgMail.send(bookingUserMsg),
          sgMail.send(sessionUserMsg),
        ]);
      }

      console.log("Confirmation emails sent successfully!");
    } catch (emailError) {
      console.error("Error sending confirmation emails:", emailError);
    }

    res.status(201).json(session);
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// Route to update session state
router.patch("/:sessionId/state", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { state } = req.body;

    // Validate the new state
    if (!["DONE", "ACTIVE", "QUEUED", "CANCEL", "ERROR"].includes(state)) {
      return res.status(400).json({ error: "Invalid session state" });
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: { state },
    });

    res.json(updatedSession);
  } catch (error) {
    console.error("Error updating session state:", error);
    res.status(500).json({ error: "Failed to update session state" });
  }
});

// Route to get session and associated user information
router.get("/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        team: true // Include team details if they exist
      }
    });

    if (!session) return res.status(404).json({ error: "Session not found" });

    res.json({
      session,
    });
  } catch (error) {
    console.error("Error fetching session data:", error);
    res.status(500).json({ error: "Failed to fetch session data" });
  }
});

// Get sessions by date range
router.get("/range/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, status } = req.query;

    const where = { userId };
    if (startDate && endDate) {
      where.departureTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    if (status) {
      where.state = status;
    }

    const sessions = await prisma.session.findMany({
      where,
      orderBy: { departureTime: "asc" },
      include: {
        user: true,
      },
    });

    res.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions by date range:", error);
    res.status(500).json({ error: "Failed to fetch sessions by date range" });
  }
});

// Get session statistics
router.get("/stats", async (req, res) => {
  try {
    const stats = await prisma.$transaction([
      // Total sessions by state
      prisma.session.groupBy({
        by: ["state"],
        _count: true,
      }),
      // Sessions created in the last 24 hours
      prisma.session.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Most popular destinations
      prisma.session.groupBy({
        by: ["to"],
        _count: true,
        orderBy: {
          _count: {
            _all: "desc",
          },
        },
        take: 5,
      }),
    ]);

    res.json({
      sessionsByState: stats[0],
      last24Hours: stats[1],
      popularDestinations: stats[2],
    });
  } catch (error) {
    console.error("Error fetching session statistics:", error);
    res.status(500).json({ error: "Failed to fetch session statistics" });
  }
});

module.exports = router;
