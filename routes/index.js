const express = require('express');
const app = express.app();

const db_config = require('../config/database');
const conn = db_config.init();
db_config.connect(conn);

app.get('/', (req, res) => {
  res.render('index', { title: 'Express' });
});

app.get('/gameTest', (req, res) => {
  res.render('game_test');
});

app.get('/socketTest', (req, res) => {
  res.render('socket_test');
});

app.get('/main', (req, res) => {
  res.render('main_page_test');
});

app.get('/waiting', (req, res) => {
  res.render('waiting');
})

app.get('/enter', (req, res) => {
  res.render('enter');
})







module.exports = app;
