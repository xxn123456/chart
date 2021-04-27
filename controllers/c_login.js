const User = require("../model/userModel")
const { decrypt } = require("../tool/crypto")
const { generateToken } = require("../tool/token")
exports.login = async data => {
    const result = await User.findOne({ email: data.email })
    if (result) {
        let pwd = decrypt(result.pwd)
        if (pwd == data.pwd) {
            // 生成token
            let token = generateToken(result._id)
            return {
                token,
                status: 1,
                msg: "登陆成功"
            }
        } else {
            return {
                status: 0,
                msg: "密码或者邮箱错误"
            }
        }
    } else {
        return {
            status: 0,
            msg: "该邮箱未注册"
        }
    }
}