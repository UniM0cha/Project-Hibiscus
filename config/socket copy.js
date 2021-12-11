module.exports = function (server) {
  const io = require('socket.io')(server);

  // 방 최대 참여자 수
  const max_player = 3;
  let rooms = io.sockets.adapter.rooms;
  let allClients = [];

  // 소켓이 연결 되면
  io.on('connection', (socket) => {
    console.log(`클라이언트가 연결되었습니다. Socket ID : ${socket.id}`);

    allClients.push(socket);

    // 일반 소켓 연결해제
    socket.on('disconnect', () => {
      // io.to(room_id).emit('join_success', data);
      console.log(`클라이언트의 연결이 종료되었습니다. Socket ID : ${socket.id}`);
    });

    // 소켓 에러
    socket.on('error', (error) => {
      console.error(error);
    });

    socket.on('client_info', (data) => {
      // 클라이언트가 보내는 유저아이디, 방아이디를 가져와서 모델 생성
      let joined_player = null;
      if (data.room_id !== null) {
        joined_player = rooms.get(room_id).size;
        console.log(joined_player);
      }
      let roomModel = new RoomModel(data.user_id, data.room_id, joined_player, max_player);

      // 방 만들기 요청 핸들러
      socket.on('create_room', () => {
        // 생성된 방 번호를 저장할 변수
        let room_id = generateRoomCode();

        // 해당 room code에 참가
        socket.join(room_id);
        console.log(`${room_id}번 방을 생성했습니다.`);
        console.log('현재 만들어진 방: \n', rooms);

        // roomModel 매핑
        roomModel.room_id = room_id;
        roomModel.joined_player = rooms.get(room_id).size;
        roomModel.max_player = max_player;

        // 조인 성공 이벤트 전송
        socket.emit('join_success', roomModel);
      });

      // 방에 참여 시도
      socket.on('join_room', () => {
        console.log(`${roomModel.room_id}번 방에 접속 시도`);

        if (rooms.get(roomModel.room_id)) {
          // 방이 있다면
          // 방이 가득 찼으면, 진입 불가
          if (roomModel.joined_player === max_player) {
            console.log('해당 방이 가득 참');
            socket.emit('join_full');
          } else {
            socket.join(roomModel.room_id);
            console.log('방에 접속 성공');
            roomModel.joined_player = rooms.get(room_id).size;

            // 방에 있는 모두에게 나 왔다고 알린다
            io.to(room_id).emit('join_success', roomModel);

            // 방이 가득 찼으면, 게임 준비
            if (joined_player === max_player) {
              io.to(room_id).emit('ready_game');
            }

            // 방을 나간다면
            socket.on('disconnect', () => {
              console.log(`${user_id}님이 방을 나갔습니다.`);
              socket.leave(room_id);

              joined_player = rooms.get(room_id).size;

              let roomModel = new RoomModel(user_id, room_id, joined_player, max_player);

              // 방에 있는 모두에게 나 나간다고 알린다
              io.to(room_id).emit('leave_room', roomModel);
            });
          }
        } else {
          // 방이 없다면
          socket.emit('join_noroom');
        }

        socket.on('ready_button_pressed', () => {
          console.log('준비버튼 눌림');
          rooms.get(room_id).ready++;
          console.log(rooms.get(room_id).ready);
          if (rooms.ready === max_player) {
            socket.to('room_id').emit('start_game');
          }
        });
      });
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
};

function RoomModel(user_id, room_id, joined_player, max_player) {
  this.user_id = user_id;
  this.room_id = room_id;
  this.joined_player = joined_player;
  this.max_player = max_player;
}