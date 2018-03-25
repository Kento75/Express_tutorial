var mongoose = require('mongoose');

// Messageスキーマ設定
var Message = mongoose.Schema({
  username: String,
  message: String,
  date: {type: Date, default: new Date()},
  avatar_path: String,
  image_path: String
});

module.exports = mongoose.model('Message', Message);
