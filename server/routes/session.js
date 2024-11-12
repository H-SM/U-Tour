const express = require('express');
const { PrismaClient } = require('@prisma/client');
const admin = require('firebase-admin');
const router = express.Router();

const prisma = new PrismaClient();

// Route to create a new session
router.post('/create', async (req, res) => {
  try {
    const { userId, to, from, departureTime, tourType } = req.body;

    // Verify if the user exists in Firebase
    const userRecord = await admin.auth().getUser(userId);
    if (!userRecord) return res.status(404).json({ error: 'User not found in Firebase' });

    // Create the session
    const session = await prisma.session.create({
      data: {
        userId,
        state: 'QUEUED', // Default state
        to,
        from,
        departureTime: new Date(departureTime),
        tourType,
      },
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Route to update session state
router.patch('/:sessionId/state', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { state } = req.body;

    // Validate the new state
    if (!['DONE', 'ACTIVE', 'QUEUED', 'CANCEL', 'ERROR'].includes(state)) {
      return res.status(400).json({ error: 'Invalid session state' });
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: { state },
    });

    res.json(updatedSession);
  } catch (error) {
    console.error('Error updating session state:', error);
    res.status(500).json({ error: 'Failed to update session state' });
  }
});

// Route to get session and associated user information
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session) return res.status(404).json({ error: 'Session not found' });

    const userRecord = await admin.auth().getUser(session.userId);

    res.json({
      session,
      user: {
        displayName: userRecord.displayName,
        email: userRecord.email,
        photoURL: userRecord.photoURL,
        uid: userRecord.uid,
      },
    });
  } catch (error) {
    console.error('Error fetching session data:', error);
    res.status(500).json({ error: 'Failed to fetch session data' });
  }
});

module.exports = router;
