const ComNotify = require("../model/comNotifyModel")
const Friend = require("../model/friendModel")
const User = require("../model/userModel")
const { verifyToken } = require("../tool/token")

// 获取评论通知表
exports.obtain = async data => {
    let { token } = data
    let tokenRes = verifyToken(token)
    let user = await User.findById(tokenRes.id)
    let res = await ComNotify.findOne({ userID: tokenRes.id })
    if (res) {
        let notify_list = res.notify_list
        let friends = await Friend.findOne({ userID: tokenRes.id })
        let list = []
        notify_list.map(item => {
            if (item.type == 'like') {
                friends.friend_list.map(friend => {
                    if (friend.user == item.fromUser) {
                        item.fromName = friend.nickName
                    }
                })
                list.push(item)
            } else {
                if (item.fromUser == tokenRes.id) {
                    item.fromName = user.name
                }
                if (item.toUser == tokenRes.id) {
                    item.toName = user.name
                }
                friends.friend_list.map(friend => {
                    if (friend.user == item.fromUser) {
                        item.fromName = friend.nickName
                    }
                    if (friend.user == item.toUser) {
                        item.toName = friend.nickName
                    }
                })
                list.push(item)
            }
        })
        return list
    } else {
        return []
    }
}

// 更新评论通知表
exports.update = async data => {
    let { token } = data
    let tokenRes = verifyToken(token)
    let res = await ComNotify.findOne({ userID: tokenRes.id })
    let notify_list = res.notify_list
    for (let i = 0; i < notify_list.length; i++) {
        if (notify_list[i].unRead) {
            break
        } else {
            notify_list[i].unRead = true
        }
    }
    let result = await ComNotify.updateOne({ userID: tokenRes.id }, { $set: { notify_list } })
    if (result.nModified > 0) {
        return { status: 1, msg: "更新成功" }
    } else {
        return { status: 0, msg: "更新失败" }
    }
}

// 删除留言通知表
exports.remove = async data => {
    let { token, fromUser, date } = data
    let tokenRes = verifyToken(token)
    let res = await ComNotify.findOne({ userID: tokenRes.id })
    let notify_list = res.notify_list
    let index = notify_list.findIndex(item => {
        return item.fromUser == fromUser && new Date(item.date).getTime() == new Date(date).getTime()
    })
    notify_list.splice(index, 1)
    let result = await ComNotify.updateOne({ userID: tokenRes.id }, { $set: { notify_list } })
    if (result.nModified > 0) {
        return { status: 1, msg: "删除成功" }
    } else {
        return { status: 0, msg: "删除失败" }
    }
}