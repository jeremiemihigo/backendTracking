const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, uppercase:true },
    createdBy: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true, uppercase:true },
    idTeam: { type: String, required: true, unique:true },
    actions: { type: Array, required: true, trim: true },
  },
  { timestamps: true }
);

schema.index({ createdBy: 1 });
schema.index({ role: 1 });
const model = mongoose.model("Team", schema);
module.exports = model;
