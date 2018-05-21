const auth = require('../lib/Auth').getInstance();
//const authUserRoute = require('./authUserRoute');
//路由主入口
module.exports = function (app) {

    app.use('/', (req, res, next) => {
        if (req.url.indexOf('/yx/app') > -1 ) {
            next()
        } else {
            auth.check(req, res, next);
        }
    });

    app.use('/yx/app', require('./userapp'));  // 用户app接口

    //app.use('/api/auth', authUserRoute);

    app.use('/api/client', require('./client'));


    // not found 404 page
    app.use(function (req, res, next) {
        if (!res.headersSent) {
            res.send({
                code: 500,
                msg: '无效的接口地址',
            });
        }
    });
};
