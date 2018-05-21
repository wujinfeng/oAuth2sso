/**
 * 商品信息
 */

const BaseModel = require('./BaseModel');
const mysql = require('mysql');

class Model extends BaseModel {

    list(params, page, pageSize, cb) {
        let con = '';
        let self = this;
        if (params.name) {
            con = ` where b.name like ${mysql.escape('%' + params.name + '%')} `;
        }
        let sql = `select id,goodsId,name,gender,status,DATE_FORMAT(ctime, "%Y-%m-%d %H:%i") as time from ${self.agent}recommend as b ${con} order by b.ctime desc limit ?,?`;
        let execParam = self.getExecParamByOption(sql, [(page - 1) * pageSize, pageSize]);
        self.execSql(execParam, function (err, rows) {
            console.log(rows);
            if (err) {
                return cb(err);
            }
            let countSql = `select count(*) as count from ${self.agent}recommend as b ${con}`;
            let execParam2 = self.getExecParamByOption(countSql, '');
            self.execSql(execParam2, (err, count) => {
                if (err) {
                    return cb(err);
                }
                cb(err, rows, count[0].count);
            });
        });
    }



    getPartnerByOrgId(orgId, cb){
        let self = this;
        let sql = `SELECT cp.role_type,cp.partner_id,p.name from ${self.agent}recommend_partner cp LEFT JOIN ${self.agent}p_partner p ON cp.partner_id=p.id WHERE cp.company_id=?`;
        let execParam = self.getExecParamByOption(sql, orgId);
        self.execSql(execParam, cb);
    }


    add(params, cb) {
        let self = this;
        let sql = `insert into ${self.agent}recommend set ?`;
        let execParam = self.getExecParamByOption(sql, params);
        self.execSql(execParam, cb);
    }
}

module.exports = Model;
