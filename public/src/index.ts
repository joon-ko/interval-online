import {
  draw,
  onMouseDown,
  onMouseMove,
  onMouseUp
} from './modules/draw.js'

const canvas = <HTMLCanvasElement> document.getElementById('canvas')
const ctx = <CanvasRenderingContext2D> canvas.getContext('2d')

const resizeCanvas = (): void => {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}
resizeCanvas()

window.addEventListener('resize', resizeCanvas)

canvas.addEventListener('mousedown', onMouseDown)
canvas.addEventListener('mousemove', onMouseMove)
canvas.addEventListener('mouseup', onMouseUp)

window.setInterval(() => {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  draw()
}, 1000/60)
