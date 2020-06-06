const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const port = 3000

app.use(express.static('public'))
app.get('/', (req, res) => res.sendFile('index.html', {root: __dirname}))

io.on('connection', (socket) => {
  console.log('a user connected')
  socket.on('disconnect', () => {
    console.log('a user disconnected')
  })
  socket.on('deploy', (data) => {
    socket.broadcast.emit('deploy', data)
  })
})

http.listen(port, () => console.log(`running on port ${port}`))
