// 쿼리 스트링에서 유저 아이디 받아오기
let search = location.search;
let params = new URLSearchParams(search);
let user_id = params.get('user_id');
console.log('User ID :', user_id);

const socket = io();

function create_room() {
  let data = {
    user_id: user_id
  }
  // 방 만들기 요청
  socket.emit('create_room', data);

  // 방의 정보 받아옴
  socket.on('room_info', (data) => {
    $('#roomID').text(data.room_id);
    $('#joinedPlayer').text(data.joinedPlayer);
    $('#maxPlayer').text(data.maxPlayer);
  });

  socket.on('join_success', (data) => {
    let room_joiner_size = data.room_joiner_size;
    let room_max_size = data.room_max_size;

    $('#joinedPlayer').text(room_joiner_size);
    $('#maxPlayer').text(room_max_size);
  });
}

function main() {
  let search = location.search;
  let params = new URLSearchParams(search);
  let user_id = params.get('user_id');
  console.log('User ID :', user_id);
  
  let dataToSend = {
    user_id: user_id,
  };
  socket.emit('create_room', dataToSend);
  
  $('#welcome').text(`${user_id}님 안녕하세요!`);
  
  socket.on('room_info', (data) => {
    $('#roomID').text(data.room_id);
    $('#joinedPlayer').text(data.joinedPlayer);
    $('#maxPlayer').text(data.maxPlayer);
  });
  
  socket.on('join_success', (data) => {
    let room_joiner_size = data.room_joiner_size;
    let room_max_size = data.room_max_size;
  
    $('#joinedPlayer').text(room_joiner_size);
    $('#maxPlayer').text(room_max_size);
  });
}



function search_room() {
  let search = location.search
  let params = new URLSearchParams(search);
  let user_id = params.get('user_id');
  console.log('User ID :', user_id);

  let room_id = '';

  // 문서 로딩 후 실행
  $(() => {
    $('#welcome').text(`${user_id}님 안녕하세요!`);

    $('#joinButton').click(() => {
      room_id = $('#roomID').val();
      console.log(room_id);
      let dataToSend = {
        user_id: user_id,
        room_id: room_id
      };
      socket.emit('check_room', dataToSend);
    })
  });

  socket.on('no_room', () => {
    console.log('방 찾지 못함');
    $('#errorMessage').css('visibility', 'visible');
  })

  socket.on('is_room', () => {
    console.log('방 찾음');
    location.href = `/room_join?room_id=${room_id}&user_id=${user_id}`;
  })
}