const fs = require("fs")
const Dynamic = require("../model/dynamicModel")
const Friend = require("../model/friendModel")
const Social = require("../model/socialModel")
const User = require("../model/userModel")
const DyNotify = require("../model/dyNotifyModel")
const userSocket = require("../model/userSocketModel")
const ComNotify = require("../model/comNotifyModel")

const { verifyToken } = require("../tool/token")

// 发布动态
exports.published = async data => {
    let { token, text, imgList, comments, originalList, like, date, address } = data
    let tokenRes = verifyToken(token)
    let user = await User.findById(tokenRes.id)
    // 添加到我的动态表中
    let tokenDynamic = await Dynamic.findOne({ userID: tokenRes.id })
    if (tokenDynamic) {
        let logList = tokenDynamic.logList
        logList.unshift({
            text, imgList, originalList, comments, like, date, address
        })
        res = await Dynamic.updateOne({ userID: tokenRes.id }, { $set: { logList } })
    } else {
        res = await Dynamic.create({
            userID: tokenRes.id,
            logList: [{
                text, imgList, originalList, comments, like, date, address
            }]
        })
    }
    if (res.userID || res.nModified == 1) {

        let friends = await Friend.findOne({ userID: tokenRes.id })
        let friend_list = friends.friend_list
        friend_list.push({  //将token用户也添加到好友表中
            user: tokenRes.id,
            nickName: ""
        })
        let result = await Promise.all(friend_list.map(async item => {
            // 添加到我的动态表中成功后添加到朋友圈表中（我和好友的朋友圈）
            let d_list = await Social.findOne({ userID: item.user })
            if (d_list) {
                let dynamicList = d_list.dynamicList
                dynamicList.unshift({
                    friend: tokenRes.id, date,
                })
                let d_res = await Social.updateOne({ userID: item.user }, { $set: { dynamicList } })
            } else {
                let d_res = await Social.create({
                    userID: item.user,
                    dynamicList: [
                        { friend: tokenRes.id, date }
                    ]
                })
            }

            // 添加到好友新动态通知表中
            if (item.user != tokenRes.id) {
                let dy = await DyNotify.findOne({ userID: item.user })
                if (dy) {
                    let notify_list = dy.notify_list
                    notify_list[0] = {
                        fromUser: user._id,
                        fromImg: user.avatars
                    }
                    let d_res = await DyNotify.updateOne({ userID: item.user }, { $set: { notify_list } })
                } else {
                    let d_res = await DyNotify.create({
                        userID: item.user,
                        notify_list: [
                            {
                                ormUser: user._id,
                                fromImg: user.avatars
                            }
                        ]
                    })
                }
                let socketUser = await userSocket.findOne({ userId: item.user })
                global.io.to(socketUser.socketId).emit("getDyNotify")
            }
        }))
        return { status: 1, msg: "发布成功" }
    } else {
        return { status: 0, msg: "发布失败" }
    }

}

// 点赞
exports.giveALike = async data => {
    let { token, id, date } = data
    let tokenRes = verifyToken(token)
    let user = await User.findById(tokenRes.id)
    let idDynamic = await Dynamic.findOne({ userID: id })
    let logList = idDynamic.logList
    let index = logList.findIndex(item => {
        return new Date(item.date).getTime() == new Date(date).getTime()
    })
    let likeIndex = logList[index].like.findIndex(item2 => {
        return item2.id.toString() == user._id.toString()
    })
    let res = null
    if (likeIndex > -1) {
        logList[index].like.splice(likeIndex, 1)
        res = await Dynamic.updateOne({ userID: id }, { $set: { logList } })
    } else {
        logList[index].like.unshift({ id: user._id, nickName: null })
        res = await Dynamic.updateOne({ userID: id }, { $set: { logList } })
        if (res.nModified > 0) {
            if (tokenRes.id != id) {
                // 添加到通知表
                let comNotify = await ComNotify.findOne({ userID: id })
                let result = null
                if (comNotify) {
                    let obj = {
                        fromUser: tokenRes.id,
                        fromName: user.name,
                        toUser: null,
                        toName: null,
                        date: new Date(),
                        logDate: date,
                        type: "like",
                        content: null,
                        text: logList[index].text,
                        unRead: false,
                        id
                    }
                    let notify_list = comNotify.notify_list
                    notify_list.unshift(obj)
                    result = await ComNotify.updateOne({ userID: id }, { $set: { notify_list } })
                } else {
                    let notify_list = [{
                        fromUser: tokenRes.id,
                        fromName: user.name,
                        toUser: null,
                        toName: null,
                        date: new Date(),
                        logDate: date,
                        type: "like",
                        content: null,
                        text: logList[index].text,
                        unRead: false,
                        id
                    }]
                    result = await ComNotify.create({ userID: id, notify_list })
                }
                if (result.userID || result.nModified > 0) {
                    let socketUser = await userSocket.findOne({ userId: id })
                    global.io.to(socketUser.socketId).emit("getComNotify")
                }
            }
        }
    }
    return {}
}

