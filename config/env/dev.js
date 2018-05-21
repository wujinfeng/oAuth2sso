/**
 * 开发环境配置信息
 */
const FdfsClient = require('fdfs');

module.exports = {
    port: 3001,
    debug: true,
    mysql: {
        host: '219.142.131.131',
        user: 'zxbike',
        port: 3306,
        password: 'Zxbike2017.com',
        database: '',
    },
    redis: {
        host: '192.168.1.117',
        db: 5,
        port: 6379,
        passwd: '123'
    },
    agent: 'market',
    db: {
        'market': 'mysql'
    },
    sysName: '营销管理',
    platformName: 'market',

    fdfs : new FdfsClient({    // 文件上传配置
        trackers: [
            {
                host: 'imgupload.zxbike.top',
                port: 22122
            }
        ],
        timeout: 30000,    // 默认超时时间10s
        charset: 'utf8'  // charset默认utf8
    }),
    imgUrl:'http://img.zxbike.top/',

    // --------单点登录相关配置--------
    domain: '.zxbike.top',               // cookie的主域名
    sso: 'http://sso.oms.zxbike.top',    // sso地址
    systemName: '营销管理',
    systemCode: 'marketing',             	 // 系统编码
    // ------------------------------

    host: 'http://mk.oms.zxbike.top'  // 本网站域名

};