let { obtain, update, remove } = require("../controllers/c_comNotify")
module.exports = {
    // 获取评论通知表
    "GET /comment/notify": async ctx => {
        let res = await obtain(ctx.request.query)
        ctx.body = res
    },
    // 更新评论通知表
    "POST /comment/update": async ctx => {
        let res = await update(ctx.request.body)
        ctx.body = res
    },
    // 删除评论通知
    "POST /comment/remove": async ctx => {
        let res = await remove(ctx.request.body)
        ctx.body = res
    }
}