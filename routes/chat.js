let { history } = require("../controllers/c_chat")
module.exports = {
    // 获取聊天记录
    "GET /chat/history": async ctx => {
        let res = await history(ctx.request.query)
        ctx.body = res
    }
}