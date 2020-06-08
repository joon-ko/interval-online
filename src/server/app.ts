import {
  DeployPayload, UpdatePayload, SyncPayload
} from '../interfaces';

const express = require('express')
const app = express()
const http = require('http').createServer(app)
const sio = require('socket.io')(http)
const port = 3000

app.use(express.static('public'))
app.get('/', (req, res) => res.sendFile('index.html', {root: __dirname}))

const blocks: Array<DeployPayload> = [];
let curID = 0;

/* Finds a block by its ID. If not found, returns null. */
const getBlockByID = (id: number): DeployPayload => {
  for (const block of blocks) {
    if (block.id === id) return block
  }
  return null
}

sio.on('connection', (socket: SocketIO.Socket): void => {
  console.log('a user connected')

  // sync with server state
  const payload: SyncPayload = {
    curID: curID,
    blocks: blocks
  }
  socket.emit('sync', payload);

  socket.on('disconnect', (): void => {
    console.log('a user disconnected')
  })

  socket.on('deploy', (data: DeployPayload): void => {
    // update server state
    blocks.push(data)
    curID = data.id + 1

    socket.broadcast.emit('deploy', data)
  })

  socket.on('update', (data: UpdatePayload): void => {
    // update server state
    let block: DeployPayload = getBlockByID(data.id)
    if (block !== null) {
      block = Object.assign(block, data);
    } else {
      console.log('could not find block by id!')
    }

    socket.broadcast.emit('update', data)
  })
})

http.listen(port, () => console.log(`running on port ${port}`))
