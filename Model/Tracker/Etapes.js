const mongoose = require('mongoose')

const schema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    next: { type: String, required: true },
  },
  { timestamps: true },
)

schema.index({ label: 1 })
schema.index({ next: 1 })
const model = mongoose.model('etapes', schema)
module.exports = model
