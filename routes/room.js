var express = require("express");

var router = express();
var room = require("../models/room");
const roomcontroller=require("../controllers/room_controller")

router.post("/create",roomcontroller.createRoom);
router.post("/join", roomcontroller.joinRoom); 

module.exports = router;
