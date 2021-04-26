let { acquire } = require("../controllers/c_social")

module.exports = {
    // 获取朋友圈动态
    "GET /social/acquire": async ctx => {
        let res = await acquire(ctx.request.query)
        ctx.body = res
    }
}