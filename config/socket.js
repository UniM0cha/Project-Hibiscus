// 방 최대 참여자 수
const max_player = 10;
// const max_player = 3;
// 타이머
const game_time = 60 * 3;
// const game_time = 3;

module.exports = function (server) {
  const io = require('socket.io')(server);

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
      let is_ready = data.user_info.is_ready;
      let user_info = UserInfo(user_id, socket_id, is_ready);

      // create 요청
      if (command === 'create') {
        let room_id = generateRoomCode(io.sockets.adapter.rooms);
        socket.join(room_id);
        let joined_player = io.sockets.adapter.rooms.get(room_id).size;
        let room_info = RoomInfo(room_id, joined_player, max_player);

        let output = { command: 'success', user_info: user_info, room_info: room_info };
        io.to(room_id).emit('room_status', output);

        io.sockets.adapter.rooms.get(room_id).user_id = [];
        io.sockets.adapter.rooms.get(room_id).user_id.push(user_id);
        io.sockets.adapter.rooms.get(room_id).finished = [];
        io.sockets.adapter.rooms.get(room_id).failed = [];
        io.sockets.adapter.rooms.get(room_id).on_game = false;
        io.sockets.adapter.rooms.get(room_id).ready = 0;

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

            io.sockets.adapter.rooms.get(room_id).user_id.push(user_id);

            let room_info = RoomInfo(room_id, joined_player, max_player);
            let output = { command: 'success', user_info: user_info, room_info: room_info };
            io.to(room_id).emit('room_status', output);

            // 모든 참가자가 들어왔으면
            if (joined_player === max_player) {
              console.log(`${room_id}번 방 : 참가자 모두 들어옴`);
              let output = { command: 'all' };
              io.to(room_id).emit('room_status', output);
            }

            socket.removeAllListeners('disconnect');
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
        let room_info = data.room_info;
        let room_id = room_info.room_id;

        io.sockets.adapter.rooms.get(room_id).ready++;
        console.log('ready : ', io.sockets.adapter.rooms.get(room_id).ready);

        socket.removeAllListeners('disconnect');
        socket.on('disconnect', () => {
          disconnect(io, user_info, room_info);
        });

        // 모두 준비를 완료하면
        if (io.sockets.adapter.rooms.get(room_id).ready === max_player) {
          console.log(`${room_id}번 방 : 모두 준비가 완료되었습니다.`);
          console.log(`${room_id}번 방 : 3초 후 게임을 시작합니다.`);

          let time = 3;
          let game_start_timer = setInterval(() => {
            let output = { command: 'game_start_timer', time: time };
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

              startGame(io, room_id);
            }
          }, 1000);
        }
      }
    });

    // 게임 관련 소켓 이벤트들
    socket.on('game', (data) => {
      let user_id = data.user_info.user_id;
      let user_info = UserInfo(user_id, socket.id, null);
      let room_id = data.room_info.room_id;
      let room_info = RoomInfo(room_id, null, max_player);
      let command = data.command;

      if (command === 'range') {
        let value = data.value;
        let output = { command: 'range', value: value, user_info: user_info };
        socket.broadcast.to(room_id).emit('game', output);
      } else if (command === 'failed') {
        let reason = data.reason;

        if (reason === 'over_speed') {
          let output = { command: 'failed', reason: reason, user_info: user_info, room_info: room_info };
          socket.broadcast.to(room_id).emit('game', output);
          io.sockets.adapter.rooms.get(room_id).failed.push(user_id);
        } else if (reason === 'captured') {
          let output = { command: 'failed', reason: reason, user_info: user_info, room_info: room_info };
          socket.broadcast.to(room_id).emit('game', output);
          io.sockets.adapter.rooms.get(room_id).failed.push(user_id);
        } else if (reason === 'mouse_up') {
          let output = { command: 'failed', reason: reason, user_info: user_info, room_info: room_info };
          socket.broadcast.to(room_id).emit('game', output);
          io.sockets.adapter.rooms.get(room_id).failed.push(user_id);
        }
      } else if (command === 'finished') {
        let output = { command: 'finished', user_info: user_info, room_info: room_info };
        socket.broadcast.to(room_id).emit('game', output);
        io.sockets.adapter.rooms.get(room_id).finished.push(user_id);
      } else if (command === 'is_on_game') {
        let on_game = data.on_game;
        if (on_game === true) {
          io.sockets.adapter.rooms.get(room_id).failed.push(user_id);
        }
      }
    });
  });
};

