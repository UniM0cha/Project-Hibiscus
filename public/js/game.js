// 쿼리 스트링에서 유저 아이디 받아오기
const search = location.search;
const params = new URLSearchParams(search);
const user_id = params.get('user_id');
let room_id = null;
let on_game = false;
console.log('User ID :', user_id);

const socket = io();

function create_room() {
  $('#nickname').text(user_id);
  $('.lobby').show();

  let user_info = { user_id: user_id };
  let output = { command: 'create', user_info: user_info };
  socket.emit('room', output);
}

function search_room() {
  $('#nickname').text(user_id);

  let user_info = { user_id: user_id };
  socket.emit('room', { command: 'enter', user_info: user_info });

  $('#btn_join_room').click(() => {
    room_id = $('#input_room_id').val();

    if (room_id === '') {
      $('#error_message').show().text('방 번호를 입력해주세요');
    } else {
      console.log(`${room_id}번 방에 접속을 시도합니다.`);

      let user_info = { user_id: user_id };
      let room_info = { room_id: room_id };
      let output = { command: 'join', user_info: user_info, room_info: room_info };
      socket.emit('room', output);
    }
  });
}

socket.on('room_status', (data) => {
  console.log(data);
  let command = data.command;

  // 방 참여 성공
  if (command === 'success') {
    room_id = data.room_info.room_id;
    $('#room_id').text(data.room_info.room_id);
    $('#joined_player').text(data.room_info.joined_player);
    $('#max_player').text(data.room_info.max_player);
    $('.before_join').hide();
    $('.lobby').show();
  }
  
  // 다른 참여자 방 나감
  else if (command === 'leave') {
    $('#joined_player').text(data.room_info.joined_player);
    $('#max_player').text(data.room_info.max_player);

    // if(on_game === true) {
    //   $('.players_result').filter(`#${data.socket_id}`).text('게임을 나갔습니다!');
    //   $('.players_range').filter(`#${data.socket_id}`).attr('disabled', true);
    // }
  }
  
  // 방 가득 참
  else if (command === 'full') {
    $('#error_message').show().text('해당 방이 가득 찼습니다!');
  }
  
  // 방 없음
  else if (command === 'no_room') {
    $('#error_message').show().text('해당 방이 없습니다! 번호를 다시 확인해주세요');
  }

  // 모든 인원 들어옴
  else if (command === 'all') {
    $('#status').text('참가자가 모두 들어왔습니다. 준비 완료 버튼을 눌러주세요!');
  }

  // 게임 시작 카운트다운
  else if (command === 'game_start_timer') {
    time = data.time
    $('#status').text(`준비가 완료되었습니다. 3초후에 게임을 시작합니다... ${time}`);
  }
});

$('#ready_game_button').click(() => {
  console.log('준비버튼 클릭');
  $('#ready_game_button').attr('disabled', true).val('준비 완료됨');

  let user_info = { user_id: user_id };
  let room_info = { room_id: room_id };
  let output = { command: 'ready', user_info: user_info, room_info: room_info };
  socket.emit('room', output);
});

socket.on('game', (data) => {
  let command = data.command;

  // 게임 시작
  if (command === 'start') {
    $('.lobby').hide();
    $('.welcome').hide();
    $('.start_game').show();

    startGame(data);
  }
  
  
});

let timer_range_checker = null;
let timer_send_range = null;

// 게임 시작 함수
function startGame(data){
  on_game = true;

  let user_ids = data.user_ids;
  let socket_ids = data.socket_ids;
  generateOtherPlayer(user_ids, socket_ids);

  let current_value = 0;
  let previous_value = 0;
  let speed = 0;

  // range의 상태를 확인할 타이머 등록
  timer_range_checker = setInterval(() => {
    current_value = $('#range').val();
    console.log(current_value);
    speed = current_value - previous_value;
    $('#speed').text(speed);

    // 과속 감지
    if (Math.abs(speed) >= 100) {
      gameFailed('over_speed')
    }

    // 무궁화 꽃이 피었습니다 일때 움직임 감지
    else if (hibiscus === true && Math.abs(speed) > 0) {
      gameFailed('captured')
    }

    // 결승선 도달
    else if (current_value === '10000') {
      gameFinished()
    }

    previous_value = current_value;
  }, 100);

  timer_send_range = setInterval(() => {
    current_value = $('#range').val();
    let output = { command: 'range', value: current_value };
    socket.emit('game', output);
  }, 1000);

  // 마우스 뗌 감지
  $('#range').on('mousedown', (e) => {
    console.log('range 누름');
    $('#range').on('mouseup', (e) => {
      console.log('range 뗌');
      gameFailed('mouse_up');
    });
  });
}

// 다른 플레이어들 표시하는 함수
function generateOtherPlayer(user_ids, socket_ids) {
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

// socket.on('to_client_range', (data) => {
//   let socket_id = data.socket_id;
//   let value = data.value;
//   console.log(`value값 가져옴 ${value}`);

//   $(`#${socket_id}`).filter('.players_range').val(value);
// });

// // 타이머
// socket.on('game_timer', (timer) => {
//   let minutes = Math.floor(timer / 60);
//   let seconds = timer % 60;
//   let timer_text = `남은시간 : ${minutes}분 ${seconds}초`;
//   $('#timer').text(timer_text);
// });

// // 무궁화 꽃이 피었습니다 텍스트 수신
// socket.on('hibiscus_text', (text) => {
//   let combText = $('#hibiscus').text() + text;
//   $('#hibiscus').text(combText);
// });

// // 무궁화 꽃이 피었습니다 초기화
// socket.on('hibiscus_restart', () => {
//   hibiscus = false;
//   $('#hibiscus').text('');
//   console.log('다시 시작');
// });

// socket.on('hibiscus_watch', () => {
//   hibiscus = true;
// });

/*

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

*/
