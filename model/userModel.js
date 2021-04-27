const mongoose = require("mongoose")
// 用户表
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    pwd: String,
    sex: {
        type: String,
        default: "男"
    },
    address: {
        type: String,
        default: "广东省深圳市宝安区"
    },
    birthday: {
        type: String,
        default: "2000-1-1"
    },
    avatars: {
        type: String,
        // default: "http://localhost:3000/userImg/default.jpg"
        default: "http://www.yemengs.cn/common/default.jpg"
    },
    signature: {
        type: String,
        default: ""
    }
})

module.exports = mongoose.model("User", userSchema);