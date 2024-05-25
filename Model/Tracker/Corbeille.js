const mongoose = require('mongoose')

const schema = new mongoose.Schema(
  {
    texte: { type: String, required: true },
  },
  { timestamps: true },
)

const model = mongoose.model('Corbeille', schema)
module.exports = model
