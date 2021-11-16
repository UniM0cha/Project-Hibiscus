const express = require('express');
const app = express();
const port = 8424;

app.listen(port, () => {
  console.log(`Listening at ${port}`);
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});