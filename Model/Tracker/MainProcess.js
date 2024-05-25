const mongoose = require('mongoose')

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique:true },
    idMainProcess: { type: String, required: true, unique : true },
    savedBy: { type: String, required: true },
  },
  { timestamps: true },
)

schema.index({ idMainProcess: 1 })
const model = mongoose.model('MainProcess', schema)
module.exports = model
