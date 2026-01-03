// run command: npm run server

require("dotenv").config();
require("./models/room")
require("./models/host")

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const http = require("http");
const socketio = require("socket.io");
const cors = require("cors");


const app = express();


const testroute = require("./routes/test");
const roomroute = require("./routes/room");

app.use(cors({
  origin: [
    "http://localhost:3000"
  ],
  credentials: true
}));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));


app.get("/", (req, res) => {
  res.json("API working");
});



mongoose
  .connect(process.env.DB_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));


const server = http.createServer(app);


const io = socketio(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});


// Make io available in controllers
app.use((req, res, next) => { 
  req.io = io;
  next();
});
 
// const socketInit = require("./socket");
// socketInit(io);

 
require("./socket")(io);


app.use("/test", testroute);
app.use("/room", roomroute);


app.use((req, res) => {
  res.status(404).send("Not Found");
});




server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
}); 
