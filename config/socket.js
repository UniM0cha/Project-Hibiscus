module.exports = function (server) {
  const io = require('socket.io')(server);

  // 방 최대 참여자 수
  const max_player = 3;

  // 소켓이 연결 되면
  io.on('connection', (socket) => {
    console.log(`클라이언트가 연결되었습니다. Socket ID : ${socket.id}`);

    // 소켓 에러
    socket.on('error', (error) => {
      console.error(error);
    });

    // 방 관련 소켓 이벤트들
    socket.on('room', (data) => {
      console.log(data);

      let command = data.command;

      let user_id = data.user_info.user_id;
      let socket_id = socket.id;
      let user_info = UserInfo(user_id, socket_id);

      // create 요청
      if (command === 'create') {
        let room_id = generateRoomCode(io.sockets.adapter.rooms);
        socket.join(room_id);
        let joined_player = io.sockets.adapter.rooms.get(room_id).size;
        let room_info = RoomInfo(room_id, joined_player, max_player);

        let output = { command: 'success', user_info: user_info, room_info: room_info };
        io.to(room_id).emit('room_status', output);

        io.sockets.adapter.rooms.user_id = [];
        io.sockets.adapter.rooms.user_id.push(user_id);
        io.sockets.adapter.rooms.finished = [];
        io.sockets.adapter.rooms.failed = [];
        io.sockets.adapter.rooms.on_game = false;
        io.sockets.adapter.rooms.ready = 0;

        console.log('현재 방 상태 :');
        console.log(io.sockets.adapter.rooms);

        // 연결 해제
        socket.on('disconnect', () => {
          disconnect(io, user_info, room_info);
        });
      }

      // enter 요청
      else if (command === 'enter') {
        let user_info = data.user_info;
        socket.on('disconnect', () => {
          console.log(`${user_info.user_id}님이 접속을 종료했습니다.`);
        });
      }

      // join 요청
      else if (command === 'join') {
        let room_id = data.room_info.room_id;
        let room_info = RoomInfo(room_id, null, max_player);

        // 방이 존재하면
        if (io.sockets.adapter.rooms.get(room_id)) {
          let joined_player = io.sockets.adapter.rooms.get(room_id).size;

          // 방이 가득 찼으면
          if (joined_player === max_player) {
            socket.emit('room_status', { command: 'full' });
          }

          // 방에 자리가 있으면
          else {
            socket.join(room_id);
            joined_player = io.sockets.adapter.rooms.get(room_id).size;

            io.sockets.adapter.rooms.user_id.push(user_id);

            let room_info = RoomInfo(room_id, joined_player, max_player);
            let output = { command: 'success', user_info: user_info, room_info: room_info };
            io.to(room_id).emit('room_status', output);

            // 모든 참가자가 들어왔으면
            if (joined_player === max_player) {
              console.log(`${room_id}번 방 : 참가자 모두 들어옴`);
              let output = { command: 'all' };
              io.to(room_id).emit('room_status', output);
            }

            socket.on('disconnect', () => {
              disconnect(io, user_info, room_info);
            });
          }
        }

        // 방이 존재하지 않으면
        else {
          socket.emit('room_status', { command: 'no_room' });
        }
      }

      // ready 요청
      else if (command === 'ready') {
        io.sockets.adapter.rooms.get(room_id).ready++;

        // 모두 준비를 완료하면
        if (io.sockets.adapter.rooms.get(room_id).ready === max_player) {
          console.log(`${room_id}번 방 : 모두 준비가 완료되었습니다.`);
          console.log(`${room_id}번 방 : 3초 후 게임을 시작합니다.`);

          let time = 3;
          let game_start_timer = setInterval(() => {
            let output = {command: 'game_start_timer', time: time}
            io.to(room_id).emit('room_status', output);
            console.log(`${room_id}번 방 : ${time}초...`);
            time--;

            // 게임 시작
            if (time === -1) {
              clearInterval(game_start_timer);

              let socket_ids = Array.from(io.sockets.adapter.rooms.get(room_id));
              let user_ids = io.sockets.adapter.rooms.get(room_id).user_id;
              console.log('클라이언트에게 보낼 플레이어 정보');
              console.log(socket_ids);
              console.log(user_ids);

              let data = { command: 'start', socket_ids: socket_ids, user_ids: user_ids };
              io.to(room_id).emit('game', data);

              startGame();

              // 게임 시작하면 두가지 타이머 돌아감
              // 3분 게임시간을 잴 타이머 하나
              // 무궁화 꽃이 피었습니다를 보낼 타이머 하나

              // on_game도 true로 바꿔줘야함




              // startGameTimer(io, socket, rooms, roomModel);
              // startHibiscus(io, socket, rooms, roomModel);
            }
          }, 1000);
        }
      }
    });

    // 게임 관련 소켓 이벤트들
    socket.on('game', (data) => {

    })
  });
};

