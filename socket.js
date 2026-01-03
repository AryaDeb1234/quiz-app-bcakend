const Room = require("./models/room");

const activeAnswers = {};

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join-room", async ({ roomCode, name }) => {
      try {
        const room = await Room.findOne({ roomCode });
        if (!room) {
          socket.emit("error", "Room not found");
          return;
        }

        // BLOCK late joiners
        if (room.isEnded) {
          socket.emit("quiz-ended-message", {
            message: "Quiz already ended. Please create a new room.",
          });
          return;
        }

        if (room.isStarted) {
          socket.emit("join-blocked", {
            message: "Quiz already started. You cannot join now.",
          });
          return;
        }

        // Assign host automatically if not already assigned
        if (!room.hostSocketId) {
          room.hostSocketId = socket.id;
          console.log(`Host assigned: ${name} (${socket.id})`);
        }

        const existing = room.players.find((p) => p.name === name);
        if (existing) {
          existing.socketId = socket.id;
        } else {
          room.players.push({ name, socketId: socket.id, score: 0 });
        }

        await room.save();
        socket.join(roomCode);

        io.to(roomCode).emit("player-list", room.players);
      } catch (err) {
        console.error(err);
      }
    });

    // =========================
    // START QUIZ (HOST)
    // =========================
    socket.on("start-quiz", async ({ roomCode }) => {
      const room = await Room.findOne({ roomCode });
      if (!room) return;

      // Only host can start
      if (room.hostSocketId !== socket.id) {
        socket.emit("error", "Only host can start the quiz");
        return;
      }

      if (room.isStarted) return;

      room.isStarted = true;
      room.currentQuestionIndex = 0;
      await room.save();

      sendQuestion(io, roomCode);
    });

    // =========================
    // SUBMIT ANSWER (NO SCORING HERE)
    // =========================
    socket.on("submit-answer", ({ roomCode, name, answerIndex }) => {
      if (!activeAnswers[roomCode]) return;

      // prevent multiple answers
      if (activeAnswers[roomCode].answers[name] !== undefined) return;

      activeAnswers[roomCode].answers[socket.id] = answerIndex;
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};

// =========================
// SEND QUESTION + TIMER
// =========================
async function sendQuestion(io, roomCode) {
  const room = await Room.findOne({ roomCode });
  if (!room) return;

  const qIndex = room.currentQuestionIndex;
  const question = room.questions[qIndex];

  // reset answers for this question
  activeAnswers[roomCode] = {
    questionIndex: qIndex,
    answers: {},
  };

  // send question
  io.to(roomCode).emit("new-question", {
    index: qIndex,
    question: question.question,
    options: question.options,
    time: 10,
  });

  // 10 SECOND TIMER
  setTimeout(async () => {
    const stored = activeAnswers[roomCode];
    if (!stored || stored.questionIndex !== qIndex) return;

    // evaluate answers
    room.players.forEach((player) => {
      const ans = stored.answers[player.socketId];

      if (ans === question.correctAnswer) {
        player.score += 10;
      }
    });

    room.currentQuestionIndex += 1;
    await room.save();

    // leaderboard
    const leaderboard = room.players
  .filter(p => p.socketId !== room.hostSocketId) // exclude host
  .map(p => ({ name: p.name, score: p.score }))
  .sort((a, b) => b.score - a.score);

    io.to(roomCode).emit("leaderboard", leaderboard);

    // quiz end check
    if (room.currentQuestionIndex >= room.questions.length) {
      room.isEnded = true;
      await room.save();

      io.to(roomCode).emit("quiz-ended", leaderboard);
      delete activeAnswers[roomCode];
      return;
    }

    // next question automatically
    sendQuestion(io, roomCode);
  }, 10000);
}
