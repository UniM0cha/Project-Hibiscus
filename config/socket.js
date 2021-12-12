module.exports = function (server) {
  const io = require('socket.io')(server);

  // 방 최대 참여자 수
  const max_player = 3;
  let rooms = io.sockets.adapter.rooms;

  // 소켓이 연결 되면
  io.on('connection', (socket) => {
    console.log(`클라이언트가 연결되었습니다. Socket ID : ${socket.id}`);

    // 일반 소켓 연결해제
    socket.on('disconnect', () => {
      console.log(`클라이언트의 연결이 종료되었습니다. Socket ID : ${socket.id}`);
    });
    // 소켓 에러
    socket.on('error', (error) => {
      console.error(error);
    });

    socket.on('client_info', (data) => {
      let roomModel = new RoomModel(data.user_id, data.room_id, null, max_player);

      // 방 만들기 요청 핸들러
      socket.on('create_room', () => {
        console.log(`방 만들기 요청`);
        createRoom(io, socket, rooms, roomModel);
      });

      // 방에 참여 시도
      socket.on('join_room', () => {
        console.log(`${roomModel.room_id}번 방에 접속 요청`);
        joinRoom(io, socket, rooms, roomModel);
      });

      socket.on('ready_pressed', () => {
        console.log('준비 버튼 클릭함');
        readyPressed(io, socket, rooms, roomModel);
      });

      // 게임관련 이벤트들 정의
      socket.on('game_failed', (reason) => {
        if(reason === 'over_speed'){
          overSpeed();
        }
        else if (reason === 'captured'){
          captured();
        }
        else if (reason === 'mouse_up') {
          mouseUp();
        }
      });

      socket.on('finish', () => {
        finish(io, socket, rooms, roomModel);
      });
    });
  });
};

function RoomModel(user_id, room_id, joined_player, max_player) {
  this.user_id = user_id;
  this.room_id = room_id;
  this.joined_player = joined_player;
  this.max_player = max_player;
}

function createRoom(io, socket, rooms, roomModel) {
  // 생성된 방 번호를 저장할 변수
  let room_id = generateRoomCode(rooms);

  // 해당 room code에 참가
  socket.join(room_id);
  console.log(`${room_id}번 방을 생성했습니다.`);
  console.log('현재 만들어진 방: \n', rooms);

  // roomModel 매핑
  roomModel.room_id = room_id;
  roomModel.joined_player = rooms.get(room_id).size;

  // 각 방 객체에 user_id 배열 추가, 방장 user_id 추가
  rooms.get(room_id).user_id = [];
  rooms.get(room_id).user_id.push(roomModel.user_id);
  console.log(rooms.get(room_id));

  // 조인 성공 이벤트 전송
  socket.emit('join_success', roomModel);

  // 방을 나간다면
  socket.on('disconnect', () => {
    roomLeave(io, socket, rooms, roomModel);
  });
}

