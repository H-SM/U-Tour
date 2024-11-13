const express = require("express");
const { PrismaClient } = require("@prisma/client");
const admin = require("firebase-admin");
const router = express.Router();
const prisma = new PrismaClient();

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Retrieve the user information from Firebase Authentication
    const userRecord = await admin.auth().getUser(userId);

    // Extract the relevant user data
    const { displayName, email, photoURL, uid } = userRecord;

    res.json({
      displayName,
      email,
      photoURL,
      uid,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

router.get("/:userId/sessions", async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, limit = 10, offset = 0 } = req.query;

    // Verify if the user exists in Firebase
    const userRecord = await admin.auth().getUser(userId);
    if (!userRecord)
      return res.status(404).json({ error: "User not found in Firebase" });

    // Build query conditions
    const where = { userId };
    if (status) {
      where.state = status;
    }

    // Get sessions with pagination
    const sessions = await prisma.session.findMany({
      where,
      skip: parseInt(offset),
      take: parseInt(limit),
      orderBy: { departureTime: "desc" },
    });

    // Get total count for pagination
    const totalCount = await prisma.session.count({ where });

    res.json({
      sessions,
      pagination: {
        total: totalCount,
        offset: parseInt(offset),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching user sessions:", error);
    res.status(500).json({ error: "Failed to fetch user sessions" });
  }
});

// Get combined user and sessions data
router.get("/:userId/get-combined", async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user from Firebase
    const userRecord = await admin.auth().getUser(userId);
    if (!userRecord)
      return res.status(404).json({ error: "User not found in Firebase" });

    // Get user's sessions statistics
    const sessionsStats = await prisma.session.groupBy({
      by: ["state"],
      where: { userId },
      _count: true,
    });

    // Get recent sessions
    const recentSessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { departureTime: "desc" },
      take: 5,
    });

    res.json({
      user: {
        displayName: userRecord.displayName,
        email: userRecord.email,
        photoURL: userRecord.photoURL,
        uid: userRecord.uid,
      },
      stats: {
        sessionsByState: sessionsStats,
        totalSessions: sessionsStats.reduce(
          (acc, curr) => acc + curr._count,
          0
        ),
      },
      recentSessions,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Get sessions by state for a specific user
router.get("/:userId/state/:state", async (req, res) => {
  try {
    const { userId, state } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    // Validate the state
    if (!["DONE", "ACTIVE", "QUEUED", "CANCEL", "ERROR"].includes(state)) {
      return res.status(400).json({ error: "Invalid session state" });
    }

    // Verify if the user exists in Firebase
    const userRecord = await admin.auth().getUser(userId);
    if (!userRecord)
      return res.status(404).json({ error: "User not found in Firebase" });

    // Get sessions for the specific state
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        state,
      },
      skip: parseInt(offset),
      take: parseInt(limit),
      orderBy: { departureTime: "desc" },
    });

    // Get total count for pagination
    const totalCount = await prisma.session.count({
      where: {
        userId,
        state,
      },
    });

    // Add user info to response
    const response = {
      user: {
        displayName: userRecord.displayName,
        email: userRecord.email,
        photoURL: userRecord.photoURL,
        uid: userRecord.uid,
      },
      sessions,
      pagination: {
        total: totalCount,
        offset: parseInt(offset),
        limit: parseInt(limit),
      },
      state,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching user sessions by state:", error);
    res.status(500).json({ error: "Failed to fetch user sessions by state" });
  }
});

module.exports = router;
