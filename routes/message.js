let { published, acquire, reply } = require("../controllers/c_message")

module.exports = {
    // 发布留言
    "POST /message/published": async ctx => {
        let res = await published(ctx.request.body)
        ctx.body = res
    },

    // 获取留言
    "GET /message/acquire": async ctx => {
        let res = await acquire(ctx.request.query)
        ctx.body = res
    },

    // 回复留言
    "POST /message/reply": async ctx => {
        let res = await reply(ctx.request.body)
        ctx.body = res
    }
}