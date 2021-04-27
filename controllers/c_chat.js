const fs = require("fs")
const { verifyToken } = require("../tool/token")
const Chat = require("../model/chatModel")
const GroupChat = require("../model/groupChatModel")
const Group = require("../model/groupModel")
const Friend = require("../model/friendModel")
const Dialogue = require("../model/dialogueModel")
const User = require("../model/userModel")
const userSocket = require("../model/userSocketModel")

let timer = null
let timer2 = null
// let imgStorageTime = 10 * 24 * 60 * 60 * 1000  //图片的存储时间 10天
// let voiceStorageTime = 3 * 24 * 60 * 60 * 1000  //语音的存储时间 3天
// let time = 10 * 60 * 60 * 1000  //定时器的执行时间 10个小时

let imgStorageTime = 10 * 1000  //图片的存储时间 10天
let voiceStorageTime = 10 * 1000  //语音的存储时间 3天
let time = 2000  //定时器的执行时间 10个小时

// 存储聊天记录
exports.saveChat = async data => {
    let { id, message, img, token, type, chatType, duration } = data
    console.log("存储聊天记录")
    let tokenRes = verifyToken(token)
    let user = await User.findById(tokenRes.id)
    if (chatType == "private") { //私聊
        let tokenChat = await Chat.findOne({ fromUser: tokenRes.id, toUser: id })
        let chatRes = ""
        // 存储到token用户的聊天表中
        if (tokenChat) {
            let msg_list = tokenChat.msg_list

            // 防抖 删除录音和图片（超过指定存储时间将自动删除）
            // clearTimeout(timer)
            // timer = setTimeout(async () => {
            //     let basePath = "http://localhost:3000"
            //     // let basePath = "http://yemengs.cn"
            //     if (msg_list.length > 0) {
            //         msg_list.forEach(element => {
            //             if (element.type == "image") {
            //                 let distance = (new Date().getTime() - new Date(element.date).getTime())
            //                 if (distance > imgStorageTime) { //删除图片
            //                     let path = element.message.replace(basePath, "public")
            //                     if (fs.existsSync(path)) {
            //                         fs.unlinkSync(path);
            //                     }
            //                     path = element.img.replace(basePath, "public")
            //                     if (fs.existsSync(path)) {
            //                         fs.unlinkSync(path);
            //                     }
            //                     element.message = basePath + "/common/overdue.svg"
            //                     element.message = basePath + "/common/overdue.svg"
            //                 }
            //             } else if (element.type == "voice") { //删除录音
            //                 let distance = (new Date().getTime() - new Date(element.date).getTime()) / 1000
            //                 if (distance > voiceStorageTime) {
            //                     let path = element.message.replace(basePath, "public")
            //                     if (fs.existsSync(path)) {
            //                         fs.unlinkSync(path);
            //                     }
            //                     element.message = "过期已删除"
            //                 }
            //             }

            //         });
            //         chatRes = await Chat.updateOne({
            //             fromUser: tokenRes.id, toUser: id
            //         }, {
            //             $set: { msg_list }
            //         })
            //     }
            // }, time)

            msg_list.unshift({ message, img, type, duration, belong: tokenRes.id, date: new Date() })
            chatRes = await Chat.updateOne({
                fromUser: tokenRes.id, toUser: id
            }, {
                $set: { msg_list }
            })
        } else {
            chatRes = await Chat.create({
                fromUser: tokenRes.id,
                toUser: id,
                msg_list: [
                    { message, img, type, duration, belong: tokenRes.id, date: new Date() }
                ]
            })
        }
        // 存储到好友的聊天表中
        let idChat = await Chat.findOne({ fromUser: id, toUser: tokenRes.id })
        if (idChat) {
            let msg_list = idChat.msg_list
            msg_list.unshift({ message, img, type, duration, belong: tokenRes.id, date: new Date() })
            chatRes = await Chat.updateOne({
                fromUser: id, toUser: tokenRes.id
            }, {
                $set: { msg_list }
            })
        } else {
            chatRes = await Chat.create({
                fromUser: id,
                toUser: tokenRes.id,
                msg_list: [
                    { message, img, type, duration, belong: tokenRes.id, date: new Date() }
                ]

            })
        }

        // 更新对话信息(token用户)
        let dialogRes = null
        let dialogToken = await Dialogue.findOne({ userID: tokenRes.id })
        if (dialogToken) {
            let chat_list = dialogToken.chat_list
            let index = chat_list.findIndex(item => {
                return item.id == id
            })
            if (index >= 0) {
                chat_list[index].message = message
                chat_list[index].date = new Date()
                chat_list[index].msgType = type
                dialogRes = await Dialogue.updateOne({ "userID": tokenRes.id }, { $set: { "chat_list": chat_list } })
            } else {
                chat_list.unshift({
                    id, type: chatType, msgType: type, message, date: new Date(), unRead: 0
                })
                dialogRes = await Dialogue.updateOne({ "userID": tokenRes.id }, { $set: { "chat_list": chat_list } })
            }
        } else {
            dialogRes = await Dialogue.create({
                "userID": tokenRes.id,
                "chat_list": [{ "id": id, "type": chatType, "msgType": type, "message": message, "date": new Date(), "unRead": 0 }]
            })
        }
        // 更新对话信息（好友）
        let dialogID = await Dialogue.findOne({ userID: id })
        if (dialogID) {
            let chat_list = dialogID.chat_list
            let index = chat_list.findIndex(item => {
                return item.id == tokenRes.id
            })
            if (index >= 0) {
                chat_list[index].message = message
                chat_list[index].date = new Date()
                chat_list[index].msgType = type
                chat_list[index].unRead = chat_list[index].unRead + 1
                dialogRes = await Dialogue.updateOne({ "userID": id }, { $set: { "chat_list": chat_list } })
            } else {
                chat_list.unshift({
                    id: tokenRes.id, type: chatType, msgType: type, message, date: new Date(), unRead: 1
                })
                dialogRes = await Dialogue.updateOne({ "userID": id }, { $set: { "chat_list": chat_list } })
            }
        } else {
            dialogRes = await Dialogue.create({
                "userID": id,
                "chat_list": [{ "id": tokenRes.id, "msgType": type, "type": chatType, "message": message, "date": new Date(), "unRead": 1 }]
            })
        }
    } else { //群聊
        let group_chat = await GroupChat.findOne({ groupID: id })
        let chatRes = null
        if (group_chat) {
            let msg_list = group_chat.msg_list
            msg_list.unshift({ message, img, duration, type, belong: tokenRes.id, date: new Date() })
            chatRes = await GroupChat.updateOne({
                groupID: id
            }, {
                $set: { msg_list }
            })
        } else {
            chatRes = await GroupChat.create({
                "groupID": id,
                "msg_list": [{ message, img, duration, type, "belong": tokenRes.id, "date": new Date() }]
            })
        }
        if (chatRes.groupID || chatRes.nModified) {
            // 更新对话信息
            let group = await Group.findById(id)
            let user_list = group.user_list
            let mapRes = await Promise.all(user_list.map(async item => {

                let dialogRes = null
                let dialogToken = await Dialogue.findOne({ userID: item.user })
                if (dialogToken) {
                    let chat_list = dialogToken.chat_list
                    let index = chat_list.findIndex(item => {
                        return item.id == id
                    })
                    if (index >= 0) {
                        chat_list[index].message = message
                        chat_list[index].date = new Date()
                        chat_list[index].msgType = type
                        chat_list[index].from = user._id
                        if (tokenRes.id != item.user) {
                            chat_list[index].unRead = chat_list[index].unRead + 1
                        }
                        dialogRes = await Dialogue.updateOne({ "userID": item.user }, { $set: { "chat_list": chat_list } })
                    } else {
                        chat_list.unshift({
                            id, from: user._id, type: chatType, msgType: type, message: message, date: new Date(), unRead: 1
                        })
                        dialogRes = await Dialogue.updateOne({ "userID": item.user }, { $set: { "chat_list": chat_list } })
                    }
                } else {
                    dialogRes = await Dialogue.create({
                        "userID": item.user,
                        "chat_list": [{ "id": id, "from": user._id, "type": chatType, "msgType": type, "message": message, "date": new Date(), "unRead": 1 }]
                    })
                }
                return item
            }))

        }

    }

}

