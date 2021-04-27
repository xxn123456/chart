const Social = require("../model/socialModel")
const Friend = require("../model/friendModel")
const Dynamic = require("../model/dynamicModel")
const User = require("../model/userModel")

const { verifyToken } = require("../tool/token")

// 获取朋友圈
exports.acquire = async data => {
    let { token, page, limit } = data
    let tokenRes = verifyToken(token)
    let social = await Social.findOne({ userID: tokenRes.id })
    let tokenUser = await User.findById(tokenRes.id)
    if (social) {
        let dynamicList = social.dynamicList
        if (dynamicList.length == 0) {  //
            return {
                dynamicList
            }
        } else {
            let count = dynamicList.length
            let maxPage = Math.ceil(count / limit)
            if (page > maxPage) {
                return []
            }
            let skip = (page - 1) * limit
            let spliceDynamicList = dynamicList.splice(skip, limit)
            let result = await Friend.findOne({ userID: tokenRes.id }).populate("friend_list.user", "avatars")
            if (result) {
                let friend_list = result.friend_list
                let oldDynamicList = []
                let mapRes = await Promise.all(spliceDynamicList.map(async item => {
                    let obj = {}
                    if (item.friend == tokenRes.id) {//是用户自己
                        obj.avatars = tokenUser.avatars
                        obj.id = tokenUser._id
                        obj.nickName = tokenUser.name
                    } else { //是好友
                        let index = friend_list.findIndex(item2 => { //在好友表中查找并获取好友信息（昵称和用户头像）
                            return item2.user._id == item.friend
                        })
                        if (index > -1) {
                            let friend = friend_list[index]
                            obj.avatars = friend.user.avatars
                            obj.id = friend.user._id
                            obj.nickName = friend.nickName
                        }
                    }

                    let f_dynamic = await Dynamic.findOne({ userID: item.friend })
                    let logIndex = f_dynamic.logList.findIndex(item3 => { //查找动态
                        // 根据时间查找
                        return new Date(item3.date).getTime() == new Date(item.date).getTime()
                    })

                    if (logIndex > -1) {
                        let log = f_dynamic.logList[logIndex]

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
                        for (let i = 0; i < log.comments.length; i++) {
                            let item6 = log.comments[i]
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
                        obj.comCount = comments.length //评论的条数
                        log.comments = comments.splice(0, 5) //截取返回
                        obj.log = log
                        oldDynamicList.push(obj)
                    }
                    return item
                }))
                // 排序（因为以上map遍历以及内嵌了await 导致执行顺序会乱）
                function listSort(a, b) {
                    return new Date(b.log.date).getTime() - new Date(a.log.date).getTime()
                }
                let newDynamicList = oldDynamicList.sort(listSort)


                return newDynamicList
            } else {
                return {
                    dynamicList
                }
            }
        }
    } else { //social不存在直接返回
        return {
            dynamicList: []
        }
    }
}