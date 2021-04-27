const Visitor = require("../model/visitorsModel")
const Friend = require("../model/friendModel")
const User = require("../model/userModel")
const userSocket = require("../model/userSocketModel")

const { verifyToken } = require("../tool/token")
// 记录访客
exports.record = async data => {
    let { token, id } = data
    let tokenRes = verifyToken(token)
    let idVisitors = await Visitor.findOne({ userID: id })
    let tokenUser = await User.findById(tokenRes.id)
    let result = null
    if (idVisitors) {
        let visitors = idVisitors.visitors
        let count = idVisitors.count
        let index = visitors.findIndex(item => {
            return item.user.toString() == tokenRes.id.toString()
        })
        if (index > -1) {
            // 时间差
            let timeDifference = (new Date().getTime() - new Date(visitors[index].date).getTime()) / 1000 / 60
            // 同一个用户访问时间差大于10分钟时才记录
            let judge = timeDifference > 10
            if (!judge) {
                return {}
            }
        }
        count++
        visitors.unshift({
            user: tokenRes.id,
            nickName: tokenUser.name,
            date: new Date(),
            unRead: false
        })
        result = await Visitor.updateOne({ userID: id }, { $set: { count, visitors } })
    } else {
        result = await Visitor.create({
            userID: id,
            visitors: [{
                user: tokenRes.id,
                nickName: tokenUser.name,
                date: new Date(),
                unRead: false
            }],
            count: 1
        })
    }
    if (result.nModified || result.userID) {
        socketUser = await userSocket.findOne({ userId: id })
        io.to(socketUser.socketId).emit("refreshVisitor")
        return { status: 1, msg: "记录成功" }
    } else {
        return { status: 0, msg: "记录失败" }
    }
}

// 获取访客
exports.acquire = async data => {
    let { token, page, limit } = data
    let tokenRes = verifyToken(token)
    let idVisitors = await Visitor.findOne({ userID: tokenRes.id }).populate("visitors.user", ["avatars", "name"])
    if (!idVisitors) { //不存在时
        return {
            newVisitor: 0,
            visitors: [],
            count: 0
        }
    } else {
        let visitors = idVisitors.visitors
        let newVisitor = 0
        for (let i = 0; i < visitors.length; i++) {
            if (visitors[i].unRead) {
                break
            } else {
                newVisitor++
            }
        }
        let mount = visitors.length
        let maxPage = Math.ceil(mount / limit)
        if (page > maxPage) {
            return {
                visitors: [],
                count: idVisitors.count
            }
        } else {
            let skip = (page - 1) * limit
            let oldVisitors = visitors.splice(skip, limit)
            let tokenFriend = await Friend.findOne({ userID: tokenRes.id })
            let newVisitors = []
            oldVisitors.map(async item => {
                let index = tokenFriend.friend_list.findIndex(item2 => {
                    return item2.user.toString() == item.user._id.toString()
                })
                if (index > -1) {
                    newVisitors.push({
                        user: item.user,
                        nickName: tokenFriend.friend_list[index].nickName,
                        date: item.date,
                        isFriend: true,
                        unRead: item.unRead
                    })
                } else {
                    newVisitors.push({
                        user: item.user,
                        nickName: item.user.name,
                        date: item.date,
                        isFriend: false,
                        unRead: item.unRead
                    })
                }
            })
            return {
                newVisitor,
                visitors: newVisitors,
                count: idVisitors.count
            }
        }
    }
}

// 删除访客
exports.remove = async data => {
    let { token, id, date } = data
    let tokenRes = verifyToken(token)
    let tokenVisitors = await Visitor.findOne({ userID: tokenRes.id })
    let visitors = tokenVisitors.visitors
    let index = visitors.findIndex(item => {
        return item.user == id && new Date(item.date).getTime() == new Date(date).getTime()
    })
    visitors.splice(index, 1)
    let res = await Visitor.updateOne({ userID: tokenRes.id }, { $set: { visitors } })
    if (res.nModified > 0) {
        return { status: 1, msg: "删除成功" }
    } else {
        return { status: 0, msg: "删除失败" }
    }
}

// 更新新访客
exports.update = async data => {
    let { token } = data
    let tokenRes = verifyToken(token)
    let tokenVisitors = await Visitor.findOne({ userID: tokenRes.id })
    let visitors = tokenVisitors.visitors
    for (let i = 0; i < visitors.length; i++) {
        if (visitors[i].unRead) {
            break
        } else {
            visitors[i].unRead = true
        }
    }
    let result = await Visitor.updateOne({ userID: tokenRes.id }, { $set: { visitors } })
    if (result.nModified > 0) {
        return { status: 1, msg: "更新成功" }
    } else {
        return { status: 0, msg: "更新失败" }
    }
}