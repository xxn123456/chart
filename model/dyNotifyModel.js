const mongoose = require("mongoose")

// 新动态通知表
const dyNotifySchema = new mongoose.Schema({
    userID: String,	//用户id
    notify_list: []   //{formUser:id,fromImg:""}
})
module.exports = mongoose.model("dyNotify", dyNotifySchema);