const userSocket = require("../model/userSocketModel")
const Group = require("../model/groupModel")
const User = require("../model/userModel")

const { saveChat } = require("../controllers/c_chat")
const { verifyToken } = require("../tool/token")

// 修改用户头像
exports.avatars = async (token, url) => {
    let userToken = verifyToken(token)
    let result = await User.updateOne({ _id: userToken.id }, { avatars: url })
    if (result.nModified) {
        return {
            status: 1,
            msg: "修改成功"
        }
    } else {
        return {
            status: 0,
            msg: "修改失败"
        }
    }
}

// 处理用户发送的图片和语音信息(私聊)
exports.chatMsg = async (data) => {
    data.chatType = "private"
    let res = await saveChat(data)
    let userToken = verifyToken(data.token)
    let tokenUser = await User.findById(userToken.id)
    let socketUser = await userSocket.findOne({ userId: data.id })
    // 通知用户更新信息
    global.io.to(socketUser.socketId).emit("updateChat", {
        belong: userToken.id,
        message: data.message,
        img: data.img ? data.img : "",
        duration: data.duration ? data.duration : "",
        chatType: "private",
        date: new Date(),
        type: data.type,
        user: {
            name: tokenUser.name,
            avatars: tokenUser.avatars
        }
    })
    return { status: 1, msg: "上传成功", type: "private" }
}

// 处理用户发送的图片和语音信息(群聊)
exports.groupMsg = async (data) => {
    let { token } = data
    data.chatType = "group"
    let tokenRes = verifyToken(token)

    let tokenUser = await User.findById(tokenRes.id)

    let res = await saveChat(data)
    let group = await Group.findById(data.id)
    let user_list = group.user_list
    let obj = {
        id: data.id,
        chatType: "group",
        belong: tokenRes.id,
        user: {
            name: tokenUser.name,
            avatars: tokenUser.avatars
        },
        type: data.type,
        message: data.message,
        img: data.img ? data.img : "",
        duration: data.duration ? data.duration : "",
        date: new Date()
    }

    // 通知用户更新信息
    let result = await Promise.all(user_list.map(async item => {
        if (item.user != tokenRes.id) {
            let socketUser = await userSocket.findOne({ userId: item.user })
            global.io.to(socketUser.socketId).emit("updateChat", obj)
        }
        return item
    }))
    return { status: 1, msg: "上传成功", type: "private" }
}

// 用户发表动态
exports.publish = async (data) => {
    return { status: 1, msg: "上传成功", type: "private" }
}