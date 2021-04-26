//引用发送邮件插件
var nodemailer = require('nodemailer');

//创建传输方式
var transporter = nodemailer.createTransport({
    service: 'qq',
    auth: {
        user: "2896583081@qq.com",
        pass: "uutlchlecobydhaf",
    }
});

//注册发送邮件给用户
exports.emailSignUp = email => {
    //发送信息内容
    let options = {
        from: '2896583081@qq.com',
        to: email,
        subject: '感谢您在yike注册',
        html: '<span>yike欢迎你的加入!</span><a href="http://localhost:8080/">点击</a>'
    };

    //发送邮件
    let res = transporter.sendMail(options, (err, msg) => {
        if (err) {
            return 0
        } else {
            return 1
        }
    })

    if (res) {
        return "邮件发送失败"
    } else {
        return "邮件已发送到邮箱，请注意查收"
    }

} 