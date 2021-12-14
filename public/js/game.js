const MAX_SPEED = 200;

// 쿼리 스트링에서 유저 아이디 받아오기
const search = location.search;
const params = new URLSearchParams(search);
const user_id = params.get('user_id');
let room_id = null;
let on_game = false;
let hibiscus = false;
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
      $('#error_message').show().text('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0방 번호를 입력해주세요');
    } else {
      console.log(`${room_id}번 방에 접속을 시도합니다.`);

      let user_info = { user_id: user_id, is_ready: false };
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
    $('#status').text('참가자를 대기중입니다...');
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
    $('#status').text('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0참가자가 모두 들어왔습니다. 입장 버튼을 눌러주세요!');
  }

  // 게임 시작 카운트다운
  else if (command === 'game_start_timer') {
    time = data.time;
    $('#status').text(`\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0준비가 완료되었습니다. 3초후에 게임을 시작합니다... ${time}`);
  }
});

$(() => {
  $('#ready_game_button').click(() => {
    console.log('준비버튼 클릭');
    $('#ready_game_button').attr('disabled', true).val('준비 완료');

    let user_info = { user_id: user_id, is_ready: true };
    let room_info = { room_id: room_id };
    let output = { command: 'ready', user_info: user_info, room_info: room_info };
    socket.emit('room', output);
  });
});

socket.on('game', (data) => {
  let command = data.command;

  // 게임 시작
  if (command === 'start') {
    $('.lobby').hide();
    $('.welcome').hide();
    $('.start_game').show();
    $('.explain').hide();
    $('.input1').hide();

    startGame(data);
  }

  // 무궁화 꽃이 피었습니다 관련
  else if (command === 'hibiscus') {
    let type = data.type;

    if (type === 'text') {
      let text = data.text;
      let combText = $('#hibiscus').text() + text;
      $('#hibiscus').text(combText);
    } else if (type === 'watch') {
      hibiscus = true;
    } else if (type === 'restart') {
      hibiscus = false;
      $('#hibiscus').text('');
    }
  }

  // 타이머
  else if (command === 'timer') {
    let time = data.time;
    let minutes = Math.floor(time / 60);
    let seconds = time % 60;
    let timer_text = `남은시간 : ${minutes}분 ${seconds}초`;
    $('#timer').text(timer_text);
  } else if (command === 'range') {
    let value = data.value;
    let socket_id = data.user_info.socket_id;
    $(`#${socket_id}`).filter('.players_range').val(value);
  } else if (command === 'failed') {
    let reason = data.reason;
    let socket_id = data.user_info.socket_id;

    if (reason === 'over_speed') {
      $('.players_result').filter(`#${socket_id}`).text('과속했습니다!');
      $('.players_range').filter(`#${socket_id}`).attr('disabled', true);
    } else if (reason === 'captured') {
      $('.players_result').filter(`#${socket_id}`).text('술래에게 잡혔습니다!');
      $('.players_range').filter(`#${socket_id}`).attr('disabled', true);
    } else if (reason === 'mouse_up') {
      $('.players_result').filter(`#${socket_id}`).text('마우스에서 손을 뗐습니다!');
      $('.players_range').filter(`#${socket_id}`).attr('disabled', true);
    } else if (reason === 'disconnect') {
      $('.players_result').filter(`#${socket_id}`).text('연결이 끊어졌습니다!');
      $('.players_range').filter(`#${socket_id}`).attr('disabled', true);
    }
  } else if (command === 'finished') {
    let socket_id = data.user_info.socket_id;
    $('.players_result').filter(`#${socket_id}`).text('완주했습니다!!');
    $('.players_range').filter(`#${socket_id}`).attr('disabled', true);
  } else if (command === 'end') {
    endGame(data);
  } else if (command === 'is_on_game') {
    let user_info = { user_id: user_id };
    let room_info = { room_id: room_id };
    if (on_game === true) {
      socket.emit('game', { command: 'is_on_game', on_game: true, user_info: user_info, room_info: room_info });
    }
  }
});

let timer_range_checker = null;
let timer_send_range = null;

// 게임 시작 함수
function startGame(data) {
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
    if (Math.abs(speed) >= MAX_SPEED) {
      gameFailed('over_speed');
    }

    // 무궁화 꽃이 피었습니다 일때 움직임 감지
    else if (hibiscus === true && Math.abs(speed) > 0) {
      gameFailed('captured');
    }

    // 결승선 도달
    else if (current_value === '10000') {
      gameFinished();
    }

    previous_value = current_value;
  }, 100);

  timer_send_range = setInterval(() => {
    current_value = $('#range').val();
    let user_info = { user_id: user_id };
    let room_info = { room_id: room_id };
    let output = { command: 'range', value: current_value, user_info: user_info, room_info: room_info };
    socket.emit('game', output);
  }, 1000);

  // 마우스 뗌 감지
  $('#range').on('mousedown', (e) => {
    console.log('마우스 누름');
    $('#range').on('mouseup', (e) => {
      console.log('마우스 뗌');
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

function gameFailed(reason) {
  let user_info = { user_id: user_id };
  let room_info = { room_id: room_id };
  $('#range').attr('disabled', true);
  on_game = false;

  if (reason === 'over_speed') {
    $('#result').text('과속했습니다!');
  } else if (reason === 'captured') {
    $('#result').text('술래에게 잡혔습니다!');
  } else if (reason === 'mouse_up') {
    $('#result').text('마우스에서 손을 뗐습니다!');
  }

  let output = { command: 'failed', reason: reason, user_info: user_info, room_info: room_info };
  socket.emit('game', output);

  clearInterval(timer_range_checker);
  clearInterval(timer_send_range);
}

function gameFinished() {
  $('#result').text('완주했습니다!!');
  $('#range').attr('disabled', true);
  on_game = false;

  let user_info = { user_id: user_id };
  let room_info = { room_id: room_id };
  let output = { command: 'finished', user_info: user_info, room_info: room_info };
  socket.emit('game', output);

  clearInterval(timer_range_checker);
  clearInterval(timer_send_range);
}

function endGame(data) {
  console.log(data);

  // 통과한 사람과 실패한 사람의 리스트
  let finished = data.finished;
  let failed = data.failed;
  $('.result').show();

  $('.first111').text(finished[0]);
  $('.second').text(finished[1]);
  $('.three').text(finished[2]);

  // let output = JSON.stringify(data);
  // let form = document.createElement('form');
  // let input = document.createElement('input');
  // input.setAttribute('type', 'hidden');
  // input.setAttribute('name', 'output');
  // input.setAttribute('value', output);

  // form.appendChild(input);
  // form.setAttribute('method', 'post');
  // form.setAttribute('action', '/result');
  // document.body.appendChild(form);
  // form.submit();
}
