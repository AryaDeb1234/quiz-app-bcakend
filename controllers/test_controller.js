var user = require("../models/user");

async function createUser(req, res) {
    try{
    const {name,age}=req.body; 
 
  let newuser = new user({
    name: name,
    age: age,
  });
  await newuser.save();
  return res.status(200).json({"msg":"user created"})
  }catch(err){
   return res.status(400).json(err.message)
  }
}

function homeroute(req,res){
 return res.json({ message: "hello from test" });
}

module.exports = { createUser,homeroute };