// 获取聊天记录
exports.history = async data => {
    let { token, id, type, page, limit } = data
    page ? "" : page = 1
    limit ? "" : limit = 50
    let tokenRes = verifyToken(token)
    let friend = await Friend.findOne({ userID: tokenRes.id }).populate("friend_list.user", ['avatars'])
    let friend_list = friend.friend_list
    if (type == "private") {
        let chats = await Chat.findOne({ fromUser: tokenRes.id, toUser: id }).populate("fromUser").populate("toUser")
        let index = friend_list.findIndex(item => {
            return id == item.user._id
        })
        let name = friend_list[index].nickName
        if (chats) {
            let fromUser = chats.fromUser
            let toUser = chats.toUser
            let msg_list = chats.msg_list
            let count = msg_list.length
            let maxPage = Math.ceil(count / limit)
            if (page > maxPage) {
                return {
                    chats: {
                        fromUser,
                        toUser,
                        msg_list: []
                    }
                }
            }
            let skip = (page - 1) * limit
            let oldList = msg_list.splice(skip, limit)
            let newList = oldList.sort(listSort)
            return {
                chats: {
                    fromUser,
                    toUser,
                    msg_list: newList,
                },
                name,
                count
            }
        } else {
            chats = await Chat.create({
                fromUser: tokenRes.id,
                toUser: id,
                msg_list: []
            })
            return {
                chats,
                name,
                count: 0,
            }
        }
    } else {
        let chats = await GroupChat.findOne({ groupID: id })
        if (chats) {
            let name = chats.groupID.name
            let msg_list = chats.msg_list
            let res = await Promise.all(msg_list.map(async item => {
                if (item.belong == tokenRes.id) {
                    let tokenUser = await User.findById(tokenRes.id)
                    item.user = {
                        name: tokenUser.name,
                        avatars: tokenUser.avatars
                    }
                } else {
                    let index = friend_list.findIndex(item2 => {
                        return item.belong == item2.user._id
                    })
                    if (index > -1) {
                        item.user = {
                            name: friend_list[index].nickName,
                            avatars: friend_list[index].user.avatars
                        }
                    } else {
                        let belongUser = await User.findById(item.belong)
                        item.user = {
                            name: belongUser.name,
                            avatars: belongUser.avatars
                        }
                    }
                }
                return item
            }))
            let count = msg_list.length
            let maxPage = Math.ceil(count / limit)
            if (page > maxPage) {
                return {
                    chats: {
                        groupID: id,
                        msg_list: []
                    },
                    name,
                    count
                }
            }
            let skip = (page - 1) * limit
            let oldList = msg_list.splice(skip, limit)
            let newList = oldList.sort(listSort)
            return {
                chats: {
                    groupID: id,
                    msg_list: newList
                },
                name,
                count
            }
        } else {
            let group = await Group.findById(id)
            let name = group.name
            return {
                chats: {
                    groupID: id,
                    msg_list: []
                },
                name,
                count: 0
            }
        }
    }
}

// 排序的方法
function listSort(a, b) {
    return new Date(a.date).getTime() - new Date(b.date).getTime()
}