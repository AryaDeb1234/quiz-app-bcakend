const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  socketId: String,
  name: String,
  score: {
    type: Number,
    default: 0
  }
});

const questionSchema = new mongoose.Schema({
  question: String,
  options: [String], // 4 options
  correctAnswer: Number // index: 0-3
});

const roomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    unique: true
  },
  hostName: String,
  hostSocketId: String,

  questions: [questionSchema], // 5 questions

  currentQuestionIndex: {
    type: Number,
    default: 0
  },

  players: [playerSchema],

  isStarted: {
    type: Boolean,
    default: false
  },

  isEnded: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Room", roomSchema);
