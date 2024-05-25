const mongoose = require('mongoose')

const schema = new mongoose.Schema(
  {
   title : {type:String, required:true,unique:true, uppercase:true, trim:true},
   role : {type:Array, required:true, default:[]},
   leader : {type:String, required:false},
   id : {type:String,unique:true, required:true}
  },
  { timestamps: true },
)

schema.index({role : 1})
schema.index({id : 1})
const model = mongoose.model('departement', schema)
module.exports = model
