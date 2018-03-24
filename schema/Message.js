var mongoose = require('mongoose');

// Messageスキーマ設定
var Message = mongoose.Schema({
  username: String,
  message: String,
  date: {type: Date, default: new Date()},
  image_path: String
});

module.exports = mongoose.model('Message', Message);
