var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var postSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  date: {
    type: Date, 
    default: Date.now
  }
});

module.exports = mongoose.model('Post', postSchema);