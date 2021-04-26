const { register } = require("../controllers/c_register")
module.exports = {
    //POST 和 /category/list 中间是带空格的，方便进行字符串的截取
    // 注册
    'POST /register': async ctx => {
        let result = await register(ctx.request.body)
        ctx.body = result
    }
}