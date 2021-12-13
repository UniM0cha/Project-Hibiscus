var express = require('express');
var router = express.Router();

router.get('/', (req, res) => {
  res.render('index');
});

router.get('/main', (req, res) => {
  res.render('main');
});

router.get('/create_room', (req, res) => {
  res.render('game', { mode: 'create_room' });
});

router.get('/join_room', (req, res) => {
  res.render('game', { mode: 'join_room' });
});

router.post('/result', (req, res) => {
  let output = JSON.parse(req.body.output);
  res.render('result', {
    finished: output.finished,
    failed: output.failed,
  })
})

module.exports = router;
