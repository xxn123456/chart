const mongoose = require("mongoose")

// 评论通知表
const comNotifySchema = new mongoose.Schema({
    userID: String,	//用户id
    notify_list: []
    //{fromUser:id,fromName:String,toUser:id,toName:String,date,logDate,type:"like"||"comment",content:null||String,unRead:false||true}
})
module.exports = mongoose.model("comNotify", comNotifySchema);