const mongoose = require("mongoose")

const schema = new mongoose.Schema({
    customer_name: { type: String, required: true },
    region: { type: String, required: true },
    shop: { type: String, required: true },
    par: { type: String, required: true },
    last_status: { type: String, required: true },
    person_in_charge: { type: String, required: true },
    sla: { type: String, required: true },
    month: { type: String, required: true },
    unique_account_id: {
        type: String,
        required: true,
        max: 12,
        min: 12,
        trim: true,
        uppercase: true,
    },
}, { timestamps: true })

schema.index({ unique_account_id: 1, month: 1 }, { unique: true })
schema.index({ region: 1 })
schema.index({ shop: 1 })
schema.index({ par: 1 })
schema.index({ last_status: 1 })
schema.index({ person_in_charge: 1 })
schema.index({ sla: 1 })




const model = mongoose.model("datatotrack", schema)
module.exports = model