// 检测cookie
var checkLogin = function (req, res, next) {
    var cookie = req.session.info;
    if (cookie != '123456') {
        return res.redirect('login');
    } else {
        next();
    }
};

//导出函数
module.exports = {
    checkLogin: checkLogin
};