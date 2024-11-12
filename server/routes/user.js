const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

router.get('/:userId', async (req, res) => {
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
        uid
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  });

module.exports = router;