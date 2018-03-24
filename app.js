"use strict";

var http = require('http');
var express = require('express');

var path = require('path');

// パーサーの設定
var bodyparser = require('body-parser');

// 認証モジュールの設定
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');

// ファイルアップロード設定
var fileUpload = require('express-fileupload');
var mongoose = require('mongoose');

// Messageスキーマの取得
var Message = require('./schema/Message');

// Userスキーマの取得
var User = require('./schema/User');

var app = express();

// MongoDB接続
mongoose.connect('mongodb://localhost:27017/chatapp', function(err) {
  if(err) {
    console.error(err);
  } else {
    console.log("successfully connected to MongoDB.");
  }
});

// パーサーミドルウェアをExpressに追加
app.use(bodyparser());

// 認証用ミドルウェアをExpressに追加
app.use(session({secret: 'HogeFuga'}));
app.use(passport.initialize());
app.use(passport.session());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// 画像格納パスの設定
app.use("/image", express.static(path.join(__dirname, 'image')));

// ユーザーアバター用画像格納パスの設定
app.use("/avatar", express.static(path.join(__dirname, 'avatar')));

// 一覧画面遷移
app.get("/", function(req, res, next) {
  Message.find({}, function(err, msgs){
    if(err) throw err;
    return res.render('index', {
      messages: msgs,
      user: req.session && req.session.user ? req.session.user : null
    });
  });
});

// 会員登録画面遷移
app.get("/signin", function(req, res, next) {
  return res.render('signin');
});

// 会員登録処理
app.post("/signin", fileUpload(), function(req, res, next) {
  var avatar = req.files.avatar;
  avatar.mv("./avatar/" + avatar.name, function(err) {
    if(err) throw err;
    var newUser = new User({
      username: req.body.username,
      password: req.body.password,
      avatar_path: '/avatar/' + avatar.name
    });
    newUser.save((err) => {
      if(err) throw err;
      return res.redirect("/");
    });
  });
});

// ログイン画面遷移
app.get("/login", function(req, res, next) {
  return res.render('login');
});

// ログイン処理
app.post("/login", passport.authenticate('local'),
function(req, res, next) {
  User.findOne({_id: req.session.passport.user},
  function(err, user) {
    if(err || !req.session) return res.redirect('/login');
    req.session.user = {
      username: user.username,
      avatar_path: user.avatar_path
    }
    return res.redirect('/');
  });
});

passport.use(new LocalStrategy(function(username, password, done) {
  User.findOne({ username: username }, function(err, user) {
    if(err) { return done(err); }
    if(!user) {
      return done(null, false, { message: 'Incorrect username.' });
    }
    if(user.password !== password) {
      return done(null, false, { message: 'Incorrect password.' });
    }
    return done(null, user);
  });
}));

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findOne({ _id: id }, function(err, user) {
    done(err, user);
  });
});

// 登録画面遷移
app.get("/update", function(req, res, next) {
  return res.render('update');
});


// 登録処理・一覧画面遷移
app.post("/update", fileUpload(), function(req, res, next) {
  if(req.files && req.files.image) {
    req.files.image.mv('./image/' + req.files.image.name, function(err) {
      if(err) throw err;

      var newMessage = new Message({
        username: req.body.username,
        message: req.body.message,
        image_path: '/image/' + req.files.image.name
      });
      newMessage.save((err) => {
        if(err) throw err;
        return res.redirect("/");
      });
    });
  } else {
    var newMessage = new Message({
      username: req.body.username,
      message: req.body.message
    });
    newMessage.save((err) => {
      if(err) throw err;
      return res.redirect("/");
    });
  }
});

// サーバー起動
var server = http.createServer(app);
server.listen('3000');
