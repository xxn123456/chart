// 处理文件上传
const multer = require('koa-multer')

const fs = require("fs")
const path = require("path")
const { verifyToken } = require("../tool/token")

//关于上传文件的配置 需要安装koa-multer
var storage = multer.diskStorage({
    //文件保存路径由前端传递过来 savePath
    destination: function (req, file, cb) {
        let { savePath, token, id } = req.body
        let tokenRes = verifyToken(token)
        let date = new Date()
        let time = date.getFullYear() + "" + (date.getMonth() + 1) + "" + date.getDate()
        let pathObject = {
            "avatars": { //上传头像
                path: "public/user/" + tokenRes.id + "/" + "avatars",
                savePath: "user/" + tokenRes.id + "/" + "avatars"
            },
            "privateChat": { //私聊图片
                path: "public/chat/private/" + tokenRes.id + "/" + id + "/img/" + time,
                savePath: "chat/private/" + tokenRes.id + "/" + id + "/img/" + time
            },
            "privateVoice": { //私聊语音
                path: "public/chat/private/" + tokenRes.id + "/" + id + "/voice/" + time,
                savePath: "chat/private/" + tokenRes.id + "/" + id + "/voice/" + time
            },
            "groupChat": { //群聊图片
                path: "public/chat/group/" + id + "/img/" + time,
                savePath: "chat/group/" + id + "/img/" + time
            },
            "groupVoice": { //群聊语音
                path: "public/chat/group/" + id + "/voice/" + time,
                savePath: "chat/group/" + id + "/voice/" + time
            },
            "groupAvatars": { //群头像
                path: "public/group" + savePath + "/",
                savePath: savePath + "/"
            },
            "dynamic": { //动态图片
                path: "public/user/" + tokenRes.id + "/dynamic/" + time,
                savePath: "user/" + tokenRes.id + "/dynamic/" + time
            }
        }
        req.body.savePath = pathObject[savePath].savePath
        mkDirsSync(pathObject[savePath].path)
        cb(null, pathObject[savePath].path)
    },
    //修改文件名称
    filename: function (req, file, cb) {
        var fileFormat = (file.originalname).split(".");  //以点分割成数组，数组的最后一项就是后缀名
        if (fileFormat.length == 1) {
            cb(null, Date.now() + "." + req.body.suffix);
        } else {
            cb(null, Date.now() + "." + fileFormat[fileFormat.length - 1]);
        }
        // console.log(file.originalname, fileFormat)
    }
})
//加载配置
var upload = multer({ storage: storage });

exports.upload = upload

// 递归创建目录 同步方法
function mkDirsSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkDirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}

// if (savePath == "avatars") { //上传头像
        //     path = "public/user/" + tokenRes.id + "/" + "avatars"
        //     req.body.savePath = "user/" + tokenRes.id + "/" + "avatars"
        // } else if (savePath == "privateChat") { //私聊
        //     path = "public/chat/private/" + tokenRes.id + "/" + id + "/img/" + time
        //     req.body.savePath = "chat/private/" + tokenRes.id + "/" + id + "/img/" + time
        // } else if (savePath == "groupChat") { //群聊
        //     path = "public/chat/group/" + id + "/" + time
        //     req.body.savePath = "chat/group/" + id + "/" + time
        // } else if (savePath == "groupAvatars") { //群头像
        //     path = "public/group" + savePath + "/"
        //     req.body.savePath = savePath + "/"
        // } else if (savePath == "dynamic") { //动态 
        //     path = "public/user/" + tokenRes.id + "/dynamic/" + time
        //     req.body.savePath = "user/" + tokenRes.id + "/dynamic/" + time
        // }