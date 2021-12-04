$(() => {
  $('#btnCreateRoom').click(() => {
    let user_id = $('#nickname').val();
    if (user_id === '') {
      alert('닉네임을 입력해주세요!');
    } else {
      location.href = `/create_room?user_id=${user_id}`;
    }
  });
  
  $('#btnEnterRoom').click(() => {
    let user_id = $('#nickname').val();
    if (user_id == '') {
      alert('닉네임을 입력해주세요!');
    } else {
      location.href = `/join_room?user_id=${user_id}`;
    }
  });

  $('#test').click(() => {
    let f = document.createElement('form');
    f.setAttribute('method', 'post');
    f.setAttribute('action', '/join_room/2222');
    document.body.appendChild(f);
    f.submit();
  });
})