// 评论
exports.comment = async data => {
    let { token, id, date, toUser, toName, content } = data
    let tokenRes = verifyToken(token)
    let user = await User.findById(tokenRes.id)
    let idDynamic = await Dynamic.findOne({ userID: id })
    let logList = idDynamic.logList
    let index = logList.findIndex(item => {
        return new Date(item.date).getTime() == new Date(date).getTime()
    })
    logList[index].comments.unshift({
        fromUser: user._id,
        fromName: user.name,
        toUser,
        toName,
        content,
    })
    let res = await Dynamic.updateOne({ userID: id }, { $set: { logList } })
    if (res.nModified == 1) {
        // 添加到通知表
        let arr = []
        if (toUser == id && user._id != id) {  //当toUser和id相同时并且fromUser和id不同时，只需通知一个人(动态的主人)
            // console.log("第一种情况")
            arr = [{ to: id, id: tokenRes.id, name: user.name }]
        } else if (user._id == id && toUser != id) { //当fromUser和id相同而toUser不同时，只需通知一个人（toUser）
            // console.log("第二种情况", toName)
            arr = [{ to: toUser, id: tokenRes.id, name: user.name }]
        } else if (toUser == id && user._id == id) {
            // console.log("第三种情况")
        } else { //不同时，则需要通知两个人
            // console.log("第四种情况")
            arr = [{ to: id, id: tokenRes.id, name: user.name }, { to: toUser, id: tokenRes.id, name: user.name }]
        }
        let pro_result = await Promise.all(arr.map((async item => {
            let comNotify = await ComNotify.findOne({ userID: item.to })
            let result = null
            if (comNotify) {
                let obj = {
                    fromUser: item.id,
                    fromName: item.name,
                    toUser,
                    toName,
                    date: new Date(),
                    logDate: date,
                    type: "comment",
                    content,
                    text: logList[index].text,
                    unRead: false,
                    id
                }
                let notify_list = comNotify.notify_list
                notify_list.unshift(obj)
                result = await ComNotify.updateOne({ userID: id }, { $set: { notify_list } })
            } else {
                let notify_list = [{
                    fromUser: item.id,
                    fromName: item.name,
                    toUser,
                    toName,
                    date: new Date(),
                    logDate: date,
                    type: "comment",
                    content,
                    text: logList[index].text,
                    unRead: false,
                    id
                }]
                result = await ComNotify.create({ userID: item.to, notify_list })
            }
            if (result.userID || result.nModified > 0) {
                let socketUser = await userSocket.findOne({ userId: item.to })
                global.io.to(socketUser.socketId).emit("getComNotify")
            }
        })))
        return { status: 1, msg: "评论成功" }
    } else {
        return { status: 0, msg: "评论失败" }
    }

}

