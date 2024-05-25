const mongoose = require("mongoose")

const statut = new mongoose.Schema(
  {
    title: { type: String,uppercase:true,required: true },
    savedBy: { type: String, required: true },
    idAction : {type:String, required:true},
    idLabel : {type:String, required:true, unique:true},
  },
  { timestamps: true },
)
const model = mongoose.model("StatutAction", statut)
module.exports = model