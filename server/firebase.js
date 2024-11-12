const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // Path to your service account JSON

// Initialize Firebase Admin SDK with the service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

module.exports = { admin, db };