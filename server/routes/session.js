const express = require("express");
const { PrismaClient } = require("@prisma/client");
const admin = require("firebase-admin");
const router = express.Router();

const prisma = new PrismaClient();

// Route to create a new session
router.post("/create", async (req, res) => {
  try {
    const { userId, to, from, departureTime, tourType } = req.body;

    // Verify if the user exists in Firebase
    const userRecord = await admin.auth().getUser(userId);
    if (!userRecord)
      return res.status(404).json({ error: "User not found in Firebase" });

    // Create the session
    const session = await prisma.session.create({
      data: {
        userId,
        state: "QUEUED", // Default state
        to,
        from,
        departureTime: new Date(departureTime),
        tourType,
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
      session
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
router.get('/:sessionId/details', async (req, res) => {
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
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get user information from Firebase
    const userRecord = await admin.auth().getUser(session.userId);

    // Get session history (assuming you have a sessionHistory table)
    const sessionHistory = await prisma.sessionHistory.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      select: {
        state: true,
        createdAt: true,
        note: true,
      },
    });

    // Calculate session duration if applicable
    const sessionDuration = session.state === 'DONE' 
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
    console.error('Error fetching session details:', error);
    res.status(500).json({ error: 'Failed to fetch session details' });
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
