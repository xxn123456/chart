const MessNotify = require("../model/messNotifyModel")
const Friend = require("../model/friendModel")
const User = require("../model/userModel")
const { verifyToken } = require("../tool/token")

// 获取留言通知表
exports.obtain = async data => {
    let { token } = data
    let tokenRes = verifyToken(token)
    let tokenUser = await User.findById(tokenRes.id)
    let tokenMessNotify = await MessNotify.findOne({ userID: tokenRes.id })
    let friend = await Friend.findOne({ userID: tokenRes.id }).populate("friend_list.user", ["avatars"])
    let friend_list = friend ? friend.friend_list : []
    let messNotify = []  //存储留言通知的数组
    let count = 0   //未读留言通知数量 

    if (tokenMessNotify) {
        let notify_list = tokenMessNotify.notify_list
        if (notify_list.length > 0) {
            let result = await Promise.all(notify_list.map(async item => {
                let obj = {
                    user: item.user,
                    content: item.content,
                    type: item.type,
                    date: item.date,
                    unRead: item.unRead
                }

                //统计未读留言通知
                item.unRead ? "" : count++

                // 当type为"message"时，message属性是不存在的，type为 "reply"是message属性才存在
                item.message ? obj.message = item.message : ""

                if (item.user == tokenRes.id) { //是token用户
                    obj.avatars = tokenUser.avatars
                    obj.nickName = tokenUser.name
                } else {
                    let index = friend_list.findIndex(item2 => {//从好友列表中查找
                        return item2.user._id.toString() == item.user.toString()
                    })
                    if (index > -1) {//是好友
                        obj.avatars = friend_list[index].user.avatars
                        obj.nickName = friend_list[index].nickName
                    } else {//不是好友(已经将其从好友列表中移除了)，从用户列表中查找
                        let user = await User.findById(item.user)
                        obj.avatars = user.avatars
                        obj.nickName = user.name
                    }
                }
                messNotify.push(obj)
            }))
            return {
                messNotify,
                count
            }
        } else {
            return {
                messNotify,
                count
            }
        }
    } else {
        return {
            messNotify,
            count
        }
    }
}

// 更新留言通知表
exports.update = async data => {
    let { token } = data
    let tokenRes = verifyToken(token)
    let tokenMessNotify = await MessNotify.findOne({ userID: tokenRes.id })
    let notify_list = tokenMessNotify.notify_list
    for (let i = 0; i < notify_list.length; i++) {
        if (notify_list[i].unRead) {
            break
        } else {
            notify_list[i].unRead = true
        }
    }
    let result = await MessNotify.updateOne({ userID: tokenRes.id }, { $set: { notify_list } })
    if (result.nModified > 0) {
        return { status: 1, msg: "更新成功" }
    } else {
        return { status: 0, msg: "更新失败" }
    }
}

// 删除留言通知表
exports.remove = async data => {
    let { token, user, date } = data
    let tokenRes = verifyToken(token)
    let tokenMessNotify = await MessNotify.findOne({ userID: tokenRes.id })
    let notify_list = tokenMessNotify.notify_list
    let index = notify_list.findIndex(item => {
        return item.user == user && new Date(item.date).getTime() == new Date(date).getTime()
    })
    notify_list.splice(index, 1)
    let result = await MessNotify.updateOne({ userID: tokenRes.id }, { $set: { notify_list } })
    if (result.nModified > 0) {
        return { status: 1, msg: "删除成功" }
    } else {
        return { status: 0, msg: "删除失败" }
    }
}