var express = require('express');
var router = express.Router();

router.get('/', (req, res) => {
  res.render('main');
});

router.get('/room_create', (req, res) => {
  res.render('room_create');
});

router.get('/room_before_join', (req, res) => {
  res.render('room_before_join');
});

router.get('/room_join', (req, res) => {
  res.render('room_join');
})

module.exports = router;
