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

var url=require("url");
exports.login = function (req, res) {
    var username = url.parse(req.url,true).query.username;
    var password = url.parse(req.url,true).query.password;

    Admin.findOne({username: username})
        .exec(function (err, user) {
            if (user && user.password == CryptoJS.MD5(password).toString()) {
                req.session.user = username;
                return res.redirect('/manage');
            }
            res.send('用户名或密码错误');
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
