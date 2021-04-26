const { dialogueList, updateUnRead, remove } = require("../controllers/c_dialogue")
module.exports = {
    // 获取会话表
    "GET /dialogue/list": async ctx => {
        let res = await dialogueList(ctx.request.query)
        ctx.body = res
    },
    // 更新会话表（未读）
    "POST /dialogue/updateUnRead": async ctx => {
        let res = await updateUnRead(ctx.request.body)
        ctx.body = res
    },

    //移除聊天
    "POST /dialogue/remove": async ctx => {
        let res = await remove(ctx.request.body)
        ctx.body = res
    }
}