// 获取个人动态
exports.acquire = async data => {
    let { token, id, page, limit } = data
    let tokenRes = verifyToken(token)
    let tokenUser = await User.findById(tokenRes.id)
    let obj = {}
    let result = await Friend.findOne({ userID: tokenRes.id }).populate("friend_list.user", "avatars")
    let friend_list = []
    if (result) {
        friend_list = result.friend_list
    }
    if (tokenRes.id == id) {//是用户自己
        obj.avatars = tokenUser.avatars
        obj.id = tokenUser._id
        obj.nickName = tokenUser.name
    } else {
        let index = friend_list.findIndex(item => { //在好友表中查找并获取好友信息（昵称和用户头像）
            return item.user._id == id
        })
        if (index > -1) { //是好友
            let friend = friend_list[index]
            obj.avatars = friend.user.avatars
            obj.id = friend.user._id
            obj.nickName = friend.nickName
        } else { //不是好友
            let idUser = await User.findById(id)
            obj.avatars = idUser.avatars
            obj.id = id
            obj.nickName = idUser.name
        }
    }
    let res = await Dynamic.findOne({ userID: id })
    if (res) {
        let logList = res.logList
        let count = logList.length
        let maxPage = Math.ceil(count / limit)
        if (page > maxPage) {
            return { logList: [], avatars: obj.avatars, name: obj.nickName }
        }
        let skip = (page - 1) * limit
        let spliceLogList = logList.splice(skip, limit)

        let oldLogList = []
        let mapRes = await Promise.all(spliceLogList.map(async item => {
            let like = [] //存储点赞里是好友关系的用户
            // 遍历点赞，在朋友中寻找，不是好友关系则屏蔽
            item.like.map(item4 => {
                if (item4.id == tokenRes.id) { //是token用户自身
                    item4.nickName = tokenUser.name
                    like.push(item4)
                } else { //不是token用户自身则从好友列表中查找
                    friend_list.map(item5 => {
                        if (item5.user._id.toString() == item4.id.toString()) {
                            item4.nickName = item5.nickName
                            like.push(item4)
                        }
                        return item5
                    })
                }
                return item4
            })
            item.like = like
            let comCount = item.comments.length  //评论的个数
            let comments = [] //存储评论里是好友关系的用户
            // 遍历评论，在朋友中寻找，不是好友关系则屏蔽
            for (let i = 0; i < item.comments.length; i++) {
                if (i > 4) {
                    break
                }
                let item6 = item.comments[i]
                // 下面两个变量是为了确定回复者和被回复者与token用户是否是好友关系
                let isFriends1 = false
                let isFriends2 = false

                if (item6.fromUser == tokenRes.id) { //是token用户自身
                    item6.fromName = tokenUser.name
                    isFriends1 = true
                }
                if (item6.toUser == tokenRes.id) { //是token用户自身
                    item6.toUser == tokenUser.name
                    isFriends2 = true
                }
                if (isFriends1 != true || isFriends2 != true) {
                    friend_list.map(item7 => { //判断回复者的好友关系
                        if (item7.user._id.toString() == item6.fromUser.toString()) {
                            item6.fromName = item7.nickName
                            isFriends1 = true
                        }
                        if (item7.user._id.toString() == item6.toUser.toString()) {
                            item6.toName = item7.nickName
                            isFriends2 = true
                        }
                        return item7
                    })
                }
                if (isFriends1 && isFriends2) {//当两个人与token用户都是好友关系时才显示
                    comments.push(item6)
                }
            }
            // item.comments.map(item6 => {

            //     return item6
            // })
            item.comments = comments
            let newObj = {
                comCount,
                avatars: obj.avatars,
                id: obj.id,
                nickName: obj.nickName,
                text: item.text,
                imgList: item.imgList,
                originalList: item.originalList,
                comments: item.comments,
                like: item.like,
                date: item.date,
                address: item.address,
                _id: item._id,
            }
            // let newObj = Object.assign(obj, item)
            // console.log(newObj)
            oldLogList.push(newObj)
            // console.log(newDynamicList)
            return item
        }))
        // 排序（因为以上map遍历以及内嵌了await 导致执行顺序会乱）
        function listSort(a, b) {
            return new Date(b.date).getTime() - new Date(a.date).getTime()
        }
        let newLogList = oldLogList.sort(listSort)
        return { logList: newLogList, avatars: obj.avatars, name: obj.nickName }
    } else {
        return { logList: [], avatars: obj.avatars, name: obj.nickName }
    }

}

