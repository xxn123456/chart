const { login } = require("../controllers/c_login")
module.exports = {
    // 登陆
    "POST /login": async ctx => {
        let res = await login(ctx.request.body)
        ctx.body = res
    }
}