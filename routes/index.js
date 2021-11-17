const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/gameTest', function(req, res, next) {
  res.render('game_test');
});

router.get('/socketTest', function(req, res, next) {
  res.render('socket_test');
});

module.exports = router;
