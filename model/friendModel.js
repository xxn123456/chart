const mongoose = require("mongoose")
// 好友表
const friendSchema = new mongoose.Schema({
    userID: String,	//用户id
    friend_list: [
        { "user": { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, "nickName": String }
    ],
})
module.exports = mongoose.model("friend", friendSchema);