const User = require("../model/userModel")
const Friend = require("../model/friendModel")
const { verifyToken } = require("../tool/token")
const Application = require("../model/application")
const { chineseToPinYin } = require("../tool/parseChinese")
const Notify = require("../model/notifyModel")
const Dialogue = require("../model/dialogueModel")
// 发送好友请求
exports.addition = async data => {
    let { token, id, note } = data
    let res = verifyToken(token)
    let result = await Application.findOne({ userID: id })
    let answer = null;
    if (!result) {
        answer = await Application.create({
            userID: id,
            applyList: [
                { note, applyId: res.id, time: new Date() }
            ]
        })
    } else {
        let arr = result.applyList
        let bool = arr.map(item => {
            return item.applyId == res.id
        })
        // 存在的话则先删除
        if (bool) {
            let sss = await Application.update({ userID: id }, { $pull: { applyList: { applyId: res.id } } })
        }
        answer = await Application.update({
            userID: id,
        }, {
            '$push': {
                applyList: { note, applyId: res.id, time: new Date() }
            }
        });
    }
    if (answer.nModified == 0) {
        return {
            status: 0,
            msg: "请求发送失败，请稍后再试"
        }

    } else {
        return {
            status: 1,
            msg: "请求发送成功"
        }
    }
}

// 获取好友请求
exports.acquire = async data => {
    let res = verifyToken(data.token)
    let result = await Application.findOne({ userID: res.id })
    // type 为 number 时获取的是请求的数量
    // type 为 details 时获取的是请求的详情
    if (data.type == "number") {
        if (result) {
            return result
        } else {
            return {
                applyList: []
            }
        }
    } else {
        if (result) {
            let acquire = {
                userID: result.userID,
                applyList: []
            }
            result.applyList.map(item => {
                acquire.applyList.push({
                    note: item.note,
                    applyId: item.applyId,
                    time: item.time
                })
            })
            let arr = await Promise.all(acquire.applyList.map(async item => {
                let user = await User.findOne({ _id: item.applyId })
                item.avatars = user.avatars
                item.name = user.name
                return item
            }))
            return acquire
        } else {
            return {
                applyList: []
            }
        }
    }

}

// 处理好友请求
exports.deal = async data => {
    let { token, applyId, operation, nickName } = data
    let tokenRes = verifyToken(token)
    // 通知
    let notifyRes = await Notify.findOne({ userID: applyId })
    let notifyResult = null
    if (notifyRes) {
        // 更新通知表
        notifyResult = await Notify.update({
            "userID": applyId
        }, { $push: { "notify_list": { "operaUser": tokenRes.id, "operation": operation, "genre": "application", "unRead": false, "date": new Date() } } })
    } else {
        // 创建通知表
        notifyResult = await Notify.create({
            userID: applyId,
            notify_list: [{ "operaUser": tokenRes.id, "operation": operation, "genre": "application", "unRead": false, "date": new Date() }]
        })
    }
    // 关于好友表的操作
    if (operation == "agree") {
        let table = await Friend.findOne({ userID: tokenRes.id })
        let applyTable = await Friend.findOne({ userID: applyId })
        let answer = null
        if (table) {
            answer = await Friend.update({
                userID: tokenRes.id
            }, { $push: { friend_list: { user: applyId, nickName } } })
            if (answer.nModified) {
                let sss = await Application.update({ userID: tokenRes.id }, { $pull: { applyList: { applyId } } })
                answer = {
                    msg: "已同意该用户的好友请求",
                    status: 1
                }
            }
        } else {

            answer = await Friend.create({
                userID: tokenRes.id,
                friend_list: [{ "user": applyId, nickName }]
            });
            if (answer) {
                let sss = await Application.update({ userID: tokenRes.id }, { $pull: { applyList: { applyId } } })
                answer = {
                    msg: "已同意该用户的好友请求",
                    status: 1
                }
            }
        }
        // 获取被申请者的用户资料，获取name属性，并将其作为nickName
        let tokenUser = await User.findOne({ _id: tokenRes.id })
        if (applyTable) {
            let applyResult = await Friend.update({
                userID: applyId
            }, { $push: { friend_list: { user: tokenRes.id, nickName: tokenUser.name } } })
        } else {
            let c_s = await Friend.create({
                userID: applyId,
                friend_list: [{ "user": tokenRes.id, nickName: tokenUser.name }]
            });
        }

        return answer
    } else {
        let sss = await Application.update({ userID: tokenRes.id }, { $pull: { applyList: { applyId } } })
        return {
            status: 0,
            msg: "已经拒绝该用户的请求"
        }
    }

}

