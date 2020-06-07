const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const port = 3000

app.use(express.static('public'))
app.get('/', (req, res) => res.sendFile('index.html', {root: __dirname}))

let blocks = [];
let curID = 0;

/* Finds a block by its ID. If not found, returns null. */
const getBlockByID = (id) => {
  for (const block of blocks) {
    if (block.id === id) return block
  }
  return null
}

io.on('connection', (socket) => {
  console.log('a user connected')

  // sync with server state
  socket.emit('sync', {
    blocks: blocks,
    curID: curID
  });

  socket.on('disconnect', () => {
    console.log('a user disconnected')
  })

  socket.on('deploy', (data) => {
    // update server state
    blocks.push(data)
    curID = data.id + 1

    socket.broadcast.emit('deploy', data)
  })

  socket.on('update', (data) => {
    // update server state
    let block = getBlockByID(data.id)
    if (block !== null) {
      block = Object.assign(block, data);
    } else {
      console.log('could not find block by id!')
    }
    console.log(blocks)
    socket.broadcast.emit('update', data)
  })
})

http.listen(port, () => console.log(`running on port ${port}`))
