const { getNotice, readNotice, deleteNotice } = require("../controllers/c_notify")

module.exports = {
    // 获取通知
    "GET /notify/notice": async ctx => {
        let res = await getNotice(ctx.request.query)
        ctx.body = res
    },

    // 修改通知（将未读通知标为已读通知）
    "POST /notify/read": async ctx => {
        let res = await readNotice(ctx.request.body)
        ctx.body = res
    },

    // 删除通知
    "POST /notify/delete": async ctx => {
        let res = await deleteNotice(ctx.request.body)
        ctx.body = res
    }
}