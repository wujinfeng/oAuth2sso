var config = require('../config/config').getInstance().config;
var logger = config.logger;
var mysql = require('mysql');
var poo1 = mysql.createPool({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database
});

//尝试连接是否成功
poo1.getConnection(function (err, connection) {
    if (err) {
        console.log('connect mysql err');
        console.log(err);
        logger.log(err);
        process.exit(1);
        return;
    }
    console.log('connect mysql ok.');
    connection.release();
});

module.exports = {
    'mysql':poo1
};
