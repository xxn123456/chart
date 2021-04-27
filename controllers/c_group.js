const Group = require("../model/groupModel")
const User = require("../model/userModel")
const Friend = require("../model/friendModel")
const GroupNumber = require("../model/numberModel")
const GroupList = require("../model/groupListModel")
const Dialogue = require("../model/dialogueModel")
const { verifyToken } = require("../tool/token")
const userSocket = require("../model/userSocketModel")
const Notify = require("../model/notifyModel")

// 创建群组
exports.create = async data => {
    let { token, name, imgUrl, user_list } = data
    let tokenRes = verifyToken(token)
    user_list = user_list.split(",")
    user_list.unshift(tokenRes.id)
    let g_n = await GroupNumber.findOne({ name: "number" })
    if (!g_n) {
        g_n = await GroupNumber.create({
            name: "number"
        })
    }
    let list = []
    let list_result = await Promise.all(user_list.map(async item => {
        let user = await User.findOne({ _id: item })
        let obj = { user: item, nickName: user.name }
        list.push(obj)
        return item
    }))
    let group_number = g_n.group_number
    let new_group = await Group.create({
        manager: tokenRes.id,
        number: group_number,
        name,
        imgUrl,
        user_list: list
    })
    if (new_group) {
        group_number++
        let result = await GroupNumber.updateOne({ name: "number" }, { $set: { group_number } })
        let gl = null
        let group_list = null
        let gl_res = null

        // 群组创建成功后将该群添加到群成员的群列表中
        let promise_res = await Promise.all(user_list.map(async (item, index) => {
            gl = await GroupList.findOne({ userID: item })
            if (gl) {
                group_list = gl.group_list
                group_list.push({
                    group: new_group._id
                })
                gl_res = await GroupList.updateOne({ userID: item }, { $set: { group_list } })
            } else {
                gl_res = await GroupList.create({
                    userID: item,
                    group_list: [
                        { group: new_group._id }
                    ]
                })
            }
            if (index != 0) {
                inform(item, name, tokenRes.id, "create")
            }
        }))

    }
    return new_group
}

// 获取群详情
exports.groupInfo = async data => {
    let { id, token } = data
    let tokenRes = verifyToken(token)
    let group = await Group.findById(id).populate("user_list.user", "avatars")
    let user_list = group.user_list
    let index = user_list.findIndex(item => {
        return tokenRes.id == item.user._id
    })
    let nickName = user_list[index].nickName

    let friend = await Friend.findOne({ userID: tokenRes.id })
    if (friend) {
        let friend_list = friend.friend_list
        user_list.map(item => {
            friend_list.map(item2 => {
                if (item.user._id.toString() == item2.user.toString()) {
                    item.nickName = item2.nickName
                }
            })
            return item
        })
        group.user_list = user_list
    }
    return {
        group,
        nickName
    }
}

// 修改群头像
exports.modify = async data => {
    let { id, imgUrl } = data
    let res = await Group.updateOne({ _id: id }, { $set: { imgUrl } })
    if (res.nModified) {
        return {
            status: 1,
            msg: "修改成功"
        }
    } else {
        return {
            status: 0,
            msg: "修改失败"
        }
    }
}

// 获取群列表
exports.getList = async data => {
    let { token } = data
    let tokenRes = verifyToken(token)
    let list = await GroupList.findOne({ userID: tokenRes.id }).populate("group_list.group", ["name", "imgUrl"])
    if (list) {
        return list
    } else {
        return {
            group_list: []
        }
    }

}

// 修改群信息
exports.modifyInfo = async data => {
    let { id, name, nickName, token, notice } = data
    let key = null
    let value = null
    if (name || notice) {
        if (name) {
            key = "name"
            value = name
        } else {
            key = "notice"
            value = notice
        }
        let res = await Group.updateOne({ _id: id }, { $set: { [key]: value } })
        return res
    } else if (nickName) {
        let tokenRes = verifyToken(token)
        let group = await Group.findById(id)
        let user_list = group.user_list
        let index = user_list.findIndex(item => {
            return item.user == tokenRes.id
        })
        user_list[index].nickName = nickName
        let res = await Group.updateOne({ _id: id }, { $set: { user_list } })
        return res
    }

}

// 添加群成员
exports.addMember = async data => {
    let { id, list, token } = data
    let tokenRes = verifyToken(token)
    let oldList = []
    let group = await Group.findById(id)
    let list_result = await Promise.all(list.map(async item => {
        let user = await User.findOne({ _id: item })
        let obj = { user: item, nickName: user.name }
        oldList.push(obj)
        return item
    }))
    // 群组创建成功后将该群添加到群成员的群列表中
    let promise_res = await Promise.all(list.map(async item => {
        gl = await GroupList.findOne({ userID: item })
        if (gl) {
            group_list = gl.group_list
            group_list.push({
                group: id
            })
            gl_res = await GroupList.updateOne({ userID: item }, { $set: { group_list } })
        } else {
            gl_res = await GroupList.create({
                userID: item,
                group_list: [
                    { group: id }
                ]
            })
        }
        // 通知
        inform(item, group.name, tokenRes.id, "addMember")
    }))

    let user_list = group.user_list
    let newList = [...user_list, ...oldList]
    let res = await Group.updateOne({ _id: id }, { $set: { user_list: newList } })

    return res
}

