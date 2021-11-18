const express = require('express')
const app = express()
const port = 3000
const path = require('path');
const logger = require('morgan');
const createError = require('http-errors');

// 뷰 엔진 설정
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// logger 설정
app.use(logger('dev'));

// 정적 위치 지정
app.use(express.static(path.join(__dirname, 'public')));

// 라우팅 지정
const indexRouter = require('./routes/index');
app.use('/', indexRouter);
app.use(function(req, res, next) {
  next(createError(404)); // 404
});

const server = app.listen(port, () => {
  console.log(`Express Server Listening at ${port}`)
})

const webSocket = require('./socket');
webSocket(server);