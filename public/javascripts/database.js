const mysql = require('mysql');
const connection = mysql.createConnection({
  host : '112.151.4.252',
  user : 'solstice',
  password : '1234',
  database : 'hibiscus'
});

connection.connect();

connection.query('SQL문', (error, rows, fields) => {
  if (error) throw error;
  console.log('User info is: ', rows);
});

connection.end();