function UserInfo(user_id, socket_id, is_ready) {
  let data = {
    user_id: user_id,
    socket_id: socket_id,
    is_ready: is_ready,
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
  let room_id = room_info.room_id;
  let user_id = user_info.user_id;
  console.log(`${user_id}님이 접속을 종료했습니다.`);

  if (io.sockets.adapter.rooms.get(room_id)) {
    room_info.joined_player = io.sockets.adapter.rooms.get(room_id).size;

    if (user_info.is_ready === true) {
      io.sockets.adapter.rooms.get(room_id).ready--;
    }

    let output = { command: 'leave', user_info: user_info, room_info: room_info };
    console.log(output);
    io.to(room_id).emit('room_status', output);

    // 게임중이라면 게임 실패 기능 구현
    if (io.sockets.adapter.rooms.get(room_id) && io.sockets.adapter.rooms.get(room_id).on_game) {
      let output = { command: 'failed', reason: 'disconnect', user_info: user_info, room_info: room_info };
      io.to(room_id).emit('game', output);
      io.sockets.adapter.rooms.get(room_id).failed.push(user_id);
    }
  }
}

let timer_game = null;
let timer_hibiscus = null;

// startGame에 필요한 정보
function startGame(io, room_id) {
  io.sockets.adapter.rooms.get(room_id).on_game = true;

  // 무궁화 꽃이 피었습니다 정의
  let text = ['무', '궁', '화', ' ', '꽃', '이', ' ', '피', '었', '습', '니', '다'];
  timeout(text, 0);

  function timeout(text, i) {
    // 문자열 출력은 80ms ~ 500ms
    let rand_time = Math.floor(Math.random() * 421) + 80;

    timer_hibiscus = setTimeout(() => {
      if (io.sockets.adapter.rooms.get(room_id)) {
        let output = { command: 'hibiscus', type: 'text', text: text[i] };
        io.to(room_id).emit('game', output);
        i++;

        // 모두 출력했을 때
        if (i === text.length) {
          let output = { command: 'hibiscus', type: 'watch' };
          io.to(room_id).emit('game', output);

          // 술래가 보는 시간 1000ms ~ 3000ms
          let rand_time = Math.floor(Math.random() * 5001) + 1000;
          timer_hibiscus = setTimeout(() => {
            let output = { command: 'hibiscus', type: 'restart' };
            io.to(room_id).emit('game', output);
            timeout(text, 0);
          }, rand_time);

          return;
        }

        timeout(text, i);
      } else {
        console.log(`${room_id}번 방이 사라졌습니다. 무궁화 타이머를 종료합니다.`);
        clearInterval(timer_hibiscus);
      }
    }, rand_time);
  }

  // 3분 타이머 정의
  let time = game_time;
  timer_game = setInterval(() => {
    if (io.sockets.adapter.rooms.get(room_id)) {
      // 타이머 끝
      if (time === -1) {
        endTimer(io, room_id);
      }

      // 타이머 진행중
      else {
        let output = { command: 'timer', time: time };
        io.to(room_id).emit('game', output);
        time--;
      }

      // 모두 결과가 들어왔는지 확인
      let finished = io.sockets.adapter.rooms.get(room_id).finished;
      let failed = io.sockets.adapter.rooms.get(room_id).failed;
      let size = finished.length + failed.length;

      if (size === max_player) {
        endGame(io, room_id);
      }
    } else {
      // 방이 사라질 경우 타이머 삭제해야함
      console.log(`${room_id}번 방이 사라졌습니다. 게임 타이머를 종료합니다.`);
      clearInterval(timer_game);
    }
  }, 1000);
}

// 타이머가 다 됐는데도 아직 플레이 중인 사람들을 체크한다
// 필요한 정보 : room_id
function endTimer(io, room_id) {
  io.to(room_id).emit('game', { command: 'is_on_game' });
}

function endGame(io, room_id) {
  clearInterval(timer_hibiscus);
  clearInterval(timer_game);

  let finished = io.sockets.adapter.rooms.get(room_id).finished;
  let failed = io.sockets.adapter.rooms.get(room_id).failed;

  console.log(finished, failed);

  let output = { command: 'end', finished: finished, failed: failed };

  io.to(room_id).emit('game', output);
}
