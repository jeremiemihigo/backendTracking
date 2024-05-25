const mongoose = require("mongoose")

const schema = new mongoose.Schema({
  visited : {type:String, required:true},
  called : {type:String, required:true},
  action : {type:String, required:true}
}, {timestamps:true})

const model = mongoose.model("Initiale", schema)
module.exports = model