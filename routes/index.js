var express = require('express');
var router = express.Router();

router.get('/', (req, res) => {
  res.render('index');
});

router.get('/:mode', (req, res) => {
  let mode = req.params.mode;
  if (mode === 'main') {
    res.render('main');
  }
  else if (mode === 'create_room') {
    res.render('game', { mode: 'create_room' });
  }
  
  else if (mode === 'join_room') {
    res.render('game', { mode: 'join_room' });
  }
});

router.post('/result', (req, res) => {
  let output = JSON.parse(req.body.output);
  res.render('result', {
    finished: output.finished,
    failed: output.failed,
  })
})

module.exports = router;
