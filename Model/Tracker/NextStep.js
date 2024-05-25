const mongoose = require('mongoose')

const schema = new mongoose.Schema(
  {
    lastStatut: { type: String, required: true },
    nextAction: { type: String, required: true },
  },
  { timestamps: true },
)
schema.index({ lastStatut: 1 })
schema.index({ nextAction: 1 })
const model = mongoose.model('NextStep', schema)
module.exports = model
