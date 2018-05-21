var request = require('request');
var crypto = require('crypto');
var _ = require('lodash');
var pool = require('../lib/mysql');
var config = require('../config/config').getInstance().config;

//md5加密
var md5 = function (text) {
    return crypto.createHash('md5').update(text).digest('hex');
};
//加密
var encrypt = function (text) {
    return md5(md5(text));
};
// 格式2位数字
var format = function (param) {
    return (parseInt(param) < 10) ? '0' + param : param;
};

//设置左则菜单栏选中栏目
var setMenus = function (menusArr, sysname, module, subMenuName) {
    let menus = [];
    if (menusArr.length > 0) {
        menus = _.cloneDeep(menusArr);
        for (let i = 0; i < menus.length; i++) {
            let obj = menus[i];
            if (obj.sys === sysname) {
                obj.selected = true;
                if (obj.menus && obj.menus.length != 0) {
                    for (let a = 0; a < obj.menus.length; a++) {
                        //let temp = obj.menus[a];
                        if (obj.menus[a].module === module) {
                            obj.menus[a].selected = true;
                        }
                        if (obj.menus[a].menus && obj.menus[a].menus.length != 0) {
                            for (let j = 0; j < obj.menus[a].menus.length; j++) {
                                //let item = temp.menus[j];
                                if (obj.menus[a].menus[j].name === subMenuName) {
                                    obj.menus[a].menus[j].selected = true;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            if (obj.selected) {
                break;
            }
        }
    }

    return menus;
};

//执行sql语句 param:{sql:'',option:''}
var execSql = function (db, param, cb) {
    let mysqlService = config.db[db];
    if (!mysqlService) {
        console.log('config.js没有配置数据库名与服务器对应关系');
        return cb(new Error('config.js没有配置数据库名与服务器对应关系'));
    }
    let poolSer = pool[mysqlService];
    if (!poolSer) {
        console.log('mysql.js没有导出连接池');
        return cb(new Error('mysql.js没有导出连接池'));
    }
    poolSer.getConnection(function (err, connection) {
        if (err) {
            return cb(err);
        }
        if (param.option) {
            connection.query(param.sql, param.option, function (err, row) {
                connection.release();
                cb(err, row);
            });
        } else {
            connection.query(param.sql, function (err, row) {
                connection.release();
                cb(err, row);
            });
        }
    });
};

// 注意，菜单名字不能相同
var formatMenu = function (dataArr, systems) {
    var platArr = [];
    for (let m = 0; m < dataArr.length; m++) {
        let platObj = dataArr[m];
        let menuArr = [];
        let menuData = platObj.menus;
        var sysName, name;
        systems.forEach(function (system) {
            if (system.platform == platObj.platform) {
                sysName = system.sysName;
                name = system.name;
                if (system.name == 'billing') {
                    sysName = '业务中心';
                }
            }
        });

        if ((menuData.length == 1) && (menuData[0].name == sysName) && (menuData[0].name == menuData[0].module)) { //一级菜单
            platArr.push({
                selected: false,
                sys: sysName,
                name: name,
                module: [],
                icon: platObj.icon,
                url: menuData[0].url,
            });
        } else {
            for (let i = 0; i < menuData.length; i++) {
                let obj = menuData[i];
                //检测是否已经存在此模块
                let existModule = false;
                if (obj.name == obj.module) { //两级菜单
                    menuArr.push({
                        selected: false,
                        sys: sysName,
                        name: name,
                        module: obj.module,
                        icon: platObj.icon,
                        url: obj.url
                    });
                } else { //三级
                    for (let j = 0; j < menuArr.length; j++) {
                        if (menuArr[j].module === obj.module) {
                            existModule = true;
                            menuArr[j].menus.push({
                                url: obj.url,
                                selected: false,
                                name: obj.name

                            });
                            break;
                        }
                    }
                    if (!existModule) {
                        menuArr.push({
                            selected: false,
                            module: obj.module,
                            icon: obj.icon,
                            menus: [{
                                url: obj.url,
                                selected: false,
                                name: obj.name

                            }]
                        });
                    }
                }

            }
            platArr.push({
                selected: false,
                sys: sysName,
                name: name,
                module: [],
                icon: platObj.icon,
                menus: menuArr
            });
        }
    }
    return platArr;
};
// 秒转时间
var second2Time = function (second) {
    let s = parseInt(second);
    let t = '00:00:00';
    if (s > 0) {
        let hour = parseInt(s / 3600);
        let min = parseInt(s / 60) % 60;
        let sec = s % 60;
        t = '' + format(hour) + ':' + format(min) + ':' + format(sec);
    }
    return t;
};

//获取公司信息
var getCompanyByCompanyId = function (companyId, companys) {
    if (companys.length > 0) {
        for (var i = 0; i < companys.length; i++) {
            if (companyId == companys[i].id) {
                return companys[i];
            }
        }
        return false;
    } else {
        return false;
    }
};
//获取公司列表去重之后的城市
var getUniqCityArr = function (companys) {
    if (companys.length > 0) {
        let res = [],
            json = {};
        for (var i = 0; i < companys.length; i++) {
            if (!json[companys[i].city]) {
                res.push({city: companys[i].city, city_code: companys[i].city_code});
                json[companys[i].city] = 1;
            }
        }
        return res;
    } else {
        return [];
    }
};
//当公司是骑骑智享时，用来模糊查询所有的公司
var getCompanyFuzzyId = function (company_id) {
    if (company_id == '101030000') {
        company_id = '1';
    }
    return company_id + '%';
};

//判断公司状态
var judgeCompanyStatus = function (cstatus, estatus) {
    let judge_status = [];
    if (cstatus.length > 0 && estatus.length > 0) {
        if (cstatus[0].status === 1) {
            judge_status.push('筹备中', 1);
        } else if (cstatus[0].status === 2) {
            if (estatus[0].status === 1) {
                if (estatus[0].begintime > new Date()) {
                    judge_status.push('筹备中', 1);
                } else {
                    judge_status.push('运营中', 2);
                }
            } else if (estatus[0].status === 2) {
                judge_status.push('运营中', 2);
            } else {
                if (estatus[0].begintime > new Date()) {
                    judge_status.push('整顿中', 3);
                } else {
                    judge_status.push('运营中', 2);
                }
            }
        } else if (cstatus[0].status === 3) {
            if (estatus[0].endtime) {
                if (estatus[0].endtime > new Date()) {
                    judge_status.push('整顿中', 3);
                } else {
                    judge_status.push('运营中', 2);
                }
            } else {
                judge_status.push('整顿中', 3);
            }
        } else if (cstatus[0].status === 4) {
            judge_status.push('已关闭', 4);
        } else {
            judge_status.push('公司状态异常', 4);
        }
    } else {
        judge_status.push('筹备中', 1);
    }
    return judge_status;
};

//获取最后四位，加1，返回四位字符串
var getMaxMemberId = function (memberMaxId) {
    let numStr = '';
    let num = (parseInt(memberMaxId.substr(memberMaxId.length - 4)) + 1).toString();
    if (num.length == 1) {
        numStr = '000' + num;
    } else if (num.length == 2) {
        numStr = '00' + num;
    } else if (num.length == 3) {
        numStr = '0' + num;
    } else if (num.length == 4) {
        numStr = num;
    }
    return numStr;
};

//request 发送车务后台 param  {type:'', mobile:'', name:'',company_code:'',admin_id:''}
var sendBikeService = function (param, cb) {
    request.get({url: config.bikeServiceInter + '?type=' + encodeURIComponent(param.type) + '&mobile=' + encodeURIComponent(param.mobile) + '&name=' + encodeURIComponent(encodeURIComponent(param.name)) + '&company_code=' + encodeURIComponent(param.company_code) + '&admin_id=' + encodeURIComponent(param.admin_id)}, function (error, response, body) {
        if (error) {
            return cb(error);
        }
        if (response && response.statusCode == 200) {
            try {
                let obj = JSON.parse(body);
                if (obj.code == 200) {
                    cb();
                } else {
                    cb(obj.code + ',' + obj.msg);
                }
            } catch (e) {
                cb(e);
            }
        } else {
            cb(response && response.statusCode);
        }
    });
};

//request 发送用户后台 更新 param  { mobile:'', userType:''}
var sendUserServiceUpdate = function (param, cb) {
    request.get({url: config.userServiceInterUpdate + '?mobile=' + encodeURIComponent(param.mobile) + '&userType=' + encodeURIComponent(param.userType)}, function (error, response, body) {
        if (error) {
            return cb(error);
        }
        if (response && response.statusCode == 200) {
            try {
                let obj = JSON.parse(body);
                if (obj.code == 200) {
                    cb(null, obj.data);
                } else {
                    cb(obj.code + ',' + obj.msg);
                }
            } catch (e) {
                cb(e);
            }
        } else {
            cb(response && response.statusCode);
        }
    });
};

//request 发送用户后台 删除 param  { mobile:''}
var sendUserServiceDel = function (param, cb) {
    request.get({url: config.userServiceInterDel + '?mobile=' + encodeURIComponent(param.mobile)}, function (error, response, body) {
        if (error) {
            return cb(error);
        }
        if (response && response.statusCode == 200) {
            try {
                let obj = JSON.parse(body);
                if (obj.code == 200) {
                    cb();
                } else {
                    cb(obj.code + ',' + obj.msg);
                }
            } catch (e) {
                cb(e);
            }
        } else {
            cb(response && response.statusCode);
        }
    });
};

//request 获取机构信息
var getOrgById = function (id, cb) {
    request.get({url: config.getOrgByIdUrl + encodeURIComponent(id)}, function (error, response, body) {
        if (error) {
            return cb(error);
        }
        if (response && response.statusCode === 200) {
            try {
                let obj = JSON.parse(body);
                if (obj.code === 200) {
                    cb(null, obj.data);
                } else {
                    cb(obj.code + ',' + obj.msg);
                }
            } catch (e) {
                cb(e);
            }
        } else {
            cb(response && response.statusCode);
        }
    });
};

var login = function (params, cb) {
    request.get({url: config.getLoginURL + encodeURIComponent(params.username) + '/' + encodeURIComponent(params.password)}, function (error, response, body) {
        if (error) {
            return cb(error);
        }
        if (response && response.statusCode === 200) {
            try {
                let obj = JSON.parse(body);
                if (obj.code === 200) {
                    cb(null, obj.data);
                } else {
                    cb(obj.code + ',' + obj.msg);
                }
            } catch (e) {
                cb(e);
            }
        } else {
            cb(response && response.statusCode);
        }
    });
};

// post请求 参数data是对象，返回body对象
let postRequest = function (url, data, cb) {
    request({
        method: 'post',
        url: url,
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify(data)
    }, function (error, response, body) {
        if (error) {
            return cb(error);
        }
        //console.log(response)
        if (response && response.statusCode == 200) {
            try {
                let obj = JSON.parse(body);

                if (obj.code == 200) {
                    cb(null, obj);
                } else {
                    cb(obj.code + ',' + obj.msg);
                }
            } catch (e) {
                cb(e);
            }
        } else {
            cb(response && response.statusCode);
        }
    });
};
//获取poolSer 连接池
let getPoolSer = function (db, cb) {
    let mysqlService = config.db[db];
    if (!mysqlService) {
        return cb(new Error('config.js没有配置数据库名与服务器对应关系'));
    }
    let poolSer = pool[mysqlService];
    if (!poolSer) {
        return cb(new Error('mysql.js没有导出连接池'));
    } else {
        return cb(null, poolSer);
    }
};

// 参数data是对象key:value，返回body对象
let getRequest = function (url, cb) {
    request.get(url, function (error, response, body) {
        if (error) {
            return cb(error);
        }
        if (response && response.statusCode == 200) {
            try {
                let obj = JSON.parse(body);
                if (obj.code == 200 || obj.code == 204) {
                    cb(null, obj);
                } else {
                    cb(obj.code + ',' + obj.msg);
                }
            } catch (e) {
                cb(e);
            }
        } else {
            cb(response);
        }
    });
};

//导出
module.exports = {
    format: format,
    setMenus: setMenus,
    formatMenu: formatMenu,
    second2Time: second2Time,
    execSql: execSql,
    getPoolSer: getPoolSer,
    postRequest: postRequest,
    login: login,
    getOrgById: getOrgById,
    getRequest: getRequest
};
