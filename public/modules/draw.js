let blocks = []

let mousedown = false
let holdPoint = null
let holdSize = [0, 0]
let holdColor = null

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

class SoundBlock {
  constructor(pos, size, color) {
    this.pos = pos
    this.size = size
    this.color = color
  }

  draw() {
    ctx.beginPath()
    ctx.rect(...this.pos, ...this.size)
    ctx.fillStyle = this.color
    ctx.fill()
  }
}

const getCursorPosition = (canvas, event) => {
  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  return [x, y]
}

const onMouseDown = (e) => {
  const pos = getCursorPosition(canvas, e)
  holdColor = `rgb(
    ${Math.floor(Math.random() * 255)},
    ${Math.floor(Math.random() * 255)},
    ${Math.floor(Math.random() * 255)}
  )`
  holdPoint = pos
  mousedown = true
}

const onMouseMove = (e) => {
  if (!mousedown) return
  const cursorPos = getCursorPosition(canvas, e)
  holdSize = [cursorPos[0] - holdPoint[0], cursorPos[1] - holdPoint[1]]

}

const onMouseUp = (e) => {
  if (!mousedown) return
  blocks.push(new SoundBlock(holdPoint, holdSize, holdColor))
  mousedown = false

  holdPoint = null
  holdSize = [0, 0]
  holdColor = null
}

const drawHold = () => {
  ctx.beginPath()
  ctx.rect(...holdPoint, ...holdSize)
  ctx.fillStyle = holdColor
  ctx.fill()
}

const draw = () => {
  for (let block of blocks) {
    block.draw()
  }
  if (holdPoint !== null) drawHold()
}

export { draw, onMouseDown, onMouseMove, onMouseUp }
