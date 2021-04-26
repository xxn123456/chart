const images = require("images")
const fs = require("fs")
const { avatars, chatMsg, groupMsg } = require("../controllers/c_upload")
const { create, modify } = require("../controllers/c_group")

const basePath = "http://localhost:3000/"
// const basePath = "http://www.yemengs.cn/"

//图片路由
module.exports = {

    // 用户头像
    "POST /upload/user": async ctx => {
        let token = ctx.req.body.token
        let url = basePath + ctx.req.body.savePath + "/" + ctx.req.file.filename
        let res = await avatars(token, url)
        ctx.body = res
    },

    // 发送图片信息 （私聊）
    "POST /upload/chat/private/img": async ctx => {
        let data = ctx.req.body
        let url = basePath + ctx.req.body.savePath + "/" + ctx.req.file.filename
        let imgPath = "public/" + ctx.req.body.savePath + "/" + ctx.req.file.filename
        let zipMessage = compression(imgPath, ctx.req.body.savePath, ctx.req.file.filename)
        data.message = zipMessage
        data.img = url
        data.type = "image"
        let res = await chatMsg(data)
        ctx.body = {
            message: zipMessage,
            img: url
        }
    },

    // 发送语音信息 （私聊）
    "POST /upload/chat/private/voice": async ctx => {
        let data = ctx.req.body
        let voicePath = basePath + ctx.req.body.savePath + "/" + ctx.req.file.filename
        data.message = voicePath
        data.type = "voice"
        let res = await chatMsg(data)
        ctx.body = {
            message: voicePath,
        }
    },

    // 发送图片信息（群聊）
    "POST /upload/chat/group/img ": async ctx => {
        let data = ctx.req.body
        let url = basePath + ctx.req.body.savePath + "/" + ctx.req.file.filename
        let imgPath = "public/" + ctx.req.body.savePath + "/" + ctx.req.file.filename
        let zipMessage = compression(imgPath, ctx.req.body.savePath, ctx.req.file.filename)
        data.message = zipMessage
        data.img = url
        data.type = "image"
        let res = await groupMsg(data)
        ctx.body = {
            message: zipMessage,
            img: url
        }
    },

    // 发送语音信息 （群聊）
    "POST /upload/chat/group/voice": async ctx => {
        let data = ctx.req.body
        let voicePath = basePath + ctx.req.body.savePath + "/" + ctx.req.file.filename
        data.message = voicePath
        data.type = "voice"
        let res = await groupMsg(data)
        ctx.body = {
            message: voicePath,
        }
    },

    // 创建群组上传群组头像
    "POST /upload/group": async ctx => {
        let data = ctx.req.body
        data.imgUrl = basePath + ctx.req.body.savePath + "/" + ctx.req.file.filename
        let res = await create(data)
        ctx.body = res
    },

    //修改群组头像
    "POST /upload/group/modify": async ctx => {
        let data = ctx.req.body
        data.imgUrl = basePath + ctx.req.body.savePath + "/" + ctx.req.file.filename
        let res = await modify(data)
        ctx.body = res
    },

    // 上传朋友圈图片
    "POST /upload/dynamic": async ctx => {
        // let data = ctx.req.body 
        let url = basePath + ctx.req.body.savePath + "/" + ctx.req.file.filename
        let imgPath = "public/" + ctx.req.body.savePath + "/" + ctx.req.file.filename
        let zipUrl = compression(imgPath, ctx.req.body.savePath, ctx.req.file.filename, 200)
        ctx.body = {
            imgUrl: zipUrl,
            url
        }
    },
}

//文件遍历方法
function compression(filePath, savePath, fileName, num) {
    //根据文件路径读取文件，返回文件列表
    let zipPath = "public/" + savePath + "/" + "zip" + fileName  //压缩后保存的路径
    let number = num ? num : 150     //缩放的图片像素宽度
    images(filePath)                 //Load image from file 
        //加载图像文件
        .size(number)                          //Geometric scaling the image to 400 pixels width
        //等比缩放图像到150像素宽

        .save(zipPath, {               //Save the image to a file, with the quality of 50
            quality: 100                    //保存图片到文件,图片质量为100
        });
    return basePath + savePath + "/" + "zip" + fileName  //压缩后保存的路径
}