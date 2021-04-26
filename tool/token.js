const jwt = require("jsonwebtoken")
const { secret } = require("./commom")

// 生成token
exports.generateToken = (data) => {
    let payload = { id: data, time: new Date() }
    //此方法会生成一个token，第一个参数是数据，第二个参数是签名,第三个参数是token的过期时间可以不设置
    let token = jwt.sign(payload, secret, { expiresIn: 60 * 60 * 24 * 7 })
    return token;
}

// 解码token
exports.verifyToken = (token) => {
    let payload = jwt.verify(token, secret)
    return payload;
}