let { getDyNotify, remove } = require("../controllers/c_dyNotify")

module.exports = {
    // 获取动态通知
    "GET /dynamic/notify/get": async ctx => {
        let res = await getDyNotify(ctx.request.query)
        ctx.body = res
    },
    // 移除动态通知
    "POST /dynamic/notify/remove": async ctx => {
        let res = await remove(ctx.request.body)
        ctx.body = res
    }
}