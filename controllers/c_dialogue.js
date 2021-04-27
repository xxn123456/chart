const Dialogue = require("../model/dialogueModel")
const Friend = require("../model/friendModel")
const User = require("../model/userModel")
const Group = require("../model/groupModel")
const { verifyToken } = require("../tool/token")
// 获取聊天列表
exports.dialogueList = async data => {
    let { token } = data
    let tokenRes = verifyToken(token)
    let res = await Dialogue.findOne({ "userID": tokenRes.id })
    let arr = []
    if (res) {
        let chat_list = res.chat_list
        let friends = await Friend.findOne({ userID: tokenRes.id }).populate("friend_list.user", "avatars")
        arr = await Promise.all(chat_list.map(async item => {
            if (item.type == 'private') { //是私聊则从好友表中获取到好友信息

                let index = friends.friend_list.findIndex(f_item => {
                    return f_item.user._id == item.id
                })
                let friend = null
                if (index > -1) {
                    friend = friends.friend_list[index]
                } else {
                    friend = await User.findById(item.id)
                }
                item.avatars = friend.user.avatars
                item.name = friend.nickName
            } else { //是群聊则寻找群组信息
                let group = await Group.findById(item.id)
                item.avatars = group.imgUrl
                item.name = group.name
                let index = friends.friend_list.findIndex(f_item => {
                    return f_item.user._id == item.from.toString()
                })
                if (index > -1) {
                    item.from = friends.friend_list[index].nickName
                } else {
                    let user = await User.findById(item.from)
                    item.from = user.name
                }
            }
            return item
        }))
    }
    return arr
}

// 更新聊天列表
exports.updateUnRead = async data => {
    let { token, id } = data
    let tokenRes = verifyToken(token)
    let dialogToken = await Dialogue.findOne({ userID: tokenRes.id })
    if (dialogToken) {
        let chat_list = dialogToken.chat_list
        let index = chat_list.findIndex(item => {
            return item.id == id
        })
        if (index >= 0) {
            chat_list[index].unRead = 0
            let dialogRes = await Dialogue.updateOne({ "userID": tokenRes.id }, { $set: { "chat_list": chat_list } })
            return dialogRes
        }
    }
}

// 删除聊天列表
exports.remove = async data => {
    let { token, id } = data
    let tokenRes = verifyToken(token)
    let res = await Dialogue.findOne({ "userID": tokenRes.id })
    let chat_list = res.chat_list
    let index = chat_list.findIndex(item => {
        return id == item.id
    })
    chat_list.splice(index, 1)
    let result = await Dialogue.updateOne({ "userID": tokenRes.id }, { $set: { chat_list } })
    if (result.nModified > 0) {
        return {
            status: 1,
            msg: "删除成功"
        }
    } else {
        return {
            status: 0,
            msg: "删除失败"
        }
    }
}