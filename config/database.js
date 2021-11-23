const mysql = require('mysql');
const connection = mysql.createConnection({
  host: '112.151.4.252',
  user: 'solstice',
  password: '1234',
  database: 'hibiscus',
});

connection.connect();

let sql = 'SELECT * FROM participant';
connection.query(sql, function (err, rows) {
  if (err) console.log(err);
  for (var i = 0; i < rows.length; i++) {
    console.log(rows[i]['roomNo']);
    // for ( var keyNm in rows[i]) {
    //   console.log("key : " + keyNm + ", value : " + rows[i][keyNm]);
    // }
  }
  // console.log('fields', fields); //fields는 컬럼을 의미한다.
});

// sql = 'INSERT INTO participant (roomNo, socketID) VALUE("1213", "asdfadf")';
// connection.query(sql, function (err, rows, fields) {
//   if (err) console.log(err);
//   console.log('rows', rows); //row는 배열이다.
//   console.log('fields', fields); //fields는 컬럼을 의미한다.
// });

connection.end();//접속이 끊긴다.

// module.exports = {
//   init: () => {
//     return mysql.createConnection(db_info);
//   },
//   connect: (conn) => {
//     conn.connect(function (err) {
//       if (err) console.error('mysql connection error : ' + err);
//       else console.log('mysql is connected successfully!');
//     });
//   },
// };


// var mysql = require('mysql');
// var connection = mysql.createConnection({
//     host     : 'localhost',
//     user     : 'root',
//     password : '1111',
//     database : 'o2'
// });

// connection.connect();

// var sql = 'SELECT * FROM topic';
// connection.query(sql, function (err, rows, fields) {
//   if (err) console.log(err);
//   console.log('rows', rows); //row는 배열이다.
//   console.log('fields', fields); //fields는 컬럼을 의미한다.
// });

// connection.end();//접속이 끊긴다.



// async function getRoomNumberArr() {

//   return new Promise((resolve, reject) => {
//     // 데이터베이스에서 방 번호를 받아서 rooms 배열에 추가
//     let rooms = [];
//     let sql = 'SELECT * FROM enabled_room';
//     connection.query(sql, (err, rows) => {
//       if (err) console.log(err);
//       for (let i = 0; i < rows.length; i++) {
//         rooms.push(rows[i]['roomNo']);
//       }
//       console.log('현재 열려있는 방 : ', rooms);
//       resolve(rooms);
//     });
//   });
// }

// async function isRoomNumber(roomNumber) {
//   let rooms = await getRoomNumberArr();
//   if (rooms.includes(roomNumber)) {
//     return true;
//   } else {
//     return false;
//   }
// }