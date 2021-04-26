let { record, acquire, remove, update } = require("../controllers/c_visitor")

module.exports = {
    // 记录访客
    "POST /visitor/record": async ctx => {
        let res = await record(ctx.request.body)
        ctx.body = res
    },

    // 获取访客
    "GET /visitor/acquire": async ctx => {
        let res = await acquire(ctx.request.query)
        ctx.body = res
    },

    // 移除访客
    "POST /visitor/remove": async ctx => {
        let res = await remove(ctx.request.body)
        ctx.body = res
    },

    // 更新新访客数量
    "POST /visitor/update": async ctx => {
        let res = await update(ctx.request.body)
        ctx.body = res
    }
}