// 退出群聊
exports.exit = async data => {
    let { id, token } = data
    let tokenRes = verifyToken(token)
    let group = await Group.findById(id)
    let user_list = group.user_list
    let index = user_list.findIndex(item => {
        return item.user == tokenRes.id
    })
    user_list.splice(index, 1)
    let res = await Group.updateOne({ _id: id }, { $set: { user_list } })

    // 将该群添加到邀请的好友群列表中
    let group_list = await GroupList.findOne({ userID: tokenRes.id })
    let list = group_list.group_list
    let g_index = list.findIndex(item => {
        return item.group == id
    })
    list.splice(g_index, 1)
    let result = await GroupList.updateOne({ userID: tokenRes.id }, { $set: { group_list: list } })

    inform(group.manager, group.name, tokenRes.id, "exit")

    return res
}

//转让群主
exports.transfer = async data => {
    let { id, manager } = data

    let res = await Group.updateOne({ _id: id }, { $set: { manager } })

    //以下操作是将群主放在user_list的首位 
    let group = await Group.findById(id)
    let user_list = group.user_list
    let index = user_list.findIndex(item => {
        return item.user == manager
    })
    let old = user_list.splice(0, 1)
    let old_manager = user_list.splice(index, 1)
    let new_manager = {
        user: old_manager[0].user,
        nickName: old_manager[0].nickName
    }
    user_list.unshift(new_manager)
    let result = await Group.updateOne({ _id: id }, { $set: { user_list } })

    inform(id, group.name, old.user, "transfer")

    return res
}

// 管理群成员
exports.management = async data => {
    let { id, list } = data
    let group = await Group.findById(id)
    let user_list = group.user_list
    let index = null
    list.map(item => {
        index = user_list.findIndex(itemIndex => {
            return item == itemIndex.user
        })
        user_list.splice(index, 1)
        return item
    })
    let result = await Group.updateOne({ _id: id }, { $set: { user_list } })

    // 将该群从（移除的）群成员的群列表中删除
    let res = await Promise.all(list.map(async item => {
        let user_group = await GroupList.findOne({ userID: item })
        let group_list = user_group.group_list
        let index = group_list.findIndex(itemIndex => {
            return id == itemIndex.group
        })
        group_list.splice(index, 1)
        let g_result = await GroupList.updateOne({ userID: item }, { $set: { group_list } })

        inform(item, group.name, group.manager, "management")

        return item
    }))

    return result
}

// 解散群聊
exports.dissolve = async data => {

    let { id } = data
    let group = await Group.findById(id)
    let user_list = group.user_list

    // 将该群从群成员的群列表和对话列表中移除
    let result = await Promise.all(user_list.map(async item => {
        let user_group = await GroupList.findOne({ userID: item.user })
        let group_list = user_group.group_list
        let index = group_list.findIndex(itemIndex => {
            return id == itemIndex.group
        })
        group_list.splice(index, 1)
        let g_result = await GroupList.updateOne({ userID: item.user }, { $set: { group_list } })
        inform(item.user, group.name, group.manager, "dissolve")

        // 关于对话列表的操作
        let res = await Dialogue.findOne({ "userID": item.user })
        if (res) {
            let chat_list = res.chat_list
            let index2 = chat_list.findIndex(item => {
                return id == item.id
            })
            if (index2 > -1) {
                chat_list.splice(index2, 1)
                let result = await Dialogue.updateOne({ "userID": item.user }, { $set: { chat_list } })
            }
        }
        return item
    }))
    // 删除该群
    let res = await Group.deleteOne({ _id: id })

    return res

}

// 通知群成员
function inform(user, name, operaUser, opera) {
    userSocket.findOne({ userId: user }).then(res => {
        io.to(res.socketId).emit("inform", {
            genre: "group",
            name: name,
            operaUser,
            operation: opera,
            date: new Date()
        })
    })
    Notify.findOne({ userID: user }).then(res => {
        if (res) {
            // 更新通知表
            Notify.updateOne({
                "userID": user
            }, { $push: { "notify_list": { "operaUser": operaUser, "operation": opera, "genre": "group", "unRead": false, "date": new Date(), name } } }).then(res => {

            })
        } else {
            // 创建通知表
            Notify.create({
                userID: user,
                notify_list: [{ "operaUser": operaUser, "operation": opera, "genre": "group", "unRead": false, "date": new Date(), name }]
            }).then(res => {

            })
        }
    })

}