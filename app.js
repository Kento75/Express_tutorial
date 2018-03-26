"use strict";

var http = require('http');
var express = require('express');

var path = require('path');

// パーサーの設定
var bodyparser = require('body-parser');

// 認証モジュールの設定
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var session = require('express-session');

// ファイルアップロード設定
var fileUpload = require('express-fileupload');
var mongoose = require('mongoose');

// Messageスキーマの取得
var Message = require('./schema/Message');

// Userスキーマの取得
var User = require('./schema/User');

var app = express();

// twitter設定
var twitterConfig = {
//  consumerKey: process.env.TWITTER_CONSUMER_KEY,
//  consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
//  callbackURL: process.env.TWITTER_CALLBACK_URL,
};

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

passport.use(new TwitterStrategy(twitterConfig,
  function(token, tokenSecret, profile, done){
    User.findOne({ twitter_profile_id: profile.id }, function (err, user) {
      if (err) {
        return done(err);
      }else if (!user) {
        var _user = {
          username: profile.displayName,
          twitter_profile_id: profile.id,
          avatar_path: profile.photos[0].value
        };
        var newUser = new User(_user);
        newUser.save((err)=>{
          if(err) throw err
          return done(null, newUser);
        });
      }else{
        return done(null, user);
      }
    });
  }
));

app.get('/oauth/twitter', passport.authenticate('twitter'));
app.get('/oauth/twitter/callback', passport.authenticate('twitter'),
  function(req, res, next) {
    User.findOne({
      _id: req.session.passport.user
    }, function(err, user) {
      if(err || !req.session) return res.redirect('/oauth/twitter')
    })
  })

  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
    User.findOne({_id: id}, function(err, user) {
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
    var img = req.files.imege
    img.mv('./image/' + img.name, function(err) {
      if(err) throw err;

      var newMessage = new Message({
        username: req.session.username,
        avatar_path: req.session.user.avatar_path,
        message: req.body.message,
        image_path: '/image/' + img.name
      });
      newMessage.save((err) => {
        if(err) throw err;
        return res.redirect("/");
      });
    });
  } else {
    var newMessage = new Message({
      username: req.session.user.username,
      avatar_path: req.session.user.avatar_path,
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
