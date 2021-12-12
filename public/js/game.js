// 쿼리 스트링에서 유저 아이디 받아오기
const search = location.search;
const params = new URLSearchParams(search);
const user_id = params.get('user_id');
let room_id = null;
console.log('User ID :', user_id);

const socket = io();

// 방 생성 함수
function create_room() {
  $('#nickname').text(user_id);
  $('.lobby').show();

  let data = {
    user_id: user_id,
    room_id: room_id,
    joined_player: null,
    max_player: null,
  };
  // 방 만들기 요청
  socket.emit('client_info', data);
  socket.emit('create_room');

  // 방의 정보 받아옴
  socket.on('join_success', (data) => {
    room_id = data.room_id;
    $('#room_id').text(data.room_id);
    $('#joined_player').text(data.joined_player);
    $('#max_player').text(data.max_player);
  });

  // 방 나감
  socket.on('leave_room', (data) => {
    $('#joined_player').text(data.joined_player);
    $('#max_player').text(data.max_player);
  });
}

// 방 참여 함수
function search_room() {
  $('#nickname').text(user_id);

  // 참여하기 버튼 클릭
  $('#btn_join_room').click(() => {
    room_id = $('#input_room_id').val();
    if (room_id !== '') {
      console.log(`${room_id}번 방에 접속을 시도합니다.`);

      let data = {
        user_id: user_id,
        room_id: room_id,
      };
      socket.emit('client_info', data);
      socket.emit('join_room');
    } else {
      $('#error_message').show().text('방 번호를 입력해주세요');
    }
  });

  socket.on('join_noroom', () => {
    console.log('방 찾지 못함');
    $('#error_message').show().text('해당 방이 없습니다! 번호를 다시 확인해주세요');
  });

  socket.on('join_full', () => {
    console.log('방 찾지 못함');
    $('#error_message').show().text('해당 방이 가득 찼습니다!');
  });

  // 방의 정보 받아옴
  socket.on('join_success', (data) => {
    console.log('접속 성공');
    $('.before_join').hide();
    $('.lobby').show();

    $('#room_id').text(data.room_id);
    $('#joined_player').text(data.joined_player);
    $('#max_player').text(data.max_player);
  });

  // 방 나감
  socket.on('leave_room', (data) => {
    $('#joined_player').text(data.joined_player);
    $('#max_player').text(data.max_player);
  });
}

// 참여자가 모두 들어왔을 때
socket.on('ready_game', () => {
  $('#ready_game_button').attr('disabled', false);
  $('#status').text('참가자가 모두 들어왔습니다. 준비 완료 버튼을 눌러주세요!');

  $('#ready_game_button').click(() => {
    console.log('준비버튼 클릭');
    $('#ready_game_button').attr('disabled', true).val('준비 완료됨');

    socket.emit('ready_pressed');
  });
});

socket.on('count_down', (timer) => {
  $('#status').text(`준비가 완료되었습니다. 3초후에 게임을 시작합니다... ${timer}`);
});

// 모두 준비 완료를 눌렀을 때
socket.on('start_game', (data) => {
  $('.lobby').hide();
  $('.welcome').hide();
  $('.start_game').show();

  generateOtherPlayer(data);
  game();
});

/////////////////////////////////////////////
///////////  게임 관련 함수들 ///////////////
/////////////////////////////////////////////
let hibiscus = false;

function game() {
  let currentValue = 0;
  let previousValue = 0;
  let speed = 0;

  // range의 상태를 확인할 타이머 등록
  let rangeChecker = setInterval(() => {
    currentValue = $('#range').val();
    console.log(currentValue);
    speed = currentValue - previousValue;
    $('#speed').text(speed);

    // 과속 감지
    if (Math.abs(speed) >= 100) {
      overSpeed(rangeChecker);
    }

    // 무궁화 꽃이 피었습니다 일때 움직임 감지
    if (hibiscus === true && Math.abs(speed) > 0) {
      captured(rangeChecker);
    }

    // 결승선 도달
    if (currentValue === '10000') {
      finish(rangeChecker);
    }

    previousValue = currentValue;
  }, 100);

  $('#range').on('mousedown', (e) => {
    console.log('range 누름');
    $('#range').on('mouseup', (e) => {
      console.log('range 뗌');
      mouseUp(rangeChecker);
    })
  })

}

// 다른 플레이어들 표시하는 함수
function generateOtherPlayer(data) {
  let socket_id = data.socket_id;
  let max_player = data.roomModel.max_player;

  let container = document.createElement("div");
  container.className = players_grid_container;
  
  for(let i = 0; i < max_player; i++) {
    let item = document.createElement('div');
    item.className = "players_grid_item";

    let nickname = document.createElement('h3');
    nickname.className = "players_name";
    nickname.innerHTML = "플레이어 이름.. 어케 받아와 ㅠ"
    
    let range = document.createElement('input');
    range.className = "players_range";
    range.id = socket_id;
    range.type = range;

    let result = document.createElement('h3');
    result.className = "players_result"
    result.id = socket_id;


    item.appendChild(nickname);
    item.appendChild(range);
  }




  let input = document.getElementById("other_player");
  input.appendChild(container);
}

socket.on('game_timer', (timer) => {
  let minutes = Math.floor(timer / 60);
  let seconds = timer % 60;
  let timer_text = `남은시간 : ${minutes}분 ${seconds}초`;
  $('#timer').text(timer_text);
});

// 무궁화 꽃이 피었습니다 텍스트 수신
socket.on('hibiscus_text', (text) => {
  let combText = $('#hibiscus').text() + text;
  $('#hibiscus').text(combText);
});

// 무궁화 꽃이 피었습니다 초기화
socket.on('hibiscus_restart', () => {
  hibiscus = false;
  $('#hibiscus').text('');
  console.log('다시 시작');
});

socket.on('hibiscus_watch', () => {
  hibiscus = true;
});


////// 탈락 이벤트 함수들.... 통합 가능하겠는데? ///////
function overSpeed(timerId) {
  console.log('과속했습니다!');
  $('#result').text('과속했습니다!');

  let reason = 'over_speed';
  gameFailed(timerId, reason);
}

function captured(timerId) {
  console.log('술래에게 잡혔습니다!');
  $('#result').text('술래에게 잡혔습니다!');

  let reason = 'captured';
  gameFailed(timerId, reason);
}

function mouseUp(timerId) {
  console.log('마우스에서 손을 뗐습니다!');
  $('#result').text('마우스에서 손을 뗐습니다!');

  let reason = 'mouse_up';
  gameFailed(timerId, reason);
}

// 통과 함수
function finish(timerId) {
  let data = {
    user_id: user_id,
    room_id: room_id,
  };
  socket.emit('client_info', data);
  socket.emit('finish');
  clearInterval(timerId);
}

// 게임에 탈락했을 때 서버에게 이유를 보낼 함수
function gameFailed(timerId, reason) {
  $('#range').attr('disabled', true);

  let data = {
    user_id: user_id,
    room_id: room_id,
  };

  socket.emit('client_info', data);
  socket.emit('game_failed', reason);
  clearInterval(timerId);
}