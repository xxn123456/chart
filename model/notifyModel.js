const mongoose = require("mongoose")

//             genre: "group",
//             name: name,
//             operaUser,
//             operation: opera,
//             date: new Date()
// 通知表（好友申请等）
const notifySchema = new mongoose.Schema({
    userID: String,	//用户id
    notify_list: [
        { "operaUser": { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, "operation": String, "genre": String, name: { type: String, default: null }, unRead: { type: Boolean, default: false }, "date": { type: Date, default: Date.now() } }
    ],
})
module.exports = mongoose.model("notify", notifySchema);