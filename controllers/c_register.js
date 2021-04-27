const User = require("../model/userModel")
const { encrypt } = require("../tool/crypto")
const { emailSignUp } = require("../tool/email")
exports.register = async (data) => {
    const result = await User.findOne({ email: data.email })
    if (result) {
        return {
            status: 0,
            msg: "该邮箱已经注册，请更换邮箱"
        }
    } else {
        let pwd = encrypt(data.pwd)
        let res = await User.create({
            name: data.name,
            email: data.email,
            pwd,
        })
        let log = emailSignUp(data.email)
        return {
            status: 1,
            msg: "邮箱注册成功," + log
        }
    }
}