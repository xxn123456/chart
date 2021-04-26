let { create,
    getList,
    groupInfo,
    modifyInfo,
    addMember,
    exit,
    transfer,
    management,
    dissolve } = require("../controllers/c_group")
module.exports = {
    //创建群列表
    "POST /group/creat": async ctx => {
        let res = await create(ctx.request.boyd)
        ctx.body = res
    },

    // 获取群详情
    "GET /group/info": async ctx => {
        let res = await groupInfo(ctx.request.query)
        ctx.body = res
    },

    //获取群列表
    "GET /group/list": async ctx => {
        let res = await getList(ctx.request.query)
        ctx.body = res
    },

    // 修改群名称
    "POST /group/name": async ctx => {
        let res = await modifyInfo(ctx.request.body)
        ctx.body = res
    },

    // 添加群成员
    "POST /group/member/add": async ctx => {
        let res = await addMember(ctx.request.body)
        ctx.body = res
    },

    // 退出群聊
    "POST /group/member/exit": async ctx => {
        let res = await exit(ctx.request.body)
        ctx.body = res
    },

    // 转让群主
    "POST /group/transfer": async ctx => {
        let res = await transfer(ctx.request.body)
        ctx.body = res
    },

    // 解散群聊
    "POST /group/dissolve": async ctx => {
        let res = await dissolve(ctx.request.body)
        ctx.body = res
    },

    // 管理群成员
    "POST /group/management": async ctx => {
        let res = await management(ctx.request.body)
        ctx.body = res
    }

}