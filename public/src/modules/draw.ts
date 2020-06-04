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
    ctx.fillStyle = this.color;
    ctx.fillRect(this.pos.x, this.pos.y, this.size.width, this.size.height);
  }
}

class SoundBlockHandler {
  blocks: SoundBlock[];

  mousedown: boolean;
  keydown: boolean;

  holdPoint: Point;
  holdSize: Size;
  holdColor: string;

  dragBlock: SoundBlock;
  dragPoint: Point;
  originalPoint: Point;
  dragSize: Size;

  constructor() {
    this.blocks = [];

    this.mousedown = false;
    this.keydown = false;

    this.holdPoint = null;
    this.holdSize = {width: 0, height: 0};
    this.holdColor = null;

    this.dragBlock = null;
    this.dragPoint = null;
    this.originalPoint = null;
    this.dragSize = {width: 0, height: 0};
  }

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
    for (let block of this.blocks) {
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

  onMouseDown = (e: MouseEvent): void => {
    this.mousedown = true;
    const cursor = this.getCursorPosition(canvas, e);
    if (!this.keydown) {
      this.holdColor = `rgb(
        ${Math.floor(Math.random() * 255)},
        ${Math.floor(Math.random() * 255)},
        ${Math.floor(Math.random() * 255)}
      )`;
      this.holdPoint = cursor;
    } 
    else {
      this.dragBlock = this.getMousedOverBlock(cursor);
      if (this.dragBlock !== null) {
        this.dragPoint = cursor;
        this.originalPoint = this.dragBlock.pos;
      }
    }
  }

  onMouseMove = (e: MouseEvent): void => {
    const cursor = this.getCursorPosition(canvas, e);
    if (!this.mousedown) return;
    if (this.dragBlock === null && this.holdPoint !== null) {
      this.holdSize = {
        width: cursor.x - this.holdPoint.x,
        height: cursor.y - this.holdPoint.y
      };
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
    const cursor = this.getCursorPosition(canvas, e);
    if (!this.mousedown) return;
    if (this.dragBlock === null && this.holdPoint !== null) {
      const [normPoint, normSize] = this.normalizeRectangle(this.holdPoint, cursor)
      this.blocks.push(new SoundBlock(normPoint, normSize, this.holdColor));
      this.mousedown = false;
      this.holdPoint = null;
      this.holdSize = {width: 0, height: 0};
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

  drawHold = (): void => {
    ctx.beginPath();
    ctx.fillStyle = this.holdColor;
    ctx.fillRect(
      this.holdPoint.x, this.holdPoint.y, this.holdSize.width, this.holdSize.height
    );
  }

  draw = (): void => {
    for (let block of this.blocks) {
      block.draw();
    }
    if (this.holdPoint !== null) this.drawHold();
  }
}

const soundBlockHandler = new SoundBlockHandler();

export { soundBlockHandler }
