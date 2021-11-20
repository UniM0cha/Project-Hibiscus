const mysql = require('mysql');
const db_info = {
  host: '112.151.4.252',
  user: 'solstice',
  password: '1234',
  database: 'hibiscus',
};

module.exports = {
  init: () => {
    return mysql.createConnection(db_info);
  },
  connect: (conn) => {
    conn.connect(function (err) {
      if (err) console.error('mysql connection error : ' + err);
      else console.log('mysql is connected successfully!');
    });
  },
};
