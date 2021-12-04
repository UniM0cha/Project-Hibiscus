module.exports = function(server) {

  const io = require('socket.io')(server);

  // 방 최대 참여자 수
  const max_player = 3;
  let rooms = io.sockets.adapter.rooms;

  // 소켓이 연결 되면
  io.on('connection', (socket) => {
    console.log(`클라이언트가 연결되었습니다. Socket ID : ${socket.id}`);

    // 소켓 끊기면
    socket.on('disconnect', () => {
      console.log(`클라이언트의 연결이 종료되었습니다. Socket ID : ${socket.id}`);
    });

    // 소켓 에러
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
      let joined_player = rooms.get(room_id).size;

      // 유저 닉네임 불러옴
      let user_id = data.user_id;

      data = {
        room_id: room_id,
        joined_player: joined_player,
        max_player: max_player,
        user_id: user_id
      }

      // 조인 성공 이벤트 전송
      socket.emit('join_success', data);
    });

    // 방이 있는지 체크
    socket.on('check_room', (data) => {
      let user_id = data.user_id;
      let room_id = data.room_id;

      if (!rooms.get(room_id)) {
        socket.emit('no_room');
      } else {
        socket.emit('is_room');
      }
    });

    // 방에 참여
    socket.on('join_room', (data) => {
      let user_id = data.user_id;
      let room_id = data.room_id;
      let room_joiner_size = rooms.get(room_id).size;

      // 방이 가득 찼으면, 게임 시작
      if (room_joiner_size === room_max_size) {
        io.to(room_id).emit('game_start');
      }
      // 방이 가득 차지 않았다면, 대기자 더 모음
      else {
        socket.join(room_id);

        room_joiner_size = rooms.get(room_id).size;
        let room_max_size = room_max_size;

        let dataToSend = {
          room_joiner_size: room_joiner_size,
          room_max_size: room_max_size,
        };

        // 방에 참여한 모두에게 정보 전달
        io.to(room_id).emit('join_success', dataToSend);
      }
    });
  });
};

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