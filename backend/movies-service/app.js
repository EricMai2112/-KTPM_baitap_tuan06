const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Movie = require('./src/models/Movie');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Movie Service connected to DB"))
  .catch(err => console.error(err));

app.get('/movies', async (req, res) => {
  const movies = await Movie.find();
  res.json(movies);
});

app.post('/movies', async (req, res) => {
  const movie = new Movie(req.body);
  await movie.save();
  res.status(201).json(movie);
});

const PORT = 8082;
app.listen(PORT, () => {
  console.log(`Movie Service running on port ${PORT}`);
});