function UserInfo(user_id, socket_id) {
  let data = {
    user_id: user_id,
    socket_id: socket_id,
  };
  return data;
}

function RoomInfo(room_id, joined_player, max_player) {
  let data = {
    room_id: room_id,
    joined_player: joined_player,
    max_player: max_player,
  };
  return data;
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

function disconnect(io, user_info, room_info) {
  console.log(`${user_info.user_id}님이 접속을 종료했습니다.`);
  io.sockets.adapter.rooms.get(room_id).ready--;
  let output = { command: 'leave', user_info: user_info, room_info: room_info };
  io.to(room_info.room_id).emit('room_status', output);
}

let timer_game = null;
let timer_hibiscus = null;

function startGame() {
  io.sockets.adapter.rooms.get(room_id).on_game = true;
}

/*



function roomLeave(io, socket, rooms, roomModel) {
  console.log(`${roomModel.user_id}님이 방을 나갔습니다.`);
  socket.leave(roomModel.room_id);

  // 방이 존재한다면
  if (rooms.get(roomModel.room_id)) {
    roomModel.joined_player = rooms.get(roomModel.room_id).size;
    // 방에 있는 모두에게 나 나간다고 알린다
    data = {
      socket_id: socket.id,
      roomModel: roomModel,
    }
    io.to(roomModel.room_id).emit('leave_room', data);

    // 게임중이라면 실패로 들어간다
    if (rooms.get(roomModel.room_id) !== undefined && rooms.get(roomModel.room_id).isOnGame === true){
      rooms.get(roomModel.room_id).failed_player.push(roomModel.user_id);
    }
  }
}


function startGameTimer(io, socket, rooms, roomModel) {
  const timerSeconds = 60 * 3; // 게임 시간 설정 : 3분

  let timer = timerSeconds;

  let timerId = setInterval(() => {
    if (rooms.get(roomModel.room_id)) {
      io.to(roomModel.room_id).emit('game_timer', timer);
      console.log(`${roomModel.room_id}번 방 : 게임시간 ${timer}초 남음`);

      let finished_player = rooms.get(roomModel.room_id).finished_player;
      let failed_player = rooms.get(roomModel.room_id).failed_player;
      let size = finished_player.length + failed_player.length
      console.log(size, roomModel.max_player);
      if (size === roomModel.max_player){
        gameEnd(io, socket, rooms, roomModel, timerId);
      }

      timer--;
      if (timer === -1) {
        // clearInterval(timerId);
        // 여기다 타이머 끝나면 할 작동 기술
        gameEnd(io, socket, rooms, roomModel, timerId);
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

function overSpeed(io, socket, rooms, roomModel) {
  console.log('과속했습니다!');
  reason = 'over_speed';
  gameFailed(io, socket, rooms, roomModel, reason);

}

function captured(io, socket, rooms, roomModel) {
  console.log('술래에게 잡혔습니다!');
  reason = 'captured';
  gameFailed(io, socket, rooms, roomModel, reason);
}

function mouseUp(io, socket, rooms, roomModel) {
  console.log('마우스에서 손을 뗐습니다!');
  reason = 'mouse_up';
  gameFailed(io, socket, rooms, roomModel, reason);
}

function finish(io, socket, rooms, roomModel) {
  console.log(`${roomModel.room_id}번 방 : ${roomModel.user_id}님이 결승선을 통과했습니다!`);
  rooms.get(roomModel.room_id).finished_player.push(roomModel.user_id);
  
}

function gameFailed(io, socket, rooms, roomModel, reason) {
  let data = {
    reason: reason,
    socket_id: socket.id,
  }
  console.log(reason, socket.id, roomModel.room_id);
  socket.broadcast.to(roomModel.room_id).emit('other_game_failed', data);

  rooms.get(roomModel.room_id).failed_player.push(roomModel.user_id);
}



function gameEnd(io, socket, rooms, roomModel, timerId) {
  // 타이머가 종료되었을 때 호출됨
  // 게임을 플레이중인 사람이 없을 때 호출됨
    // 모두 탈락 or 성공 or 나감
  clearInterval(timerId);
  let finished_player = rooms.get(roomModel.room_id).finished_player;
  let failed_player = rooms.get(roomModel.room_id).failed_player;

  console.log(finished_player, failed_player);

  data = {
    finished_player: finished_player,
    failed_player: failed_player,
  }
  
  io.to(roomModel.room_id).emit('game_end', data);
}

*/
