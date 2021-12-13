// 쿼리 스트링에서 유저 아이디 받아오기
const search = location.search;
const params = new URLSearchParams(search);
const user_id = params.get('user_id');
let room_id = null;
// 게임을 시작했는지 판단할 플래그 변수
let isOnGame = false;
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
    $('#joined_player').text(data.roomModel.joined_player);
    $('#max_player').text(data.roomModel.max_player);

    // 게임중이라면 실패
    if(isOnGame === true) {
      $('.players_result').filter(`#${data.socket_id}`).text('게임을 나갔습니다!');
      $('.players_range').filter(`#${data.socket_id}`).attr('disabled', true);
    }
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
      $('#error_message').show().text('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0방 번호를 입력해주세요');
    }
  });

  socket.on('join_noroom', () => {
    console.log('방 찾지 못함');
    $('#error_message').show().text('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0해당 방이 없습니다! 번호를 다시 확인해주세요');
  });

  socket.on('join_full', () => {
    console.log('방 찾지 못함');
    $('#error_message').show().text('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0해당 방이 가득 찼습니다!');
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
  $('#status').text('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0참가자가 모두 들어왔습니다. 입장 버튼을 눌러주세요!');

  $('#ready_game_button').click(() => {
    console.log('준비버튼 클릭');
    $('#ready_game_button').attr('disabled', true).val('준비 완료');

    socket.emit('ready_pressed');
  });
});

socket.on('count_down', (timer) => {
  $('#status').text(`\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0준비가 완료되었습니다. 3초후에 게임을 시작합니다... ${timer}`);
});

// 모두 준비 완료를 눌렀을 때
socket.on('start_game', (data) => {
  $('.lobby').hide();
  $('.welcome').hide();
  $('.start_game').show();
  $('.explain').hide();
  $('.input1').hide();
  $('.result').show();

  generateOtherPlayer(data);
  game();
});

/////////////////////////////////////////////
///////////  게임 관련 함수들 ///////////////
/////////////////////////////////////////////
let hibiscus = false;

function game() {
  isOnGame = true;
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
      overSpeed(rangeChecker, sendRangeValueTimer);
    }

    // 무궁화 꽃이 피었습니다 일때 움직임 감지
    else if (hibiscus === true && Math.abs(speed) > 0) {
      captured(rangeChecker, sendRangeValueTimer);
    }

    // 결승선 도달
    else if (currentValue === '10000') {
      finish(rangeChecker, sendRangeValueTimer);
    }

    previousValue = currentValue;
  }, 100);

  let sendRangeValueTimer = setInterval(() => {
    currentValue = $('#range').val();
    socket.emit('to_server_range', currentValue);
  }, 1000);

  // 마우스 뗌 감지
  $('#range').on('mousedown', (e) => {
    console.log('range 누름');
    $('#range').on('mouseup', (e) => {
      console.log('range 뗌');
      mouseUp(rangeChecker, currentValue);
    });
  });
}

// 다른 플레이어들 표시하는 함수
function generateOtherPlayer(data) {
  let socket_ids = data.socket_ids;
  let user_ids = data.user_ids;
  console.log(socket_ids);
  console.log(user_ids);

  let container = document.createElement('div');
  container.className = 'players_grid_container';

  for (let i = 0; i < socket_ids.length; i++) {
    // 자신 제외
    if (socket_ids[i] === socket.id) {
      continue;
    }

    let item = document.createElement('div');
    item.className = 'players_grid_item';

    let nickname = document.createElement('h3');
    nickname.className = 'players_name';
    nickname.innerHTML = user_ids[i];

    let range = document.createElement('input');
    range.type = 'range';
    range.className = 'players_range';
    range.id = socket_ids[i];
    range.value = 0;
    range.min = 0;
    range.max = 10000;
    range.step = 1;

    let result = document.createElement('h3');
    result.className = 'players_result';
    result.id = socket_ids[i];

    item.appendChild(nickname);
    item.appendChild(range);
    item.appendChild(result);
    container.appendChild(item);
  }

  let input = document.getElementById('other_player');
  input.appendChild(container);
}

socket.on('to_client_range', (data) => {
  let socket_id = data.socket_id;
  let value = data.value;
  console.log(`value값 가져옴 ${value}`);

  $(`#${socket_id}`).filter('.players_range').val(value);
});

// 타이머
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
function overSpeed(timerId1, timerId2) {
  console.log('과속했습니다!');
  $('#result').text('과속했습니다!');

  let reason = 'over_speed';
  gameFailed(timerId1, timerId2, reason);
}

function captured(timerId1, timerId2) {
  console.log('술래에게 잡혔습니다!');
  $('#result').text('술래에게 잡혔습니다!');

  let reason = 'captured';
  gameFailed(timerId1, timerId2, reason);
}

function mouseUp(timerId1, timerId2) {
  console.log('마우스에서 손을 뗐습니다!');
  $('#result').text('마우스에서 손을 뗐습니다!');

  let reason = 'mouse_up';
  gameFailed(timerId1, timerId2, reason);
}

// 통과 함수
function finish(timerId1, timerId2) {
  let data = {
    user_id: user_id,
    room_id: room_id,
  };
  // socket.emit('client_info', data);
  socket.emit('finish');
  clearInterval(timerId1);
  clearInterval(timerId2);
}

// 게임에 탈락했을 때 서버에게 이유를 보낼 함수
function gameFailed(timerId1, timerId2, reason) {
  $('#range').attr('disabled', true);

  let data = {
    user_id: user_id,
    room_id: room_id,
  };

  // socket.emit('client_info', data);
  socket.emit('game_failed', reason);
  clearInterval(timerId1);
  clearInterval(timerId2);
}

socket.on('other_game_failed', (data) => {
  let reason = data.reason;
  let socket_id = data.socket_id;

  console.log(reason, socket_id);

  if (reason === 'over_speed'){
    $('.players_result').filter(`#${socket_id}`).text('과속했습니다!');
    $('.players_range').filter(`#${socket_id}`).attr('disabled', true);
  }
  else if (reason === 'captured') {
    $('.players_result').filter(`#${socket_id}`).text('술래에게 잡혔습니다!');
    $('.players_range').filter(`#${socket_id}`).attr('disabled', true);
  }
  else if (reason === 'mouse_up'){
    $('.players_result').filter(`#${socket_id}`).text('마우스에서 손을 뗐습니다!');
    $('.players_range').filter(`#${socket_id}`).attr('disabled', true);
  }
})

socket.on('game_end', (data) => {
  console.log('게임이 끝났습니다.');

  let form = document.createElement('form');
  let input = document.createElement('input');
  input.setAttribute('type', 'hidden');
  input.setAttribute('name', 'userid');
  input.setAttribute('value', data);

  form.appendChild(input);
  form.setAttribute('method', 'post');
  form.setAttribute('action', '/result')
  document.body.appendChild(form);
  form.submit();
})