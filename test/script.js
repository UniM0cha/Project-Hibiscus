// 쿼리 스트링에서 유저 아이디 받아오기
let search = location.search;
let params = new URLSearchParams(search);
let user_id = params.get('user_id');
console.log('User ID :', user_id);

const socket = io();

// 로비
function main_page() {

}

// 방 생성 함수
function create_room() {
  $('#nickname').text(user_id);

  let data = {
    user_id: user_id,
  };
  // 방 만들기 요청
  socket.emit('create_room', data);

  // 방의 정보 받아옴
  socket.on('join_success', (data) => {
    $('#room_id').text(data.room_id);
    $('#joined_player').text(data.joined_player);
    $('#max_player').text(data.max_player);
  });
}

// 방 참여 함수
function search_room() {
  $('#welcome').text(`${user_id}님 안녕하세요!`);

  // 참여하기 버튼 클릭
  $('#joinButton').click(() => {
    room_id = $('#roomID').val();
    console.log(room_id);
    let dataToSend = {
      user_id: user_id,
      room_id: room_id,
    };
    socket.emit('check_room', dataToSend);
  });

  let room_id = null;

  socket.on('no_room', () => {
    console.log('방 찾지 못함');
    $('#errorMessage').css('visibility', 'visible');
  });

  socket.on('is_room', () => {
    console.log('방 찾음');
    location.href = `/room_join?room_id=${room_id}&user_id=${user_id}`;
  });
}
