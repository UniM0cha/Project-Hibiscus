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

module.exports = router;
