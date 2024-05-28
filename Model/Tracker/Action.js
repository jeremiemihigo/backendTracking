const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    idStatus: { type: String, required: true },
    title: { type: String, required: true },
    idRole: { type: String, required: false },
    idAction: { type: String, required: true },
    delai: { type: Number, required: true, min: 1 },
    savedBy: { type: String, required: true },
    objectif: { type: String, required: false },
    color: { type: String, required: false },
    lastchange: { type: Date, required: false },
    default: { type: Boolean, required: true, default: false }, //ça determine l'action par défaut
  },
  { timestamps: true }
);

const model = mongoose.model("Action", schema);
module.exports = model;
