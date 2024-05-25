"use strict";

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/Connection");
const app = express();
app.use(cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

const bodyParser = require("body-parser");
app.use(bodyParser.json());
require("dotenv").config();
connectDB();
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT || 8000;

const postTracker = require("./Routes/Post");
const getTracker = require("./Routes/Read");
const putTracker = require("./Routes/Update");
const deleteTracker = require("./Routes/delete");

app.use("/tracker/post", postTracker);
app.use("/tracker/read", getTracker);
app.use("/tracker/update", putTracker);
app.use("/tracker/delete", deleteTracker);

//Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// // Socket.IO
