'use strict';

const port = 3000;

const express = require('express');
const app = express();
const path = require('path');
const logger = require('morgan');
const { appendFile } = require('fs');
const { throws } = require('assert');

const server = app.listen(port, () => {
  console.log(`Express Server Listening at ${port}`);
});

const io = require('socket.io')(server);

app.use(express.urlencoded({ extended: true }));

// 뷰 엔진 설정
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// logger 설정
app.use(logger('dev'));

// 정적 위치 지정
app.use(express.static(path.join(__dirname, 'public')));

/////////////// 라우팅 /////////////////
app.get('/', (req, res) => {
  res.render('main');
});

app.get('/room_create', (req, res) => {
  res.render('room_create');
});

app.get('/room_before_join', (req, res) => {
  res.render('room_before_join');
});

app.get('/room_join', (req, res) => {
  res.render('room_join');
})
////////////////////////////////////////

const room_max_size = 3;
let rooms = io.sockets.adapter.rooms;

/////////////// 소켓 ///////////////////
io.on('connection', (socket) => {
  console.log(`클라이언트가 연결되었습니다. Socket ID : ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`클라이언트의 연결이 종료되었습니다. Socket ID : ${socket.id}`);
  });

  socket.on('error', (error) => {
    console.error(error);
  });

  // 방 만들기 요청 핸들러
  socket.on('create_room', (data) => {
    
    // 생성된 방 번호를 저장할 변수
    let room_id = generateRoomCode();

    // 해당 room code에 참가
    socket.join(room_id);
    console.log(`${room_id}번 방을 생성했습니다.`);
    console.log('현재 만들어진 방: \n', rooms);

    // 현재 참가자 불러옴
    let joinedPlayer = rooms.get(room_id).size;

    // 만들어진 방의 정보 전송
    socket.emit('room_info', {
      room_id: room_id,
      joinedPlayer: joinedPlayer,
      maxPlayer: room_max_size,
    });
  });

  // 방이 있는지 체크
  socket.on('check_room', (data) => {
    let user_id = data.user_id;
    let room_id = data.room_id;

    if (!rooms.get(room_id)){
      socket.emit('no_room');
    } else {
      socket.emit('is_room')
    }
  });

    // 방에 참여
    socket.on('join_room', (data) => {
      let user_id = data.user_id;
      let room_id = data.room_id;
      let room_joiner_size = rooms.get(room_id).size;

      // 방이 가득 찼으면, 게임 시작
      if(room_joiner_size === room_max_size){
        io.to(room_id).emit('game_start');
      }
      // 방이 가득 차지 않았다면, 대기자 더 모음
      else {
        socket.join(room_id);

        room_joiner_size = rooms.get(room_id).size;
        let room_max_size = room_max_size;
  
        let dataToSend = {
          room_joiner_size : room_joiner_size,
          room_max_size : room_max_size
        }
  
        // 방에 참여한 모두에게 정보 전달
        io.to(room_id).emit('join_success', dataToSend);
      }
    });
});

function generateRoomCode() {
  // rooms에 없는 숫자 찾기
  while (true) {
    let room_id = '';
    for (let i = 0; i < 4; i++) {
      room_id += Math.floor(Math.random() * 10);
    }
    if (!rooms.get(room_id)) {
      console.log('중복되지 않는 방 번호 :', room_id);
      return room_id;
    }
  }
}