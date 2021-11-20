const express = require('express');
const router = express.Router();

const db_config = require('../config/database');
const conn = db_config.init();
db_config.connect(conn);

router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' });
});

router.get('/gameTest', (req, res, next) => {
  res.render('game_test');
});

router.get('/socketTest', (req, res, next) => {
  res.render('socket_test');
});

router.get('/main', (req, res, next) => {
  res.render('main_page_test');
});


let roomNumbers = [];

router.get('/waiting', (req, res, next) => {
  roomNumbers.push(generateRandomCode(4))
  roomNumbers.find




  res.render('waiting')
})









function generateRandomCode() {
  let str = ''
  for (let i = 0; i < 4; i++) {
    str += Math.floor(Math.random() * 10)
  }
  return str
}


module.exports = router;
