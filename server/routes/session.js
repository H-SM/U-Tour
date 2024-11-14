const express = require("express");
const { PrismaClient } = require("@prisma/client");
const admin = require("firebase-admin");
const router = express.Router();
const { handleUserCreation } = require("./../utils/userManager");
const { generateCustomId } = require("./../utils/idGenerator");

const prisma = new PrismaClient();

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

// Get detailed information for a single session TODO: NEED FIX - kinda irrelevant due to the old existing route
router.get("/:sessionId/details", async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Get session with user information
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        state: true,
        to: true,
        from: true,
        departureTime: true,
        tourType: true,
        createdAt: true,
        expiredAt: true,
        userId: true,
      },
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Get user information from Firebase
    const userRecord = await admin.auth().getUser(session.userId);

    // Get session history (assuming you have a sessionHistory table)
    const sessionHistory = await prisma.sessionHistory.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      select: {
        state: true,
        createdAt: true,
        note: true,
      },
    });

    // Calculate session duration if applicable
    const sessionDuration =
      session.state === "DONE"
        ? calculateSessionDuration(session.createdAt, session.updatedAt)
        : null;

    const response = {
      session: {
        ...session,
        duration: sessionDuration,
      },
      user: {
        displayName: userRecord.displayName,
        email: userRecord.email,
        photoURL: userRecord.photoURL,
        uid: userRecord.uid,
      },
      history: sessionHistory,
      _meta: {
        retrievedAt: new Date(),
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching session details:", error);
    res.status(500).json({ error: "Failed to fetch session details" });
  }
});

// Helper function to calculate session duration
function calculateSessionDuration(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const durationMs = end - start;

  return {
    milliseconds: durationMs,
    seconds: Math.floor(durationMs / 1000),
    minutes: Math.floor(durationMs / (1000 * 60)),
    hours: Math.floor(durationMs / (1000 * 60 * 60)),
  };
}

module.exports = router;
