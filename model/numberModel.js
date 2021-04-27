const mongoose = require("mongoose")
// 生成群号的表
const numberSchema = new mongoose.Schema({
    name: String,
    group_number: {
        type: Number,
        default: 1000000
    }
})
module.exports = mongoose.model("number", numberSchema);