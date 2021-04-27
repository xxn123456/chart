const mongoose = require("mongoose")
//群表
var GroupSchema = new mongoose.Schema({
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },            //群主
    number: Number,	                                                           //群号码 
    name: String,								                               //群名称
    imgUrl: String,		                                                       //群头像
    time: { type: Date, default: Date.now() },								   //创建时间
    notice: { type: String, default: "暂无公告" },								//公告
    user_list: [
        { user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, nickName: String, }
    ]
});


module.exports = mongoose.model("group", GroupSchema);