import express from 'express';
import { PrismaClient } from '@prisma/client';
import admin from 'firebase-admin';
import { migrateToFirebase } from "./../utils/userManager.js";

const router = express.Router();
const prisma = new PrismaClient();


router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    let userData;

    try {
      // First attempt to get user from Firebase
      const userRecord = await admin.auth().getUser(userId);
      userData = {
        displayName: userRecord.displayName,
        email: userRecord.email,
        photoURL: userRecord.photoURL,
        uid: userRecord.uid,
        isFirebaseUser: true
      };
    } catch (firebaseError) {
      // If Firebase lookup fails, try Prisma User table
      const prismaUser = await prisma.user.findUnique({
        where: {
          id: userId
        }
      });

      if (!prismaUser) {
        return res.status(404).json({ error: "User not found in either Firebase or database" });
      }

      userData = {
        displayName: prismaUser.displayName,
        email: prismaUser.email,
        photoURL: null, // Since your User model doesn't have photoURL
        uid: prismaUser.id,
        isFirebaseUser: false
      };
    }

    res.json(userData);
    
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

// Route to handle user migration when they sign up with Firebase
router.post("/migrate-user", async (req, res) => {
  try {
    const { email, firebaseUid } = req.body;

    const result = await migrateToFirebase(email, firebaseUid);
    
    // Always return success, but indicate if migration occurred
    res.json({
      success: true,
      migrated: result.migrated,
      firebaseUid: result.firebaseUid
    });
  } catch (error) {
    console.error("Error migrating user:", error);
    res.status(500).json({ error: "Failed to migrate user" });
  }
});

// Search users by display name or email
router.post("/search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || query.length < 3) {
      return res.status(400).json({
        error: "Search query must be at least 3 characters long",
      });
    }

    // Initialize arrays to store matching users
    const matchingUsers = [];

    // 1. Get Firebase users
    const usersResult = await admin.auth().listUsers(1000);
    usersResult.users.forEach((userRecord) => {
      const { displayName, email, photoURL, uid } = userRecord;
      if (
        (displayName &&
          displayName.toLowerCase().includes(query.toLowerCase())) ||
        (email && email.toLowerCase().includes(query.toLowerCase()))
      ) {
        matchingUsers.push({
          displayName,
          email,
          photoURL,
          uid,
          isFirebaseUser: true
        });
      }
    });

    // 2. Get non-Firebase users from Prisma
    const nonFirebaseUsers = await prisma.user.findMany({
      where: {
        AND: [
          {
            migratedToFirebase: false,
          },
          {
            OR: [
              {
                displayName: {
                  contains: query,
                  mode: 'insensitive'
                }
              },
              {
                email: {
                  contains: query,
                  mode: 'insensitive'
                }
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        email: true,
        displayName: true,
      }
    });

    // Add non-Firebase users to the results
    nonFirebaseUsers.forEach((user) => {
      matchingUsers.push({
        displayName: user.displayName,
        email: user.email,
        uid: user.id,
        isFirebaseUser: false
      });
    });

    // Handle pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedUsers = matchingUsers.slice(startIndex, endIndex);

    res.json({
      users: paginatedUsers,
      pagination: {
        total: matchingUsers.length,
        page,
        limit,
        totalPages: Math.ceil(matchingUsers.length / limit),
      },
      query,
    });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Failed to search users" });
  } finally {
    await prisma.$disconnect();
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

export default router;
