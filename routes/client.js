/**
 * Created by zhaianan on 2017/12/21.
 */
const express = require('express');
const router = express.Router();
const Cont = require('../controllers/RecommendController');

//列表
router.get('/list',function (req,res) {
    new Cont(req).list(req, res);
});
//获取
router.get('/id/:id',function (req,res) {
    new Cont(req).getOrgById(req, res);
});
//机构名字模糊查询
router.get('/name/:name',function (req,res) {
    new Cont(req).getOrgByName(req, res);
});

//机构的合作方
router.get('/partner/:orgId',function (req,res) {
    new Cont(req).getPartnerByOrgId(req, res);
});

//检查
router.get('/checkId/:id',function (req,res) {
    new Cont(req).checkId(req, res);
});
//添加
router.post('/add',function (req,res) {
    new Cont(req).add(req, res);
});

//编辑
router.post('/edit',function (req,res) {
    new Cont(req).edit(req, res);
});

//删除
router.get('/del/:id',function (req,res) {
    new Cont(req).del(req, res);
});

module.exports = router;
