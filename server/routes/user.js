import express from 'express';
import { PrismaClient } from '@prisma/client';
import admin from 'firebase-admin';
import { migrateToFirebase } from "./../utils/userManager.js";
import { generateResponse } from '../utils/constant.js';

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
        const result = generateResponse(false, "User not found in either Firebase or database");
        return res.status(404).json(result);
      }

      userData = {
        displayName: prismaUser.displayName,
        email: prismaUser.email,
        photoURL: null, // Since your User model doesn't have photoURL
        uid: prismaUser.id,
        isFirebaseUser: false
      };
    }
    const result = generateResponse(true, null, userData);
    res.json(result);
    
  } catch (error) {
    console.error("Error fetching user data:", error);
    const result = generateResponse(false, "Failed to fetch user data");
    res.status(500).json(result);
  }
});

router.get("/:userId/sessions", async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, limit = 10, offset = 0 } = req.query;

    // Verify if the user exists in Firebase
    const userRecord = await admin.auth().getUser(userId);
    if (!userRecord) {
      const result = generateResponse(false, "User not found in Firebase");
      return res.status(404).json(result);
    }
      
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
    const result = generateResponse(true, null, {
      sessions,
      pagination: {
        total: totalCount,
        offset: parseInt(offset),
        limit: parseInt(limit),
      },
    });
    res.json(result);
  } catch (error) {
    console.error("Error fetching user sessions:", error);
    const result = generateResponse(false, "Failed to fetch user sessions");
    res.status(500).json(result);
  }
});

// Route to handle user migration when they sign up with Firebase
router.post("/migrate-user", async (req, res) => {
  try {
    const { email, firebaseUid } = req.body;

    const result = await migrateToFirebase(email, firebaseUid);
    
    // Always return success, but indicate if migration occurred
    const success = generateResponse(true, null, {
      migrated: result.migrated,
      firebaseUid: result.firebaseUid
    });
    res.json(success);
  } catch (error) {
    console.error("Error migrating user:", error);
    const result = generateResponse(false, "Failed to migrate user");
    res.status(500).json(result);
  }
});

// Search users by display name or email
router.post("/search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || query.length < 3) {
      const result = generateResponse(false, "Search query must be at least 3 characters long");
      return res.status(400).json(result);
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
    const result = generateResponse(true, null, {
      users: paginatedUsers,
      pagination: {
        total: matchingUsers.length,
        page,
        limit,
        totalPages: Math.ceil(matchingUsers.length / limit),
      },
      query,
    });
    res.json(result);
  } catch (error) {
    console.error("Error searching users:", error);
    const result = generateResponse(false, "Failed to search users");
    res.status(500).json(result);
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
    if (!userRecord) {
      const result = generateResponse(false, "User not found in Firebase");
      return res.status(404).json(result);
    }
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
    });
    const result = generateResponse(true, null, {
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
    res.json(result);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    const result = generateResponse(false, "Failed to fetch user profile");
    res.status(500).json(result);
  }
});

// Get sessions by state for a specific user
router.get("/:userId/state/:state", async (req, res) => {
  try {
    const { userId, state } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    // Validate the state
    if (!["DONE", "ACTIVE", "QUEUED", "CANCEL", "ERROR"].includes(state)) {
      const result = generateResponse(false, "Invalid session state");
      return res.status(400).json(result);
    }

    // Verify if the user exists in Firebase
    const userRecord = await admin.auth().getUser(userId);
    if (!userRecord) {
      const result = generateResponse(false, "User not found in Firebase");
      return res.status(404).json(result);
    }

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
    const result = generateResponse(true, null, response);
    res.json(result);
  } catch (error) {
    console.error("Error fetching user sessions by state:", error);
    const result = generateResponse(false, "Failed to fetch user sessions by state");
    res.status(500).json(result);
  }
});

export default router;
