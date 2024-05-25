const mongoose = require('mongoose')

const schema = new mongoose.Schema(
  {
    idStatus: { type: String, required: true, unique:true },
    title: { type: String, required: true },
    idProcess: { type: String, required: true },
    savedBy: { type: String, required: true },
  },
  { timestamps: true },
)
schema.index({idStatus:1})
schema.index({idProcess:1})
const model = mongoose.model('Status', schema)
module.exports = model
