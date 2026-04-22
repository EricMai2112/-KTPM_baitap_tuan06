const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  genre: String,
  duration: Number,
  price: Number,
  description: String
});

module.exports = mongoose.model('Movie', movieSchema);