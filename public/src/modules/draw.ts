let blocks: SoundBlock[] = [];

let mousedown: boolean = false;
let holdPoint: Point = null;
let holdSize: Size = {width: 0, height: 0};
let holdColor: string = null;

const canvas = <HTMLCanvasElement> document.getElementById('canvas');
const ctx = <CanvasRenderingContext2D> canvas.getContext('2d');

interface Point {
  x: number,
  y: number
}

interface Size {
  width: number,
  height: number
}

class SoundBlock {
  pos: Point; size: Size; color: string;
  constructor(pos: Point, size: Size, color: string) {
    this.pos = pos;
    this.size = size;
    this.color = color;
  }

  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.fillRect(this.pos.x, this.pos.y, this.size.width, this.size.height);
  }
}

const getCursorPosition = (canvas: HTMLCanvasElement, e: MouseEvent): Point => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return {x: x, y: y};
}

const onMouseDown = (e: MouseEvent): void => {
  const pos = getCursorPosition(canvas, e);
  holdColor = `rgb(
    ${Math.floor(Math.random() * 255)},
    ${Math.floor(Math.random() * 255)},
    ${Math.floor(Math.random() * 255)}
  )`;
  holdPoint = pos;
  mousedown = true;
}

const onMouseMove = (e: MouseEvent): void => {
  if (!mousedown) return;
  const cursorPos = getCursorPosition(canvas, e);
  holdSize = {
    width: cursorPos.x - holdPoint.x,
    height: cursorPos.y - holdPoint.y
  };
}

const onMouseUp = (e: MouseEvent): void => {
  if (!mousedown) return;
  blocks.push(new SoundBlock(holdPoint, holdSize, holdColor));
  mousedown = false;

  holdPoint = null;
  holdSize = {width: 0, height: 0};
  holdColor = null;
}

const drawHold = (): void => {
  ctx.beginPath();
  ctx.fillStyle = holdColor;
  ctx.fillRect(holdPoint.x, holdPoint.y, holdSize.width, holdSize.height);
}

const draw = (): void => {
  for (let block of blocks) {
    block.draw();
  }
  if (holdPoint !== null) drawHold();
}

export { draw, onMouseDown, onMouseMove, onMouseUp }
