const mongoose = require("mongoose")
// 群列表
const listSchema = new mongoose.Schema({
    userID: String,	//用户id
    group_list: [
        { "group": { type: mongoose.Schema.Types.ObjectId, ref: 'group' } }
    ],
})
module.exports = mongoose.model("groupList", listSchema); 