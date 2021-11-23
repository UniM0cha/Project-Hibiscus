let rooms = [
  {
    room_id: '3000',
    user: {
      socket_id: 'eirwiwirtgr',
      user_id: 'test',
    },
  },
];

function checkRoomID(rooms) {
  if (rooms.room_id == this) {
    return true;
  } else {
    return false;
  }
}

const room_id = '3000';

let result = rooms.some(checkRoomID, room_id);
// console.log(rooms.includes({room_id: '3000',user: {socket_id: 'eirwiwirtgr',user_id: 'test',},}));
// console.log(rooms.some(checkRoomID));

console.log(result);

// const arr = [{name: 'apple'}, {name: 'banana'}];

// function checkApple(element)  {
//   if(element.name === 'apple')  {
//     return true;
//   }
// }

// document.writeln(arr.some(checkApple));

// room_id 확인 함수
function checkRoomID(rooms) {
  if (rooms.room_id == this) {
    return true;
  } else {
    return false;
  }
}


function joinRoom(socket, roomCode, user_id) {
  // 소켓으로 조인 + rooms 변수에 객체 추가

  // roomCode가 이미 방으로 만들어져있을 경우
  if (rooms.some(checkRoomID, roomCode)) {
    socket.join(roomCode);

    // 원래 방에 user만 추가하고..
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].room_id === roomCode) {
        
        let dataToPush = {
          socket_id: socket.id,
          user_id: user_id,
        };

        rooms[i].joinedUser.push(dataToPush);
      }
    }
  }
  // 없을 경우에는
  else {
    socket.join(roomCode);
    
    // 새로 방을 추가해야함.
    let dataToPush = {
      room_id: roomCode,
      joinedUser: [
        {
          socket_id: socket.id,
          user_id: user_id,
        },
      ],
    };

    rooms.push(dataToPush);
  }
}