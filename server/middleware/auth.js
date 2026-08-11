import { admin } from "../firebase.js";

// Verifies the Firebase ID token sent by the frontend in the Authorization
// header. Trusted system callers (Vercel Cron, internal jobs) authenticate
// with a shared secret instead, so scheduled jobs never get blocked by this.
const verifyAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res
      .status(401)
      .json({ success: false, message: "Missing or invalid Authorization header" });
  }

  if (process.env.CRON_SECRET && token === process.env.CRON_SECRET) {
    req.isSystem = true;
    return next();
  }

  try {
    req.user = await admin.auth().verifyIdToken(token);
    return next();
  } catch (error) {
    console.error("Auth verification failed:", error.message);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export default verifyAuth;
