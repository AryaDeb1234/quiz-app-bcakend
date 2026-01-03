var express = require("express");

var router = express();
var user = require("../models/user");
const testcontroller=require("../controllers/test_controller")

router.post("/create",testcontroller.createUser);

router.get("/", testcontroller.homeroute);

module.exports = router;
