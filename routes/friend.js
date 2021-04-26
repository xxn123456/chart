const {
    addition,
    acquire,
    deal,
    friends,
    changeNick,
    deleteFriend
} = require("../controllers/c_friend")
const { modify } = require("../controllers/c_user")

module.exports = {
    // 发送好友请求
    "POST /friend/addition": async ctx => {
        let res = await addition(ctx.request.body)
        ctx.body = res
    },
    // 获取好友请求
    "GET /friend/acquire": async ctx => {
        let res = await acquire(ctx.request.query)
        ctx.body = res
    },

    // 处理好友请求
    "POST /friend/deal": async ctx => {
        let res = await deal(ctx.request.body)
        ctx.body = res
    },

    // 获取好友列表
    "GET /friend/friends": async ctx => {
        let res = await friends(ctx.request.query)
        ctx.body = res
    },

    // 修改好友昵称
    "POST /friend/modify": async ctx => {
        let res = await changeNick(ctx.request.body)
        ctx.body = res
    },

    // 删除好友
    "POST /friend/delete": async ctx => {
        let res = await deleteFriend(ctx.request.body)
        ctx.body = res
    }

}