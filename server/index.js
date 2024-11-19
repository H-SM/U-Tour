import express from "express";
import cors from "cors";
import request from "request";
import dotenv from "dotenv";
import { admin, db } from "./firebase.js";
import axios from "axios";

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, World!!!!");
});

app.get("/test-firebase-admin", async (req, res) => {
  try {
    const listUsersResult = await admin.auth().listUsers(1);
    res.json({
      message: "Firebase Admin is working!",
      userCount: listUsersResult.users.length,
    });
  } catch (error) {
    console.error("Firebase Admin test error:", error);
    res.status(500).json({ error: "Firebase Admin setup failed" });
  }
});

import mailerRoutes from "./routes/mailer.js";
import userRoutes from "./routes/user.js";
import sessionRoutes from "./routes/session.js";
import tourRoutes from "./routes/tour.js";

app.use("/mail", mailerRoutes);
app.use('/users', userRoutes);
app.use("/sessions", sessionRoutes);
app.use("/tours", tourRoutes);

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});