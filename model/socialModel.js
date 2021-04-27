const mongoose = require("mongoose")

// 朋友圈动态表（包括好友和自己的动态）
const socialSchema = new mongoose.Schema({
    userID: { type: mongoose.Schema.Types.ObjectId, ref: "user" },	//用户id
    dynamicList: [
        { friend: String, date: Date }
    ],
})

module.exports = mongoose.model("social", socialSchema);