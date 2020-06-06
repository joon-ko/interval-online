const canvas = <HTMLCanvasElement> document.getElementById('canvas');
const ctx = <CanvasRenderingContext2D> canvas.getContext('2d');

const MIN_BLOCK_LENGTH = 25;
const LIGHT_GREEN = `rgb(145, 242, 138)`;
const LIGHT_RED = `rgb(242, 138, 145)`;

interface Point {
  x: number,
  y: number
}

interface Size {
  width: number,
  height: number
}

interface Payload {
  type: string,
  info: any
}

class SoundBlock {
  pos: Point;
  size: Size;
  color: string;

  constructor(pos: Point, size: Size, color: string) {
    this.pos = pos;
    this.size = size;
    this.color = color;
  }

  draw() {
    ctx.beginPath();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.pos.x, this.pos.y, this.size.width, this.size.height);
  }
}

class SoundBlockHandler {
  socket: SocketIOClient.Socket;

  blocks: SoundBlock[];

  mousedown: boolean;
  keydown: boolean;

  normPoint: Point;
  normSize: Size;
  holdPoint: Point;
  holdColor: string;

  dragBlock: SoundBlock;
  dragPoint: Point;
  originalPoint: Point;
  dragSize: Size;

  constructor() {
    this.socket = window.io();
    this.socket.on('deploy', this.onDeploy);

    this.blocks = [];

    this.mousedown = false;
    this.keydown = false;

    this.normPoint = null;
    this.normSize = {width: 0, height: 0};
    this.holdPoint = null;
    this.holdColor = null;

    this.dragBlock = null;
    this.dragPoint = null;
    this.originalPoint = null;
    this.dragSize = {width: 0, height: 0};
  }

  onMouseDown = (e: MouseEvent): void => {
    this.mousedown = true;
    const cursor = this.getCursorPosition(canvas, e);
    const mousedOverBlock = this.getMousedOverBlock(cursor);
    if (!this.keydown) {
      // disallow drawing a block on top of another block
      if (mousedOverBlock === null) {
        this.holdColor = 'LIGHT_GREEN';
        this.holdPoint = cursor;
        this.normPoint = cursor;
      }
    } 
    else {
      if (mousedOverBlock !== null) {
        this.dragBlock = mousedOverBlock;
        this.dragPoint = cursor;
        this.originalPoint = this.dragBlock.pos;
      }
    }
  }

  onMouseMove = (e: MouseEvent): void => {
    const cursor = this.getCursorPosition(canvas, e);
    if (!this.mousedown) return;

    if (this.dragBlock === null && this.holdPoint !== null) {
      [this.normPoint, this.normSize] = this.normalizeRectangle(this.holdPoint, cursor)

      this.holdColor = ((this.normSize.width <= MIN_BLOCK_LENGTH)
        || (this.normSize.height <= MIN_BLOCK_LENGTH))
        ? LIGHT_RED : LIGHT_GREEN;

      for (const block of this.blocks) {
        if (this.rectanglesOverlap(this.normPoint, this.normSize, block.pos, block.size)) {
          this.holdColor = LIGHT_RED;
          break;
        }
      }
    }
    else if (this.dragBlock !== null) {
      this.dragSize = {
        width: cursor.x - this.dragPoint.x,
        height: cursor.y - this.dragPoint.y
      };
      this.dragBlock.pos = {
        x: this.originalPoint.x + this.dragSize.width,
        y: this.originalPoint.y + this.dragSize.height
      };
    }
  }

  onMouseUp = (e: MouseEvent): void => {
    if (!this.mousedown) return;
    const cursor = this.getCursorPosition(canvas, e);

    if (this.dragBlock === null && this.holdPoint !== null) {
      if (this.holdColor === LIGHT_GREEN) {
        this.holdColor = `rgb(
          ${Math.floor(Math.random() * 255)},
          ${Math.floor(Math.random() * 255)},
          ${Math.floor(Math.random() * 255)}
        )`;
        this.blocks.push(new SoundBlock(this.normPoint, this.normSize, this.holdColor));

        const payload: Payload = {
          type: 'soundBlock',
          info: {
            pos: this.normPoint,
            size: this.normSize,
            color: this.holdColor
          }
        }
        this.socket.emit('deploy', payload)
      }

      this.holdPoint = null;
      this.normSize = {width: 0, height: 0};
      this.holdColor = null;
    }
    else if (this.dragBlock !== null) {
      this.dragBlock = null;
      this.dragPoint = null;
      this.originalPoint = null;
      this.dragSize = {width: 0, height: 0};
    }

    this.mousedown = false;
  }

  onKeyDown = (e: KeyboardEvent): void => {
    if (e.keyCode === 32) this.keydown = true;
  }

  onKeyUp = (e: KeyboardEvent): void => {
    if (e.keyCode === 32) this.keydown = false;
  }

  onDeploy = (data: Payload): void => {
    const { pos, size, color } = data.info;
    this.blocks.push(new SoundBlock(pos, size, color));
  }

  drawHold = (): void => {
    ctx.beginPath();
    ctx.fillStyle = this.holdColor;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(
      this.normPoint.x, this.normPoint.y, this.normSize.width, this.normSize.height
    );
  }

  draw = (): void => {
    ctx.globalAlpha = 1.0;
    for (const block of this.blocks) {
      block.draw();
    }
    if (this.holdPoint !== null) this.drawHold();
  }

  /********************/
  /* HELPER FUNCTIONS */
  /********************/

  /* Gets the cursor position on the given canvas. */
  getCursorPosition = (canvas: HTMLCanvasElement, e: MouseEvent): Point => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return {x: x, y: y};
  }

  /* Returns the earliest deployed SoundBlock that the mouse is currently over, otherwise returns
   * null. */
  getMousedOverBlock = (cursor: Point): SoundBlock => {
    for (const block of this.blocks) {
      const dx = cursor.x - block.pos.x;
      const dy = cursor.y - block.pos.y;
      if ((0 < dx && dx < block.size.width) && (0 < dy && dy < block.size.height)) {
        return block;
      }
    }
    return null;
  }

  /* Given a start and end points that uniquely determine a rectangle, returns the top-left corner
   * and size of the rectangle. */
  normalizeRectangle = (start: Point, end: Point): [Point, Size] => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    if      (dx >= 0 && dy >= 0) return [start, {width: dx, height: dy}];
    else if (dx >= 0 && dy < 0)  return [{x: start.x, y: end.y}, {width: dx, height: -dy}];
    else if (dx < 0  && dy >= 0) return [{x: end.x, y: start.y}, {width: -dx, height: dy}];
    else if (dx < 0  && dy < 0)  return [end, {width: -dx, height: -dy}];
  }

  /* Determine if two rectangles overlap. */
  rectanglesOverlap = (p1: Point, s1: Size, p2: Point, s2: Size): boolean => {
    if (p1.x >= p2.x + s2.width || p2.x >= p1.x + s1.width) return false;
    if (p1.y >= p2.y + s2.height || p2.y >= p1.y + s1.height) return false;
    return true;
  }
}

const soundBlockHandler = new SoundBlockHandler();

export { soundBlockHandler }
