require('dotenv').config()
require('./routes/gallery')
require('./routes/auth')
require('./routes/user')
require('./routes/editor')
const http = require('http')
const { handleRequest } = require('./router')
const { sessionMiddleware } = require('./session')

const PORT = process.env.PORT || 3000

const server = http.createServer((req, res) => {
    sessionMiddleware(req, res, () => handleRequest(req, res))
})

server.listen(PORT)