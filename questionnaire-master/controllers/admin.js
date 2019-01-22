var path = require('path');
var CryptoJS = require("crypto-js");
var Admin = require('../models/admin');

exports.homePage = function (req, res) {
    Admin.count({}).exec(function (err, count) {
        res.redirect('/manage/login');
    })
};

exports.loginPage = function (req, res) {
    Admin.count({}).exec(function (err, count) {
        if (count == 0) {
            var password = CryptoJS.MD5('123456').toString();
            new Admin({
                username: 'admin',
                password: password
            }).save(function (err) {
                res.sendFile(path.join(__dirname, '../view/manage/login.html'));
            });
        } else {
            res.sendFile(path.join(__dirname, '../view/manage/login.html'));
        }
    })
};

exports.login = function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    Admin.findOne({username: username})
        .exec(function (err, user) {
            if (user && user.password == CryptoJS.MD5(password).toString()) {
                req.session.user = username;
                return res.redirect('/manage');
            }
            res.send('用户名或密码错误');
        });
};


var url=require("url");
exports.loginURL = function (req, res) {
    var reqObject=url.parse(req.url,true).query;

    var username = reqObject.username;
    // console.log('username:' + username);
    //转义，url传递过来的特殊符号无法转换
    var password = reqObject.password.replace(' ','+');
    Admin.findOne({username: username})
        .exec(function (err, user) {
            //两端系统用的MD5加密，mongodb直接用mysql的数据
            //CryptoJS.MD5(password).toString()
            if (user && user.password == password) {
                req.session.user = username;
                return res.redirect('/manage');
            }
            res.send('用户名或密码错误');
        });
};

var url = require("url");
exports.add = function (req, res) {
    var reqObject = url.parse(req.url, true).query;
    var username=reqObject.username;
    //转义，因为url传递的特俗字符无法转换
    var passowrd = reqObject.password.replace(' ','+');

    var admin = new Admin();
    admin.username=username;
    admin.password=passowrd;
    admin.save(function (err) {
        if (err) {
            return res.json({
                success: false,
                error: err.message
            });
        }
        res.json({
            success: true
        });
    });
};

var url = require("url");
exports.delete = function (req, res) {
    var reqObject = url.parse(req.url, true).query;
    //根据账号（即邮箱）删除
    var condition={'username':reqObject.username};

    Admin.remove(condition, function (err, admin) {
        if (err) {
            return res.json({
                success:false,
                error:err.message
            });
        }
        if(!res){
            return res.json({
                success:false,
                error:'Admin not found'
            });
        }
        res.json({
            success:true
        });
    });
};

//根据邮箱更新密码
var url = require("url");
exports.update=function (req,res){
    var reqObject=url.parse(req.url,true).query;
    var password = reqObject.password.replace(' ', '+');
    //根据邮箱更新密码
    var condition={'username': reqObject.username};
    var updateValue={'password': password};
    Admin.update(condition, updateValue, function (err) {
        if(err){
            return res.json({
                success:false,
                error:err.message
            });
        }
        res.json({
            success:true
        });
    });
};


exports.logout = function (req, res) {
    delete req.session.user;
    res.redirect('/manage/login');
};

exports.loginRequired = function (req, res, next) {
    if (!req.session.user) {
        return res.redirect('/manage/login');
    }
    next();
};