// 删除动态
exports.deleteDynamic = async data => {
    let { token, date } = data
    let tokenRes = verifyToken(token)
    let tokenDynamic = await Dynamic.findOne({ userID: tokenRes.id })

    // 从动态表中删除该动态
    let logList = tokenDynamic.logList
    let index = logList.findIndex(item => {
        return new Date(item.date).getTime() == new Date(date).getTime()
    })

    // 删除图片
    let imgList = logList[index].imgList
    let originalList = logList[index].originalList
    let newImgList = [...imgList, ...originalList]
    let basePath = "http://localhost:3000"
    // let basePath = "http://yemengs.cn"
    if (newImgList.length > 0) {
        newImgList.forEach(element => {
            let path = element.replace(basePath, "public")
            if (fs.existsSync(path)) {
                fs.unlinkSync(path);
            }
            console.log(path)
        });
    }

    logList.splice(index, 1)

    let res = await Dynamic.updateOne({ userID: tokenRes.id }, { $set: { logList } })



    let friends = await Friend.findOne({ userID: tokenRes.id })
    if (friends) {
        let friend_list = friends.friend_list
        if (friend_list.length > 0) {
            let result = await Promise.all(friend_list.map(async item => {
                let social = await Social.findOne({ userID: item.user })
                let dynamicList = social.dynamicList
                let index = dynamicList.findIndex(item2 => {
                    return item2.friend.toString() == tokenRes.id.toString() && new Date(item2.date).getTime() == new Date(date).getTime()
                })
                if (index > -1) {
                    dynamicList.splice(index, 1)
                    let updateSocial = await Social.updateOne({ userID: item.user }, { $set: { dynamicList } })
                }
            }))
        }
    }
    if (res.nModified > 0) {
        return { status: 1, msg: "删除成功" }
    } else {
        return { status: 0, msg: "删除失败" }
    }
}

// 获取单条动态
exports.singleDynamic = async data => {
    let { token, id, date } = data
    let tokenRes = verifyToken(token)
    let tokenUser = await User.findById(tokenRes.id)
    let obj = {}
    let result = await Friend.findOne({ userID: tokenRes.id }).populate("friend_list.user", "avatars")
    let friend_list = []
    if (result) {
        friend_list = result.friend_list
    }
    if (tokenRes.id == id) {//是用户自己
        obj.avatars = tokenUser.avatars
        obj.id = tokenUser._id
        obj.nickName = tokenUser.name
    } else {
        let index = friend_list.findIndex(item => { //在好友表中查找并获取好友信息（昵称和用户头像）
            return item.user._id == id
        })
        if (index > -1) { //是好友
            let friend = friend_list[index]
            obj.avatars = friend.user.avatars
            obj.id = friend.user._id
            obj.nickName = friend.nickName
        } else {
            let idUser = await User.findById(id)
            obj.avatars = idUser.avatars
            obj.id = id
            obj.nickName = idUser.name
        }
    }
    let res = await Dynamic.findOne({ userID: id })
    let logIndex = res.logList.findIndex(item => {
        return new Date(item.date).getTime() == new Date(date).getTime()
    })

    let log = res.logList[logIndex]

    let like = [] //存储点赞里是好友关系的用户
    // 遍历点赞，在朋友中寻找，不是好友关系则屏蔽
    log.like.map(item4 => {
        if (item4.id == tokenRes.id) { //是token用户自身
            item4.nickName = tokenUser.name
            like.push(item4)
        } else { //不是token用户自身则从好友列表中查找
            friend_list.map(item5 => {
                if (item5.user._id.toString() == item4.id.toString()) {
                    item4.nickName = item5.nickName
                    like.push(item4)
                }
                return item5
            })
        }
        return item4
    })
    log.like = like

    let comments = [] //存储评论里是好友关系的用户
    // 遍历评论，在朋友中寻找，不是好友关系则屏蔽
    log.comments.map(item6 => {
        // 下面两个变量是为了确定回复者和被回复者与token用户是否是好友关系
        let isFriends1 = false
        let isFriends2 = false

        if (item6.fromUser == tokenRes.id) { //是token用户自身
            item6.fromName = tokenUser.name
            isFriends1 = true
        }
        if (item6.toUser == tokenRes.id) { //是token用户自身
            item6.toUser == tokenUser.name
            isFriends2 = true
        }
        if (isFriends1 != true || isFriends2 != true) {
            friend_list.map(item7 => { //判断回复者的好友关系
                if (item7.user._id.toString() == item6.fromUser.toString()) {
                    item6.fromName = item7.nickName
                    isFriends1 = true
                }
                if (item7.user._id.toString() == item6.toUser.toString()) {
                    item6.toName = item7.nickName
                    isFriends2 = true
                }
                return item7
            })
        }
        if (isFriends1 && isFriends2) {//当两个人与token用户都是好友关系时才显示
            comments.push(item6)
        }
        return item6
    })
    log.comments = comments
    let newObj = {
        avatars: obj.avatars,
        id: obj.id,
        nickName: obj.nickName,
        text: log.text,
        imgList: log.imgList,
        originalList: log.originalList,
        comments: log.comments,
        like: log.like,
        date: log.date,
        address: log.address,
        _id: log._id,
    }
    return newObj
}