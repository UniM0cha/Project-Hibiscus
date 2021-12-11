module.exports = function (server) {
  const io = require('socket.io')(server);

  // 방 최대 참여자 수
  const max_player = 2;
  let rooms = io.sockets.adapter.rooms;

  // 소켓이 연결 되면
  io.on('connection', (socket) => {
    console.log(`클라이언트가 연결되었습니다. Socket ID : ${socket.id}`);

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
      // 방장이 보낼 때 : "유저이름", null, null, null
      // 참여자가 보낼 때 : "유저이름", "방번호", null, null

      let roomModel = new RoomModel(data.user_id, data.room_id, null, max_player);
      
      // 방장 : "유저이름", null, null, 최대참여자수
      // 참여자 : "유저이름", "방번호", 참여자수, 최대참여자수

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
      })

      // 게임관련 이벤트들 정의
      socket.on('over_speed', () => {
        overSpeed();
      })
      
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

  // 방장 : "유저이름", "방아이디", 현재참여자수, 최대참여자수
  
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

function joinRoom(io, socket, rooms, roomModel){
  // 방이 있다면
  if (rooms.get(roomModel.room_id)) {
    roomModel.joined_player = rooms.get(roomModel.room_id).size;
    
    // 방이 가득 찼으면, 진입 불가
    if (roomModel.joined_player === roomModel.max_player) {
      console.log('해당 방이 가득 참');
      socket.emit('join_full');

    } else {  // 방에 자리 있으면

      socket.join(roomModel.room_id);
      console.log('방에 접속 성공');
      roomModel.joined_player = rooms.get(roomModel.room_id).size;

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

function roomLeave(io, socket, rooms, roomModel){
  console.log(`${roomModel.user_id}님이 방을 나갔습니다.`);
  socket.leave(roomModel.room_id);
  
  // 방이 존재한다면
  if(rooms.get(roomModel.room_id)){
    roomModel.joined_player = rooms.get(roomModel.room_id).size;
    // 방에 있는 모두에게 나 나간다고 알린다
    io.to(roomModel.room_id).emit('leave_room', roomModel);
  }
}

function readyPressed(io, socket, rooms, roomModel) {
  rooms.get(roomModel.room_id).ready++;
  console.log(rooms);
  if (rooms.get(roomModel.room_id).ready === roomModel.max_player){
    console.log('모두 준비가 완료되었습니다. 게임을 시작합니다.');
    io.to(roomModel.room_id).emit('start_game');
  }
}

function overSpeed() {
  console.log('과속했습니다!');
}