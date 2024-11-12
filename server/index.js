const express = require("express");
var cors = require("cors");

const request = require("request");

require("dotenv").config();
const { admin, db } = require("./firebase"); 

const { default: axios } = require("axios");

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.send("Hello, World!!!!");
});

app.get("/test-firebase-admin", async (req, res) => {
  try {
    // Attempt to list users (an operation that requires Firebase Admin to be correctly set up)
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

app.use("/mail", require("./routes/mailer"));
app.use('/users', require('./routes/user'));
app.use("/sessions", require("./routes/session")); 

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
