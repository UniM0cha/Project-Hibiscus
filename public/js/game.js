// 쿼리 스트링에서 유저 아이디 받아오기
let search = location.search;
let params = new URLSearchParams(search);
let user_id = params.get('user_id');
console.log('User ID :', user_id);

const socket = io();

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

  // 방 나감
  socket.on('leave_room', (data) => {
    $('#joined_player').text(data.joined_player);
    $('#max_player').text(data.max_player);
  })

  // range mousedown 이벤트
  $('#field').on('mousedown', (e) => {
    console.log('range 누름');
  })
}

// 방 참여 함수
function search_room() {

  $('#nickname').text(user_id);

  // 참여하기 버튼 클릭
  $('#btn_join_room').click(() => {
    let room_id = $('#input_room_id').val();
    if(room_id !== ''){
      console.log(`${room_id}번 방에 접속을 시도합니다.`);

      let data = {
        user_id: user_id,
        room_id: room_id,
      };
  
      socket.emit('join_room', data);
    } else {
      $('#error_message')
      .show()
      .text('방 번호를 입력해주세요')
    }
  });

  socket.on('join_noroom', () => {
    console.log('방 찾지 못함');
    $('#error_message')
    .show()
    .text('해당 방이 없습니다! 번호를 다시 확인해주세요')
  });

  socket.on('join_full', () => {
    console.log('방 찾지 못함');
    $('#error_message')
    .show()
    .text('해당 방이 가득 찼습니다!')
  });

  // 방의 정보 받아옴
  socket.on('join_success', (data) => {
    console.log('접속 성공');
    $('.before_join').hide();
    $('.join').show();

    $('#room_id').text(data.room_id);
    $('#joined_player').text(data.joined_player);
    $('#max_player').text(data.max_player);
  });

  // 방 나감
  socket.on('leave_room', (data) => {
    $('#joined_player').text(data.joined_player);
    $('#max_player').text(data.max_player);
  })
}

socket.on('start_game', () => {
  $('.before_game').hide();
  $('.start_game').show();
})