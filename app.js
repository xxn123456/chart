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
    console.log("连接成功")
})

server.listen(3000, () => {
    console.log(`监听地址: http://localhost:3000`);
})