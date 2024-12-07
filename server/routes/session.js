import express from "express";
import { PrismaClient } from "@prisma/client";
import admin from "firebase-admin";
import { handleUserCreation } from "./../utils/userManager.js";
import { generateCustomId } from "./../utils/idGenerator.js";
import { htmlTemplate } from "./../templates/template.js";
import sgMail from "@sendgrid/mail";
import { manageTourForSession } from "./tour.js";
import { removeEmptyTours } from "../queues/tourQueue.js";
import { generateResponse, locations } from "../utils/constant.js";
const router = express.Router(); // Create router correctly
const prisma = new PrismaClient();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const formatLocation = (locationValue) => {
  const foundLocation = locations.find(location => location.value === locationValue);
  return foundLocation ? foundLocation.label : locationValue;
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

    const sessionTimestamp = new Date(departureTime);
    const hourStart = new Date(
      sessionTimestamp.getFullYear(),
      sessionTimestamp.getMonth(),
      sessionTimestamp.getDate(),
      sessionTimestamp.getHours(),
      0,
      0
    );

    // Check existing tours for this hour
    const existingTour = await prisma.tour.findFirst({
      where: {
        timestamp: hourStart,
      },
    });
    // AykTlpjdYSvfjfPL1xLAeEoPa9gI
    // 67Aq8hTXwrDd9wLCzmDdcNGpzeET
    const sessionTeamSize = team ? team.size : 1;
    const totalCurrentSize = existingTour ? existingTour.totalSize : 0;

    if (existingTour && totalCurrentSize + sessionTeamSize > 10) {
      const result = generateResponse(false, "This hour is fully booked. No more sessions can be added.");
      return res.status(400).json(result);
    }

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
        const result = generateResponse(false, { error: "Invalid booking user ID" });
        return res.status(400).json(result);
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

    // After creating the session, manage tour allocation
    const tourId = await manageTourForSession(session);

    // Update the session with the tour ID
    await prisma.session.update({
      where: { id: session.id },
      data: { tourId },
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
          personalizations: [
            {
              to: [{ email: userEmail }],
              substitutions: {
                ...emailData,
                Name: userName,
                Email: userEmail,
                Role: "Self Booking", // Indicate it's a self-booking
                AdditionalInfo: team
                  ? `Team ${team.name} booking for ${team.size} people.`
                  : "Individual booking",
              },
            },
          ],
          from: process.env.SENDGRID_SENDER,
          subject: "U Robot Tour Guide Booking Confirmation",
          html: htmlTemplate,
        };

        await sgMail.send(combinedMsg);
      } else {
        // If different users, send separate emails
        const bookingUserMsg = {
          personalizations: [
            {
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
            },
          ],
          from: process.env.SENDGRID_SENDER,
          subject: "U Robot Tour Guide Booking Confirmation",
          html: htmlTemplate,
        };

        const sessionUserMsg = {
          personalizations: [
            {
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
            },
          ],
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

    const result = generateResponse(true, null, session);
    return res.status(201).json(result);
  } catch (error) {
    if (
      error.message ===
      "This hour is fully booked. No more sessions can be added."
    ) {
      const result = generateResponse(false, error.message);
      return res.status(400).json(result);
    }
    console.error("Error creating session:", error);
    const result = generateResponse(false, "Failed to create session");
    return res.status(500).json(result);
  }
});

// Enhanced route to check available slots
router.get("/available-slots", async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      const result = generateResponse(false, "Date is required");
      return res.status(400).json(result);
    }
    const availableSlots = {};
    const result = generateResponse(true, null, availableSlots);
    return res.json(result);
  } catch (error) {
    console.error("Error fetching available slots:", error);
    const result = generateResponse(false, "Failed to fetch available slots");
    return res.status(500).json(result);
  }
});

// Route to update session state
router.patch("/:sessionId/state", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { state } = req.body;

    // Validate the new state
    if (!["DONE", "ACTIVE", "QUEUED", "CANCEL", "ERROR"].includes(state)) {
      const result = generateResponse(false, "Invalid session state");
      return res.status(400).json(result);
    }

    // Find the session first to ensure we have the tourId
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        tour: true,
        team: true,
      },
    });

    if (!session) {
      const result = generateResponse(false, "Session not found");
      return res.status(404).json(result);
    }

    if (state === "CANCEL" && session.tourId) {
      // Calculate the size to remove (team size or 1 for individual)
      const sizeToRemove = session.team ? session.team.size : 1;

      // Update the tour: remove session and reduce total size & remove empty tours
      await Promise.all([
        prisma.tour.update({
          where: { id: session.tourId },
          data: {
            totalSize: {
              decrement: sizeToRemove,
            },
            sessions: {
              disconnect: { id: sessionId },
            },
          },
        }),
        removeEmptyTours(),
      ]);
    }
    // Update the session state
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: { state },
    });

    const result = generateResponse(true, null, updatedSession);
    res.json(result);
  } catch (error) {
    console.error("Error updating session state:", error);
    const result = generateResponse(false, "Failed to update session state");
    res.status(500).json(result);
  }
});

// New route to get upcoming sessions
router.get("/upcoming", async (req, res) => {
  try {
    const upcomingSessions = await prisma.session.findMany({
      where: {
        departureTime: {
          gte: new Date(),
        },
        state: {
          not: "CANCEL",
        },
      },
      orderBy: {
        departureTime: "asc",
      },
      select: {
        id: true,
        departureTime: true,
        to: true,
        from: true,
        tourType: true,
        team: true,
      },
      take: 50, // Limit to 50 upcoming sessions
    });

    const result = generateResponse(true, null, upcomingSessions);
    res.json(result);
  } catch (error) {
    console.error("Error fetching upcoming sessions:", error);
    const result = generateResponse(false, "Failed to fetch upcoming sessions");
    res.status(500).json(result);
  }
});

// Route to get session and associated user information
router.get("/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        team: true, // Include team details if they exist
      },
    });

    if (!session) {
      const result = generateResponse(false, "Session not found");
      return res.status(404).json(result);
    }

    const result = generateResponse(true, null, { session });
    res.json(result);
  } catch (error) {
    console.error("Error fetching session data:", error);
    const result = generateResponse(false, "Failed to fetch session data");
    res.status(500).json(result);
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

    const result = generateResponse(true, null, sessions);
    res.json(result);
  } catch (error) {
    console.error("Error fetching sessions by date range:", error);
    const result = generateResponse(false, "Failed to fetch sessions by date range");
    res.status(500).json(result);
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

    const result = generateResponse(true, null, {
      sessionsByState: stats[0],
      last24Hours: stats[1],
      popularDestinations: stats[2],
    });
    res.json(result);
  } catch (error) {
    console.error("Error fetching session statistics:", error);
    const result = generateResponse(false, "Failed to fetch session statistics");
    res.status(500).json(result);
  }
});

export default router;
