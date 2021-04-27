const { verifyToken } = require("../tool/token")
const userSocket = require("../model/userSocketModel")
const User = require("../model/userModel")
const { saveChat } = require("../controllers/c_chat")
const Group = require("../model/groupModel")

exports.detail = (io, socket) => {
    // 将io和socket保存到全局变量中
    global.io = io
    global.socket = socket

    // 登陆连接
    socket.on("submit", async (data) => {
        let { id } = verifyToken(data)
        let result = await userSocket.findOne({ userId: id })
        if (result) {
            let res = await userSocket.updateOne({ userId: id }, { socketId: socket.id })
        } else {
            let res = await userSocket.create({
                userId: id,
                socketId: socket.id
            })
        }
    })

    // 发送好友申请
    socket.on("sendDemand", async data => {
        let { id } = data
        let socketUser = await userSocket.findOne({ userId: id })
        io.to(socketUser.socketId).emit("receiveDemand")
    })

    // 好友申请通知
    socket.on("deal", async data => {
        let { applyId, operation, token } = data
        let tokenRes = verifyToken(token)
        let user = await User.findOne({ _id: tokenRes.id })
        let socketUser = await userSocket.findOne({ userId: applyId })
        let name = user.name
        let opera = operation == "Refused" ? "拒绝" : "同意"
        io.to(socketUser.socketId).emit("notification", {
            msg: "用户" + name + opera + "了你的好友请求",
            date: new Date()
        })
    })

    //发送信息
    socket.on("sendMsg", async data => {
        let { id, token, type, chatType, date, message } = data
        let tokenRes = verifyToken(token)
        let tokenUser = await User.findById(tokenRes.id)
        if (type == "text" || type == "location") {
            // 存储聊天记录
            let res = await saveChat(data)
        }
        if (chatType == "private") { //私聊通知
            let socketUser = await userSocket.findOne({ userId: id })
            io.to(socketUser.socketId).emit("updateChat", { belong: tokenRes.id, chatType, message, type, date })
        } else { //群聊通知
            let group = await Group.findById(id)
            let user_list = group.user_list
            // 通知用户更新信息
            let result = await Promise.all(user_list.map(async item => {
                if (item.user != tokenRes.id) {
                    let socketUser = await userSocket.findOne({ userId: item.user })
                    global.io.to(socketUser.socketId).emit("updateChat", {
                        id,
                        chatType: "group",
                        belong: tokenRes.id,
                        user: {
                            name: tokenUser.name,
                            avatars: tokenUser.avatars
                        },
                        type,
                        message,
                        date
                    })
                }
                return item
            }))
        }
    })
}
