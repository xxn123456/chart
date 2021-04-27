const mongoose = require("mongoose")

// 留言表  
//一条留言只能空间所属用户和留言用户可以回复信息  空间所属用户的留言只有空间所属用户可以回复
const messageSchema = new mongoose.Schema({
    userID: String,	//用户id
    messages: [
        { "user": { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, content: String, "nickName": String, children: Array, date: Date }
    ],
})
module.exports = mongoose.model("message", messageSchema);