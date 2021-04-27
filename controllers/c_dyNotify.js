const DyNotify = require("../model/dyNotifyModel")

const { verifyToken } = require("../tool/token")

// 获取动态通知表
exports.getDyNotify = async data => {
    let { token } = data
    let tokenRes = verifyToken(token)
    let res = await DyNotify.findOne({ userID: tokenRes.id })
    if (res) {
        return res.notify_list
    } else {
        return []
    }
}

// 清除动态通知表
exports.remove = async data => {
    let { token } = data
    let tokenRes = verifyToken(token)
    let notify_list = []
    let res = await DyNotify.updateOne({ userID: tokenRes.id }, { $set: { notify_list } })
    if (res.nModified > 0) {
        return { status: 1, msg: "清理成功" }
    } else {
        return { status: 0, msg: "清理失败" }
    }
}