function generateRoomCode(rooms) {
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

function joinRoom(io, socket, rooms, roomModel) {
  // 방이 있다면
  if (rooms.get(roomModel.room_id)) {
    roomModel.joined_player = rooms.get(roomModel.room_id).size;

    // 방이 가득 찼으면, 진입 불가
    if (roomModel.joined_player === roomModel.max_player) {
      console.log('해당 방이 가득 참');
      socket.emit('join_full');
    } else {
      // 방에 자리 있으면

      socket.join(roomModel.room_id);
      console.log('방에 접속 성공');
      roomModel.joined_player = rooms.get(roomModel.room_id).size;

      // 각 방 user_id에 user_id 추가
      rooms.get(roomModel.room_id).user_id.push(roomModel.user_id);
      console.log(rooms.get(roomModel.room_id));

      // 방에 있는 모두에게 나 왔다고 알린다
      io.to(roomModel.room_id).emit('join_success', roomModel);

      // 방이 가득 찼으면, 게임 준비
      if (roomModel.joined_player === roomModel.max_player) {
        console.log('모든 참여자 들어옴');
        io.to(roomModel.room_id).emit('ready_game');
        rooms.get(roomModel.room_id).ready = 0;
        console.log(rooms);
      }

      // 방을 나간다면
      socket.on('disconnect', () => {
        roomLeave(io, socket, rooms, roomModel);
      });
    }
  } else {
    // 방이 없다면
    socket.emit('join_noroom');
  }
}

function roomLeave(io, socket, rooms, roomModel) {
  console.log(`${roomModel.user_id}님이 방을 나갔습니다.`);
  socket.leave(roomModel.room_id);

  // 방이 존재한다면
  if (rooms.get(roomModel.room_id)) {
    roomModel.joined_player = rooms.get(roomModel.room_id).size;
    // 방에 있는 모두에게 나 나간다고 알린다
    io.to(roomModel.room_id).emit('leave_room', roomModel);
  }
}

function readyPressed(io, socket, rooms, roomModel) {
  rooms.get(roomModel.room_id).ready++;
  console.log(rooms);
  if (rooms.get(roomModel.room_id).ready === roomModel.max_player) {
    console.log(`${roomModel.room_id}번 방 : 모두 준비가 완료되었습니다. 3초 후 게임을 시작합니다.`);

    let timer = 3;
    let timerId = setInterval(() => {
      io.to(roomModel.room_id).emit('count_down', timer);
      console.log(`${roomModel.room_id}번 방 : ${timer}초 후에 시작...`);
      timer--;
      if (timer === -1) {
        // 게임 시작
        clearInterval(timerId);

        let socket_ids = Array.from(rooms.get(roomModel.room_id));
        let user_ids = rooms.get(roomModel.room_id).user_id;
        console.log(socket_ids);
        console.log(user_ids);

        let data = {
          socket_ids: socket_ids,
          user_ids: user_ids,
        }

        io.to(roomModel.room_id).emit('start_game', data);
        
        startGameTimer(io, socket, rooms, roomModel);
        startHibiscus(io, socket, rooms, roomModel);
      }
    }, 1000);
  }
}

function startGameTimer(io, socket, rooms, roomModel) {
  const timerSeconds = 60 * 3; // 게임 시간 설정 : 3분

  let timer = timerSeconds;

  let timerId = setInterval(() => {
    if (rooms.get(roomModel.room_id)) {
      io.to(roomModel.room_id).emit('game_timer', timer);
      console.log(`${roomModel.room_id}번 방 : 게임시간 ${timer}초 남음`);
      timer--;
      if (timer === -1) {
        clearInterval(timerId);
        // 여기다 타이머 끝나면 할 작동 기술
      }
    } else {
      // 방이 사라질 경우 타이머 삭제해야함
      console.log(`${roomModel.room_id}번 방이 사라졌습니다. 타이머를 종료합니다.`);
      clearInterval(timerId);
    }
  }, 1000);
}

function startHibiscus(io, socket, rooms, roomModel) {
  let text = ['무', '궁', '화', ' ', '꽃', '이', ' ', '피', '었', '습', '니', '다'];
  timeout(text, 0);

  function timeout(text, i) {
    // 문자열 출력은 80ms ~ 500ms
    let randTime = Math.floor(Math.random() * 421) + 80;

    setTimeout(() => {
      io.to(roomModel.room_id).emit('hibiscus_text', text[i]);
      i++;

      if (i === text.length) {
        io.to(roomModel.room_id).emit('hibiscus_watch');
        stopHibiscus(io, socket, rooms, roomModel);
        return;
      }

      timeout(text, i);
    }, randTime);
  }
}

function stopHibiscus(io, socket, rooms, roomModel) {
  // 술래가 보는 시간 1000ms ~ 3000ms
  let randTime = Math.floor(Math.random() * 5001) + 1000;
  setTimeout(() => {
    io.to(roomModel.room_id).emit('hibiscus_restart');
    startHibiscus(io, socket, rooms, roomModel);
  }, randTime);
}

function overSpeed() {
  console.log('과속했습니다!');
}

function captured() {
  console.log('술래에게 잡혔습니다!');
}

function mouseUp() {
  console.log('마우스에서 손을 뗐습니다!');
}

function finish(io, socket, rooms, roomModel) {
  console.log(`${roomModel.room_id}번 방 : ${roomModel.user_id}님이 결승선을 통과했습니다!`);
}