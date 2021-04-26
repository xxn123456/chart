let { obtain, update, remove } = require("../controllers/c_messNotify")

module.exports = {
    // 获取留言通知表
    "GET /message/notify/obtain": async ctx => {
        let res = await obtain(ctx.request.query)
        ctx.body = res
    },

    // 更新留言通知表
    "POST /message/notify/update": async ctx => {
        let res = await update(ctx.request.body)
        ctx.body = res
    },

    // 删除留言通知表
    "POST /message/notify/remove": async ctx => {
        let res = await remove(ctx.request.body)
        ctx.body = res
    }
}