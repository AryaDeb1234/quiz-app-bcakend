const mongoose = require("mongoose");

const hostSchema = new mongoose.Schema({
  name: String,
  roomCode: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Host", hostSchema);
