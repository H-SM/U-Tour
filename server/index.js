const express = require("express");
var cors = require("cors");

const request = require("request");

require("dotenv").config();

const { default: axios } = require("axios");

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.send("Hello, World!!!!");
});

app.use("/mail", require("./routes/mailer"));

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
