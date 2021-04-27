const mongoose = require("mongoose")

// 动态表
const dynamicSchema = new mongoose.Schema({
    userID: { type: mongoose.Schema.Types.ObjectId, ref: "user" },	//用户id
    logList: [
        { text: String, imgList: Array, originalList: Array, comments: Array, like: Array, date: Date, address: String }
    ],
})

module.exports = mongoose.model("dynamic", dynamicSchema);