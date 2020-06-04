import { soundBlockHandler } from './modules/draw.js'

const canvas = <HTMLCanvasElement> document.getElementById('canvas')
const ctx = <CanvasRenderingContext2D> canvas.getContext('2d')

const resizeCanvas = (): void => {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}
resizeCanvas()

window.addEventListener('resize', resizeCanvas)
document.addEventListener('keydown', soundBlockHandler.onKeyDown)
document.addEventListener('keyup', soundBlockHandler.onKeyUp)
canvas.addEventListener('mousedown', soundBlockHandler.onMouseDown)
canvas.addEventListener('mousemove', soundBlockHandler.onMouseMove)
canvas.addEventListener('mouseup', soundBlockHandler.onMouseUp)

window.setInterval(() => {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  soundBlockHandler.draw()
}, 1000/60)
