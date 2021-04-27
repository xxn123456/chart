
const mongoose = require("mongoose")
// 聊天表
const chatSchema = new mongoose.Schema({
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    msg_list: []
})
module.exports = mongoose.model("chat", chatSchema);
/**
 * msg_list:
 * belong 表示该信息是谁发的,值为用户id
 * type  表示信息的类型，分为voice（语音），text（文字），image（图片)，file（文件）
 */
// { msg: String, type: String, belong: String, date: { type: Date, default: Date.now() } }