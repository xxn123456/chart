const mongoose = require("mongoose")

// 访问表
const visitorsSchema = new mongoose.Schema({
    userID: String,	//用户id
    count: Number,
    visitors: [
        { "user": { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, "nickName": String, date: String, unRead: Boolean }
    ],
})
module.exports = mongoose.model("visitor", visitorsSchema);