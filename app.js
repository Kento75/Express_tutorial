"use strict";

var http = require('http');
var express = require('express');
<<<<<<< HEAD
var path = require('path');
var bodyparser = require('body-parser');
var mongoose = require('mongoose');

var Message = require('./schema/Message');
=======
>>>>>>> 9905927ba8ffd783ce16c21abf2fbeb4fdc68516

var app = express();

mongoose.connect('mongodb://localhost:27017/chatapp', function(err) {
  if(err) {
    console.error(err);
  } else {
    console.log("successfully connected to MongoDB.");
  }
});

app.use(bodyparser());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


app.get("/", function(req, res, next) {
  return res.render('index', {title: 'Hello World'});
});

app.get("/update", function(req, res, next){
  return res.render('update');
});

app.post("/update", function(req, res, next) {
  var newMessage = new Message({
    username: req.body.username,
    message: req.body.message
  });

  newMessage.save((err)=>{
    if(err) throw err;
    return res.redirect("/");
  });
});

var server = http.createServer(app);
server.listen('3000');