// 获取好友
exports.friends = async data => {
    let { token } = data
    let tokenRes = verifyToken(token)
    let friend = await Friend.findOne({ userID: tokenRes.id })
    if (friend) {
        let result = await Friend.findOne({ userID: tokenRes.id }).populate("friend_list.user", "avatars")
        let friend_list = result.friend_list
        let val = {}
        // 生成大写字母并生成分组对象
        for (var i = 0; i < 26; i++) {
            let res = String.fromCharCode(65 + i);
            val[res] = []
        }
        // 将好友昵称文字转为拼音并将放入分组对象中
        for (let i = 0; i < friend_list.length; i++) {
            let reg = new RegExp("^[a-zA-Z]")  //匹配备注是以字母开头的
            let initial = null
            if (reg.test(friend_list[i].nickName)) { //如果备注是以字母开头的
                initial = friend_list[i].nickName.substr(0, 1)
            } else { //备注是文字开头
                let pinyin = chineseToPinYin(friend_list[i].nickName)
                initial = pinyin.substr(0, 1)
            }
            initial = initial.toUpperCase()
            val[initial].push(friend_list[i])
        }
        return { friends: val, total: friend_list.length, friend_list }
    } else {
        return { friends: {}, total: 0 }
    }

}


// 修改好友昵称
exports.changeNick = async data => {
    let { token, id, nickName } = data
    let tokenRes = verifyToken(token)
    let result = await Friend.findOne({ userID: tokenRes.id })
    let index = result.friend_list.findIndex(item => {
        return item.user == id
    })
    result.friend_list[index].nickName = nickName
    let friend_list = result.friend_list
    let ss = await Friend.update({ userID: tokenRes.id, "friend_list.user": id }, {
        $set:
        {
            friend_list: friend_list
        }
    })
    if (ss.nModified) {
        return {
            msg: "修改成功",
            status: 1
        }
    } else {
        return {
            msg: "修改失败",
            status: 0
        }
    }
}


// 删除好友
exports.deleteFriend = async data => {
    let { token, id } = data
    let tokenRes = verifyToken(token)

    // 将id用户从登陆用户的好友列表中删除
    let tokenFriend = await Friend.findOne({ userID: tokenRes.id })
    let friend_list = tokenFriend.friend_list
    let index = friend_list.findIndex(item => {
        return item.user == id
    })
    friend_list.splice(index, 1)
    let modifyResult = await Friend.update({ userID: tokenRes.id }, { $set: { friend_list: friend_list } })

    // 将token用户从好友的好友列表中删除
    let idFriend = await Friend.findOne({ userID: id })
    friend_list = idFriend.friend_list
    index = friend_list.findIndex(item => {
        return item.user == tokenRes.id
    })
    friend_list.splice(index, 1)
    let idResult = await Friend.update({ userID: id }, { $set: { friend_list: friend_list } })


    // 将与好友的会话从会话列表中删除
    let dialogToken = await Dialogue.findOne({ userID: tokenRes.id })
    if (dialogToken) {
        let chat_list = dialogToken.chat_list
        let index = chat_list.findIndex(item => {
            return item.userID == id
        })
        chat_list.splice(index, 1)
        dialogRes = await Dialogue.updateOne({ "userID": tokenRes.id }, { $set: { "chat_list": chat_list } })
    }
    let dialogID = await Dialogue.findOne({ userID: id })
    if (dialogID) {
        let chat_list = dialogID.chat_list
        let index = chat_list.findIndex(item => {
            return item.userID == tokenRes.id
        })
        chat_list.splice(index, 1)
        dialogRes = await Dialogue.updateOne({ "userID": id }, { $set: { "chat_list": chat_list } })
    }

    if (modifyResult.nModified) {
        return { status: 1, msg: "好友删除成功" }
    } else {
        return { status: 0, msg: "好友删除失败" }
    }
}