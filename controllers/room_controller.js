let Room=require("../models/room");
let socket=require("../socket");

const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

async function createRoom(req, res) {
  try {
    const { hostName, questions } = req.body;

    if (!hostName || !questions || questions.length !== 5) {
      return res.status(400).json({ message: "Invalid data" });
    }

    for (let q of questions) {
      if (!q.question || q.options.length !== 4 || q.correctAnswer === undefined) {
        return res.status(400).json({ message: "Invalid question format" });
      }
    }
    let roomCode;
    do {
      roomCode = generateRoomCode();
    } while (await Room.findOne({ roomCode }));

    await Room.create({
      roomCode,
      hostName,
      questions,
      players: []
    });

    return res.status(201).json({
      message: "Room created",
      roomCode 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

async function joinRoom(req, res) {
  try {
    const { name, roomCode } = req.body;

    if (!name || !roomCode) {
      return res.status(400).json({ message: "Name and room code required" });
    }

    const room = await Room.findOne({ roomCode });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

     // Assign host automatically if not already assigned
  if (!room.hostSocketId) {
    room.hostSocketId = socket.id;
    console.log(`Host assigned: ${name} (${socket.id})`);
  }

    // Prevent duplicate joins
    const alreadyJoined = room.players.find(p => p.name === name);
    if (alreadyJoined) {
      return res.status(400).json({ message: "Name already taken in this room" });
    }

    // Add player
    room.players.push({
      name,
      socketId: "" , // to be updated via Socket.io later
      score: 0
    });

    await room.save();

    res.status(200).json({
      message: "Joined room successfully",
      roomCode: room.roomCode,
      players: room.players
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { createRoom, joinRoom };
