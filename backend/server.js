require('dotenv').config()
const express = require("express");
const http = require("http");

const app = express();
const PORT = process.env.PORT || 3000;


const server = http.createServer(app);


app.use(express.json())

const session = require('express-session')

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}))
app.use('/api/auth', require('./routes/auth'))
app.use('/api/user', require('./routes/user'))
app.use('/api/gallery', require('./routes/gallery'))
app.use('/api/editor', require('./routes/editor'))

app.get('/h', (req, res) => {
	res.json({ status: 'ok' });
  });


server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
  });
