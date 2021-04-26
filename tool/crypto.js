// 密码加密模块
let crypto = require('crypto');
let { iv, key } = require("./commom")
//加密
exports.encrypt = str => {
    var cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    var enc = cipher.update(str, 'utf8', 'hex');
    enc += cipher.final('hex');
    return enc;
}

//解密
exports.decrypt = str => {
    var decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    var dec = decipher.update(str, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
}