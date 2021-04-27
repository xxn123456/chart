const Message = require("../model/messageModel")
const User = require("../model/userModel")
const Friend = require("../model/friendModel")
const MessNotify = require("../model/messNotifyModel")
const userSocket = require("../model/userSocketModel")

const { verifyToken } = require("../tool/token")

// 发布留言
exports.published = async data => {
    let { token, id, content } = data
    let tokenRes = verifyToken(token)
    let idMessage = await Message.findOne({ userID: id })
    let result = null

    if (idMessage) {
        let messages = idMessage.messages
        messages.unshift({
            user: tokenRes.id,
            content,
            nickName: null,
            children: [],
            date: new Date()
        })
        result = await Message.updateOne({ userID: id }, { $set: { messages } })
    } else {
        result = await Message.create({
            userID: id,
            messages: [{
                user: tokenRes.id,
                content,
                nickName: null,
                children: [],
                date: new Date()
            }]

        })
    }



    if (result.userID || result.nModified) {
        if (tokenRes.id !== id) {
            // 成功发表留言后将该留言存储在留言通知表中
            let res = await MessNotify.findOne({ userID: id })
            let resNotify = null
            if (res) {
                let notify_list = res.notify_list
                notify_list.unshift({
                    user: tokenRes.id,
                    content,
                    nickName: null,
                    type: "message",
                    date: new Date(),
                    unRead: false
                })
                resNotify = await MessNotify.updateOne({ userID: id }, { $set: { notify_list } })
            } else {
                resNotify = await MessNotify.create({
                    userID: id,
                    notify_list: [{
                        user: tokenRes.id,
                        content,
                        nickName: null,
                        type: "message",
                        date: new Date(),
                        unRead: false
                    }]
                })
            }
            if (resNotify.userID || resNotify.nModified > 0) {
                socketUser = await userSocket.findOne({ userId: id })
                io.to(socketUser.socketId).emit("message")
            }
        }
        return { status: 1, msg: "发表成功" }
    } else {
        return { stats: 0, msg: "发表失败" }
    }
}

// 获取留言
exports.acquire = async data => {
    let { token, id, page, limit } = data
    let tokenRes = verifyToken(token)
    let user = await User.findById(tokenRes.id)
    let idMessage = await Message.findOne({ userID: id }).populate("messages.user", ["name", "avatars"])
    if (idMessage) {
        let messages = idMessage.messages
        if (messages.length == 0) {
            return {
                messages
            }
        } else {
            let mount = messages.length
            let maxPage = Math.ceil(mount / limit)
            if (page > maxPage) {
                return {
                    messages: [],
                }
            } else {
                let skip = (page - 1) * limit
                let oldMessage = messages.splice(skip, limit)
                let tokenFriend = await Friend.findOne({ userID: tokenRes.id })
                let friend_list = tokenFriend.friend_list
                let newMessage = []
                oldMessage.map(async item => {
                    let obj = {
                        user: item.user,
                        content: item.content,
                        _id: item._id,
                        date: item.date
                    }
                    obj.children = []
                    if (item.user._id.toString() == tokenRes.id) {
                        obj.nickName = user.name
                        item.children.map(item3 => {//遍历回复
                            if (item3.user.toString() == tokenRes.id.toString()) {
                                obj.children.push({
                                    user: item3.user,
                                    name: user.name,
                                    content: item3.content
                                })
                            } else {
                                let index = friend_list.findIndex(item5 => {
                                    return item3.user.toString() == item5.user.toString()
                                })
                                obj.children.push({
                                    user: item3.user,
                                    name: friend_list[index].nickName,
                                    content: item3.content
                                })
                            }
                        })
                        newMessage.push(obj)
                    } else {
                        let index = friend_list.findIndex(item2 => {
                            return item2.user.toString() == item.user._id.toString()
                        })
                        if (index > -1) {
                            obj.nickName = friend_list[index].nickName
                            item.children.map(item3 => { //遍历回复
                                if (item3.user.toString() == tokenRes.id.toString()) {
                                    obj.children.push({
                                        user: item3.user,
                                        name: user.name,
                                        content: item3.content
                                    })
                                } else {
                                    let index = friend_list.findIndex(item5 => {
                                        return item3.user.toString() == item5.user.toString()
                                    })
                                    obj.children.push({
                                        user: item3.user,
                                        name: friend_list[index].nickName,
                                        content: item3.content
                                    })
                                }
                            })
                            newMessage.push(obj)
                        }
                    }
                })
                return {
                    messages: newMessage,
                }
            }
        }
    } else {
        return {
            messages: []
        }
    }
}

// 回复留言
exports.reply = async data => {
    let { token, id, messageID, message, date, content } = data
    let tokenRes = verifyToken(token)
    let idMessage = await Message.findOne({ userID: id })
    let messages = idMessage.messages
    let index = messages.findIndex(item => {
        return messageID.toString() == item.user.toString() && new Date(item.date).getTime() == new Date(date).getTime()
    })
    messages[index].children.unshift({
        user: tokenRes.id,
        date: new Date(),
        content
    })
    let result = await Message.updateOne({ userID: id }, { $set: { messages } })
    if (result.nModified > 0) {
        let toUser = null              //一条留言只能空间所属用户和留言用户可以回复信息
        if (tokenRes.id == messageID) { //当token用户和留言用户(messageID)是同一个人时,则toUser就是id(空间用户)
            toUser = id
        } else {//当token用户和留言用户（messageID）不是同一个人时,则toUser就是messageID(留言用户)
            toUser = messageID
        }
        // 成功发表留言后将该留言存储在留言通知表中
        let res = await MessNotify.findOne({ userID: toUser })
        let resNotify = null
        if (res) {
            let notify_list = res.notify_list
            notify_list.unshift({
                user: tokenRes.id,
                content,
                nickName: null,
                type: "reply",
                date: new Date(),
                message,
                unRead: false
            })
            resNotify = await MessNotify.updateOne({ userID: toUser }, { $set: { notify_list } })
            console.log
        } else {
            resNotify = await MessNotify.create({
                userID: toUser,
                notify_list: [{
                    user: tokenRes.id,
                    content,
                    nickName: null,
                    type: "reply",
                    date: new Date(),
                    message,
                    unRead: false
                }]
            })
        }
        if (resNotify.userID || resNotify.nModified > 0) {
            socketUser = await userSocket.findOne({ userId: id })
            io.to(socketUser.socketId).emit("message")
        }
        return { status: 1, msg: "回复成功" }
    }
}