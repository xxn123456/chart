const Koa = require("koa")
const app = new Koa()
const cors = require("koa2-cors")

// 解决跨域
app.use(cors())

//核心，初始化app作为HTTP 服务器的回调函数像express这么写mac电脑会有问题，无法访问
// const server = require('http').Server(app);  //express写法
const server = require('http').Server(app.callback());  //koa正确姿势
const io = require('socket.io')(server); //核心，实现客户端之间交互通信

let users = []  //存储所有用户的数组

// socket.emit: 告诉当前用户
// io.emit : 广播事件
io.on("connection", socket => {
    socket.on("submit", (data) => {
        let result = users.find(item => {
            return item.userName == data.userName
        })
        socket.emit("login", result)
        if (!result) {
            // 存储当前登陆用户的信息
            socket.userName = data.userName
            socket.avatar = data.avatar

            // 加入到用户数组
            users.push(data)
            socket.emit("loginSuccess", data)

            io.emit("addUser", data)
            io.emit("userList", users)
        }
    })

    socket.on("sendMsg", data => {
        io.emit("sendAll", data)
    })

    socket.on("sendFile", data => {
        io.emit("sendFileAll", data)
    })

    // 用户断开连接的时候
    socket.on('disconnect', () => {
        // 把当前用户的信息从users中删除掉
        let idx = users.findIndex(item => item.userName === socket.userName)
        // 删除掉断开连接的这个人
        users.splice(idx, 1)
        // 1. 告诉所有人，有人离开了聊天室
        io.emit('delUser', {
            userName: socket.userName,
            avatar: socket.avatar
        })
        // 2. 告诉所有人，userList发生更新
        io.emit('userList', users)
    })
})

server.listen(3000, () => {
    console.log(`监听地址: http://localhost:3000`);
})